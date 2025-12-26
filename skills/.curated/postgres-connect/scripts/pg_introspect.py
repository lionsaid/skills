import argparse
import re
import sys

from pg_lib import PgSkillError, add_common_args, load_connection_from_args, redact_connection_hint, run_psql


_IDENT_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


INTROSPECT_SQL = r"""
with tbl as (
  select
    t.table_schema,
    t.table_name,
    t.table_type
  from information_schema.tables t
  where t.table_schema = :'schema'
    and t.table_type in ('BASE TABLE', 'VIEW')
),
col as (
  select
    c.table_schema,
    c.table_name,
    c.column_name,
    c.ordinal_position,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
  from information_schema.columns c
  where c.table_schema = :'schema'
),
idx as (
  select
    schemaname as table_schema,
    tablename as table_name,
    indexname,
    indexdef
  from pg_indexes
  where schemaname = :'schema'
),
con as (
  select
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema as foreign_table_schema,
    ccu.table_name as foreign_table_name,
    ccu.column_name as foreign_column_name
  from information_schema.table_constraints tc
  left join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
   and tc.table_name = kcu.table_name
  left join information_schema.constraint_column_usage ccu
    on tc.constraint_name = ccu.constraint_name
   and tc.table_schema = ccu.table_schema
  where tc.table_schema = :'schema'
)
select jsonb_pretty(jsonb_build_object(
  'schema', :'schema',
  'tables', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', table_name,
      'type', table_type
    ) order by table_name), '[]'::jsonb)
    from tbl
  ),
  'columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', table_name,
      'name', column_name,
      'position', ordinal_position,
      'data_type', data_type,
      'udt', udt_name,
      'nullable', (is_nullable = 'YES'),
      'default', column_default
    ) order by table_name, ordinal_position), '[]'::jsonb)
    from col
  ),
  'indexes', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', table_name,
      'name', indexname,
      'def', indexdef
    ) order by table_name, indexname), '[]'::jsonb)
    from idx
  ),
  'constraints', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', table_name,
      'name', constraint_name,
      'type', constraint_type,
      'column', column_name,
      'ref_schema', foreign_table_schema,
      'ref_table', foreign_table_name,
      'ref_column', foreign_column_name
    ) order by table_name, constraint_name), '[]'::jsonb)
    from con
  )
))::text;
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Introspect a PostgreSQL schema and print JSON via psql.")
    add_common_args(parser)
    parser.add_argument("--schema", default="public", help="Schema name to introspect (default: public).")
    args = parser.parse_args()

    try:
        if not _IDENT_RE.fullmatch(args.schema):
            raise PgSkillError("--schema must be a simple identifier (letters/numbers/_), e.g. public")

        _, _, conn = load_connection_from_args(args)
        proc = run_psql(
            conn,
            ["-qAt", "-v", f"schema={args.schema}"],
            input_text=INTROSPECT_SQL,
            capture_output=True,
        )
        if proc.returncode != 0:
            sys.stderr.write(f"psql failed: {redact_connection_hint(conn)}\n")
            sys.stderr.write(proc.stderr or "")
            return proc.returncode
        sys.stdout.write(proc.stdout)
        if not proc.stdout.endswith("\n"):
            sys.stdout.write("\n")
        return 0
    except PgSkillError as exc:
        sys.stderr.write(str(exc).rstrip() + "\n")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
