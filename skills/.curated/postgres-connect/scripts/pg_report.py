import argparse
import json
import sys

from pg_lib import (
    PgSkillError,
    add_common_args,
    load_connection_from_args,
    override_database,
    redact_connection_hint,
    run_psql,
)


REPORT_SQL_DB_ONLY = r"""
select json_build_object(
  'ok', true,
  'now', now(),
  'version', version(),
  'server_version_num', current_setting('server_version_num')::int,
  'database', current_database(),
  'user', current_user,
  'db_size_bytes', pg_database_size(current_database()),
  'schemas', (
    select coalesce(json_agg(n.nspname order by n.nspname), '[]'::json)
    from pg_namespace n
    where n.nspname <> 'information_schema' and n.nspname not like 'pg\_%' escape '\'
  ),
  'schema_overview', json_build_object(
    'schema', :'schema',
    'tables', (
      select count(*)
      from information_schema.tables
      where table_schema = :'schema' and table_type = 'BASE TABLE'
    ),
    'views', (
      select count(*)
      from information_schema.tables
      where table_schema = :'schema' and table_type = 'VIEW'
    ),
    'matviews', (
      select count(*) from pg_matviews where schemaname = :'schema'
    ),
    'functions', (
      select count(*)
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = :'schema'
    ),
    'triggers', (
      select count(*)
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = :'schema' and not t.tgisinternal
    )
  ),
  'extensions', (
    select coalesce(json_agg(e.extname order by e.extname), '[]'::json)
    from pg_extension e
  )
)::text;
"""

REPORT_SQL_WITH_CLUSTER = r"""
select json_build_object(
  'ok', true,
  'now', now(),
  'version', version(),
  'server_version_num', current_setting('server_version_num')::int,
  'database', current_database(),
  'user', current_user,
  'db_size_bytes', pg_database_size(current_database()),
  'schemas', (
    select coalesce(json_agg(n.nspname order by n.nspname), '[]'::json)
    from pg_namespace n
    where n.nspname <> 'information_schema' and n.nspname not like 'pg\_%' escape '\'
  ),
  'schema_overview', json_build_object(
    'schema', :'schema',
    'tables', (
      select count(*)
      from information_schema.tables
      where table_schema = :'schema' and table_type = 'BASE TABLE'
    ),
    'views', (
      select count(*)
      from information_schema.tables
      where table_schema = :'schema' and table_type = 'VIEW'
    ),
    'matviews', (
      select count(*) from pg_matviews where schemaname = :'schema'
    ),
    'functions', (
      select count(*)
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = :'schema'
    ),
    'triggers', (
      select count(*)
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = :'schema' and not t.tgisinternal
    )
  ),
  'extensions', (
    select coalesce(json_agg(e.extname order by e.extname), '[]'::json)
    from pg_extension e
  ),
  'databases', (
    select coalesce(json_agg(d.datname order by d.datname), '[]'::json)
    from pg_database d
    where d.datistemplate = false
  ),
  'roles_count', (select count(*) from pg_roles)
)::text;
"""


def _render_zh(payload: dict) -> str:
    overview = payload.get("schema_overview") or {}
    exts = payload.get("extensions") or []

    lines = [
        f"- 连接目标：PostgreSQL 实例（server_version_num={payload.get('server_version_num')}）",
        f"- 当前数据库：{payload.get('database')}",
        f"- 当前用户：{payload.get('user')}",
        f"- 数据库大小：{payload.get('db_size_bytes')} bytes",
        f"- Schema 列表（不含系统 schema）：{', '.join(payload.get('schemas') or []) or '(none)'}",
        (
            "- Schema 概况："
            f"{overview.get('schema')} 下 表={overview.get('tables')}、视图={overview.get('views')}、"
            f"物化视图={overview.get('matviews')}、函数={overview.get('functions')}、触发器={overview.get('triggers')}"
        ),
        f"- 已安装扩展：{', '.join(exts) or '(none)'}",
    ]

    dbs = payload.get("databases")
    if isinstance(dbs, list):
        lines.append(f"- 非模板数据库：{', '.join(dbs) or '(none)'}")

    roles_count = payload.get("roles_count")
    if roles_count is not None:
        lines.append(f"- 角色数量：{roles_count}")

    return "\n".join(lines) + "\n"


def _render_en(payload: dict) -> str:
    overview = payload.get("schema_overview") or {}
    exts = payload.get("extensions") or []

    lines = [
        f"- Target: PostgreSQL instance (server_version_num={payload.get('server_version_num')})",
        f"- Database: {payload.get('database')}",
        f"- User: {payload.get('user')}",
        f"- DB size: {payload.get('db_size_bytes')} bytes",
        f"- Schemas (excluding system): {', '.join(payload.get('schemas') or []) or '(none)'}",
        (
            "- Schema overview: "
            f"{overview.get('schema')} tables={overview.get('tables')}, views={overview.get('views')}, "
            f"matviews={overview.get('matviews')}, functions={overview.get('functions')}, triggers={overview.get('triggers')}"
        ),
        f"- Extensions: {', '.join(exts) or '(none)'}",
    ]

    dbs = payload.get("databases")
    if isinstance(dbs, list):
        lines.append(f"- Databases (non-template): {', '.join(dbs) or '(none)'}")

    roles_count = payload.get("roles_count")
    if roles_count is not None:
        lines.append(f"- Roles count: {roles_count}")

    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="One-shot PostgreSQL report (JSON + human summary) via psql.")
    add_common_args(parser)
    parser.add_argument("--schema", default="public", help="Schema name for overview counts (default: public).")
    parser.add_argument("--database", help="Override the target database for host/port/user/dbname profiles.")
    parser.add_argument(
        "--include-databases",
        action="store_true",
        help="Include cluster-wide database list and roles count (queries pg_database/pg_roles).",
    )
    parser.add_argument("--format", choices=["text", "json"], default="text")
    parser.add_argument("--lang", choices=["zh", "en"], default="zh")
    args = parser.parse_args()

    try:
        _, _, conn = load_connection_from_args(args)
        if args.database:
            conn = override_database(conn, args.database)

        sql = REPORT_SQL_WITH_CLUSTER if args.include_databases else REPORT_SQL_DB_ONLY
        proc = run_psql(
            conn,
            ["-qAt", "-v", f"schema={args.schema}"],
            input_text=sql,
            capture_output=True,
        )
        if proc.returncode != 0:
            sys.stderr.write(f"psql failed: {redact_connection_hint(conn)}\n")
            sys.stderr.write(proc.stderr or "")
            return proc.returncode

        payload = json.loads((proc.stdout or "").strip() or "{}")
        if args.format == "json":
            sys.stdout.write(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
        else:
            sys.stdout.write(_render_zh(payload) if args.lang == "zh" else _render_en(payload))
        return 0
    except PgSkillError as exc:
        sys.stderr.write(str(exc).rstrip() + "\n")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
