import argparse
import json
import sys

from pg_lib import PgSkillError, add_common_args, load_connection_from_args, redact_connection_hint, run_psql


def _suggest_fixes(stderr_text: str) -> list[str]:
    s = (stderr_text or "").lower()
    suggestions: list[str] = []

    if "no password supplied" in s or "fe_sendauth" in s:
        suggestions.append(
            "缺少密码：如果 profile 配了 `password_env`，请先 `export <ENV_VAR>='...'`；"
            "脚本使用 `psql -w` 不会交互式询问密码。"
        )
    if "operation not permitted" in s and ("127.0.0.1" in s or "localhost" in s):
        suggestions.append("看起来本机 TCP 连接被限制/拦截：如果你在用 Postgres.app，建议把 profile 的 host 改成 `/tmp` 走 Unix socket。")
        suggestions.append("也可以尝试其他 socket 目录：`/var/run/postgresql`。")
        suggestions.append("如果你确实要走 TCP（localhost/127.0.0.1），在 network 受限的环境里需要对该命令授予网络权限（approval）。")
    if "password authentication failed" in s:
        suggestions.append("密码认证失败：确认 `password_env` 指向的环境变量已 export，且用户名/密码正确。")
    if "does not exist" in s and "database" in s:
        suggestions.append("数据库不存在：确认 `dbname` 拼写，或先创建库（例如 `createdb <dbname>`）。")
    if "does not exist" in s and "role" in s:
        suggestions.append("用户/角色不存在：确认 `user` 配置正确，或先创建该角色。")
    if "no pg_hba.conf entry" in s:
        suggestions.append("pg_hba.conf 拒绝连接：需要在服务端放通来源/用户/库，并匹配 SSL 模式。")
    if "connection refused" in s:
        suggestions.append("连接被拒绝：确认 PostgreSQL 正在运行、端口正确，且监听了目标地址。")
    if "timeout expired" in s:
        suggestions.append("连接超时：检查 host/port 是否可达，或适当增大 `connect_timeout`。")
    if "no such file or directory" in s and "is the server running locally" in s:
        suggestions.append("找不到 Unix socket：如果你配置了 socket 目录（如 `/tmp`），确认服务端 socket 文件实际在该目录。")

    return suggestions


def _print_next_steps(config_path, profile_name: str) -> None:
    sys.stdout.write("\n下一步建议（同一份 config/profile 可复用）：\n")
    sys.stdout.write(
        f'- 一键汇总：python "<path-to-skill>/scripts/pg_report.py" --config "{config_path}" --profile {profile_name} --lang zh\n'
    )
    sys.stdout.write(
        f'- 导出 schema JSON：python "<path-to-skill>/scripts/pg_introspect.py" --config "{config_path}" --profile {profile_name} --schema public\n'
    )
    sys.stdout.write(
        f'- 执行只读查询：python "<path-to-skill>/scripts/pg_query.py" --config "{config_path}" --profile {profile_name} --sql "select now()"\n'
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Check PostgreSQL connectivity using a configured datasource.")
    add_common_args(parser)
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    try:
        config_path, profile_name, conn = load_connection_from_args(args)
        sql = (
            "select json_build_object("
            "'ok', true,"
            "'now', now(),"
            "'version', version(),"
            "'database', current_database(),"
            "'user', current_user"
            ")::text;"
        )
        proc = run_psql(conn, ["-qAt", "-c", sql], capture_output=True)
        if proc.returncode != 0:
            sys.stderr.write(
                f"psql failed (profile={profile_name}, config={config_path}): {redact_connection_hint(conn)}\n"
            )
            sys.stderr.write(proc.stderr or "")
            hints = _suggest_fixes(proc.stderr or "")
            if hints:
                sys.stderr.write("\n建议排查：\n")
                for hint in hints:
                    sys.stderr.write(f"- {hint}\n")
            return proc.returncode

        payload = json.loads((proc.stdout or "").strip() or "{}")
        if args.format == "json":
            sys.stdout.write(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
        else:
            sys.stdout.write(
                "OK\n"
                f"- profile: {profile_name}\n"
                f"- database: {payload.get('database')}\n"
                f"- user: {payload.get('user')}\n"
                f"- now: {payload.get('now')}\n"
                f"- version: {payload.get('version')}\n"
            )
            _print_next_steps(config_path, profile_name)
        return 0
    except PgSkillError as exc:
        sys.stderr.write(str(exc).rstrip() + "\n")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
