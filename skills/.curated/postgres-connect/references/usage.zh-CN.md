# postgres-connect 使用指南（中文）

本 skill 用 `psql` 连接 PostgreSQL，并通过 `env.yaml` 维护多个数据源 profile。

## 1. 前置条件

- 本机需要有 `psql`（PostgreSQL client）。
- 不要把密码写进仓库；推荐用 `password_env` / `url_env` 引用环境变量。
- 允许在 `env.yaml` 里直接写明文 `password`，但需要你自己确保：文件不被提交（`.gitignore`）、本机权限保护、避免在共享机器/日志里泄露。

## 1.1 密码不要交给 LLM（重要）

- 不要把包含真实密码的 `env.yaml` 粘贴到对话里。
- 如需让 LLM 帮你排查配置，请先脱敏：
  - `python "<path-to-skill>/scripts/redact_env_yaml.py" ./env.yaml > ./env.redacted.yaml`
  - 然后只把 `env.redacted.yaml` 的内容发出来。
- 建议给本地配置文件加权限保护：`chmod 600 ./env.yaml`

## 2. 配置文件位置（统一）

默认读取：`./env.yaml`（当前工作目录下）

如需临时使用其他路径：
- 命令行：`--config /path/to/env.yaml`
- 或环境变量：`export PG_SKILL_CONFIG=/path/to/env.yaml`

## 3. 配置格式（必须使用 `postgres-connect:` 根节点）

```yaml
postgres-connect:
  default: dev
  datasources:
    dev:
      host: /tmp
      port: 5432
      dbname: lionsaid_dev
      user: postgres
      password_env: PG_DEV_PASSWORD
      sslmode: prefer
      connect_timeout: 5

    prod_ro:
      url_env: DATABASE_URL_PROD_RO
      sslmode: require
      connect_timeout: 5
```

说明：
- `default`：不传 `--profile` 时使用的 profile 名称。
- `datasources.<name>`：一个 profile。
- 两种连接方式：
  - **分字段**：`host/port/dbname/user`（可选 `password_env/password`）
  - **连接串**：`url_env`（推荐）或 `url`（必须是完整 DSN）
- `password_env` 的值是“环境变量名”，例如 `PG_DEV_PASSWORD`，而不是密码本身。
- `url_env` 的值是“环境变量名”，该环境变量的值应为完整 DSN（例如 `postgresql://...`）。
- `url` 必须直接填写完整 DSN（必须包含 `://`）；不要把环境变量名写到 `url` 里（要用 `url_env`）。

## 4. 本机连接建议（Postgres.app / 本地实例）

如果你用 `localhost/127.0.0.1` 走 TCP，在某些受限环境会遇到 `Operation not permitted`。
此时建议改为 Unix socket：
- `host: /tmp`
- 或尝试 `host: /var/run/postgresql`

## 5. 常用命令

连通性检查：
- `python "<path-to-skill>/scripts/pg_check.py" --profile dev`

一键汇总（推荐，少跑多条 SQL）：
- `python "<path-to-skill>/scripts/pg_report.py" --profile dev --lang zh`
- 仅在需要时列出“实例级别数据库清单/角色数”：加 `--include-databases`
- 强制指定连接到某个数据库（仅对非 URL profile）：加 `--database lionsaid_dev`

只读查询：
- `python "<path-to-skill>/scripts/pg_query.py" --profile dev --sql "select now()"`
- TSV 输出：`--format tsv`
- 默认拒绝写/DDL；如确认要写：加 `--allow-write`

导出 schema（JSON）：
- `python "<path-to-skill>/scripts/pg_introspect.py" --profile dev --schema public`

## 6. 环境变量示例

分字段（password_env）：
- `export PG_DEV_PASSWORD='...'`

连接串（url_env）：
- `export DATABASE_URL_PROD_RO='postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require'`

## 7. 常见问题

- 提示 `no password supplied`：说明需要密码但没设置对应 env var；脚本使用 `psql -w` 不会交互式询问密码。
- 提示 `Operation not permitted` 且 host 是 `localhost/127.0.0.1`：优先改用 socket（`/tmp`）。
- profile 用了 `url_env` 时不能用 `--database` 覆盖：请把库名写进 URL。
