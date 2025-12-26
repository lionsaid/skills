---
name: postgres-connect
description: Connect to PostgreSQL using psql with a multi-datasource YAML config (profiles) and safe-by-default scripts for connectivity checks, querying, and schema introspection.
metadata:
  short-description: Connect/query PostgreSQL via psql
  description-zh: 使用 psql 连接 PostgreSQL，支持通过 YAML 配置文件维护多个数据源（profile），并提供默认安全的连通性检查、查询与 schema 结构导出脚本。
---

# Postgres Connect

Use this skill when you need a repeatable way to connect to PostgreSQL and run checks/queries using `psql`, with support for multiple datasources via a local `env.yaml` config.

## Requirements

- `psql` must be available in the environment.
- Prefer secrets in env vars (do not commit them). Plaintext `password` is supported but not recommended; protect `env.yaml` locally. See `references/env-demo.yaml`.

## Quick start

- Copy the example config and fill in your values:
  - `cp "<path-to-skill>/references/env-demo.yaml" "./env.yaml"`
- Set the password env var referenced by your profile (example):
  - `export PG_DEV_PASSWORD='...'`
  - If the env var is not set, scripts will try connecting without a password (works for some local socket auth setups); scripts run `psql -w` so they will not prompt for a password.
- Connectivity check:
  - `python "<path-to-skill>/scripts/pg_check.py" --profile dev`
- One-shot report (recommended; reduces repeated runs/approvals):
  - `python "<path-to-skill>/scripts/pg_report.py" --profile dev --schema public --lang zh`
  - Add `--database <db>` to target a specific database (for non-URL profiles).
  - Add `--include-databases` if you also want the instance-wide database list.
- Run a read-only query:
  - `python "<path-to-skill>/scripts/pg_query.py" --profile dev --sql "select now()"`
- Introspect schema as JSON:
  - `python "<path-to-skill>/scripts/pg_introspect.py" --profile dev --schema public`

## Notes

- `pg_query.py` blocks common write/DDL statements unless `--allow-write` is provided.
- Default config path: `./env.yaml` (override with `--config` or `PG_SKILL_CONFIG`).
- Config file must use the `postgres-connect:` root key (see `references/env-demo.yaml`).
- More usage (Chinese): `references/usage.zh-CN.md`
- Secret hygiene: do not paste your real `env.yaml` into chat; if you need to share it, use `scripts/redact_env_yaml.py` first.
