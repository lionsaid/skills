import argparse
import sys
from pathlib import Path

from pg_lib import (
    PgSkillError,
    add_common_args,
    assert_read_only_sql,
    load_connection_from_args,
    run_psql,
)


def _read_sql(args: argparse.Namespace) -> str:
    sources = [bool(args.sql), bool(args.sql_file), bool(args.sql_stdin)]
    if sum(sources) != 1:
        raise PgSkillError("Provide exactly one of: --sql, --sql-file, --sql-stdin")

    if args.sql:
        return args.sql
    if args.sql_file:
        path = Path(args.sql_file).expanduser()
        return path.read_text(encoding="utf-8")
    return sys.stdin.read()


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a PostgreSQL query via psql (read-only by default).")
    add_common_args(parser)
    parser.add_argument("--sql", help="SQL to run.")
    parser.add_argument("--sql-file", help="Read SQL from a file.")
    parser.add_argument("--sql-stdin", action="store_true", help="Read SQL from stdin.")
    parser.add_argument("--allow-write", action="store_true", help="Allow potentially write/DDL SQL.")
    parser.add_argument("--format", choices=["table", "tsv"], default="table")
    args = parser.parse_args()

    try:
        _, _, conn = load_connection_from_args(args)
        sql = _read_sql(args).strip()
        if not sql:
            raise PgSkillError("SQL is empty.")
        if not args.allow_write:
            assert_read_only_sql(sql)

        extra_args = ["-c", sql]
        if args.format == "tsv":
            extra_args = ["-qAt", "-F", "\t", "-P", "footer=off", *extra_args]

        proc = run_psql(conn, extra_args, capture_output=False)
        return proc.returncode
    except PgSkillError as exc:
        sys.stderr.write(str(exc).rstrip() + "\n")
        return 2
    except OSError as exc:
        sys.stderr.write(f"{exc}\n")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
