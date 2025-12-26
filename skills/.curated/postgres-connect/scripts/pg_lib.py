import argparse
import os
import re
import shlex
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


DEFAULT_CONFIG_PATH = Path("env.yaml")
CONFIG_ENV_VAR = "PG_SKILL_CONFIG"


class PgSkillError(RuntimeError):
    pass


def _strip_inline_comment(value: str) -> str:
    in_single = False
    in_double = False
    for idx, ch in enumerate(value):
        if ch == "'" and not in_double:
            in_single = not in_single
        elif ch == '"' and not in_single:
            in_double = not in_double
        elif ch == "#" and not in_single and not in_double:
            return value[:idx].rstrip()
    return value.rstrip()


def _parse_scalar(raw: str) -> Any:
    raw = raw.strip()
    if raw == "":
        return ""
    if (raw.startswith('"') and raw.endswith('"')) or (raw.startswith("'") and raw.endswith("'")):
        return raw[1:-1]
    lowered = raw.lower()
    if lowered in {"null", "none", "~"}:
        return None
    if lowered in {"true", "yes", "on"}:
        return True
    if lowered in {"false", "no", "off"}:
        return False
    if re.fullmatch(r"-?\d+", raw):
        try:
            return int(raw)
        except ValueError:
            return raw
    if re.fullmatch(r"-?\d+\.\d+", raw):
        try:
            return float(raw)
        except ValueError:
            return raw
    return raw


def parse_simple_yaml_mapping(text: str) -> Dict[str, Any]:
    """
    Minimal YAML subset parser for mappings only (indentation with 2 spaces).
    Supports the structure used by references/env-demo.yaml:
      - top-level key: value
      - nested maps using indentation (no lists)
      - comments (# ...) and quoted/unquoted scalars
    """

    root: Dict[str, Any] = {}
    stack: List[Tuple[int, Dict[str, Any]]] = [(0, root)]

    for line_no, original_line in enumerate(text.splitlines(), start=1):
        line = original_line.rstrip("\n")
        if not line.strip() or line.lstrip().startswith("#"):
            continue

        indent = len(line) - len(line.lstrip(" "))
        if indent % 2 != 0:
            raise PgSkillError(f"Invalid indentation at line {line_no}: use 2-space indents.")

        content = line.lstrip(" ")
        if ":" not in content:
            raise PgSkillError(f"Invalid YAML at line {line_no}: expected 'key: value'.")

        key, rest = content.split(":", 1)
        key = key.strip()
        if not key:
            raise PgSkillError(f"Invalid YAML at line {line_no}: empty key.")

        rest = _strip_inline_comment(rest.strip())

        while stack and indent < stack[-1][0]:
            stack.pop()
        if not stack or indent != stack[-1][0]:
            raise PgSkillError(f"Invalid indentation at line {line_no}: unexpected indent level.")

        current = stack[-1][1]
        if rest == "":
            new_map: Dict[str, Any] = {}
            current[key] = new_map
            stack.append((indent + 2, new_map))
        else:
            current[key] = _parse_scalar(rest)

    return root


def resolve_config_path(explicit_path: Optional[str]) -> Path:
    if explicit_path:
        return Path(explicit_path).expanduser()

    env_path = os.environ.get(CONFIG_ENV_VAR)
    if env_path:
        return Path(env_path).expanduser()

    return DEFAULT_CONFIG_PATH


def load_config(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise PgSkillError(
            f"Config not found: {path}\n"
            f"Create one from references/env-demo.yaml, or set {CONFIG_ENV_VAR}, or pass --config."
        )
    try:
        raw = parse_simple_yaml_mapping(path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise PgSkillError(f"Failed to read config: {path} ({exc})") from exc

    # Enforced format:
    #   postgres-connect:
    #     default: dev
    #     datasources: ...
    namespaced = raw.get("postgres-connect")
    if not isinstance(namespaced, dict):
        raise PgSkillError(
            "Invalid config format: missing required root key 'postgres-connect'.\n"
            "Expected:\n"
            "  postgres-connect:\n"
            "    default: dev\n"
            "    datasources:\n"
            "      dev: { ... }\n"
            "See references/env-demo.yaml for an example."
        )
    return namespaced


def pick_profile(config: Dict[str, Any], profile: Optional[str]) -> Tuple[str, Dict[str, Any]]:
    datasources = config.get("datasources")
    if not isinstance(datasources, dict):
        raise PgSkillError("Invalid config: missing 'datasources' mapping.")

    selected = profile or config.get("default")
    if not selected:
        raise PgSkillError("No profile selected: pass --profile or set top-level 'default'.")
    if selected not in datasources:
        raise PgSkillError(f"Unknown profile: {selected} (available: {', '.join(sorted(datasources.keys()))})")

    profile_cfg = datasources[selected]
    if not isinstance(profile_cfg, dict):
        raise PgSkillError(f"Invalid config: profile '{selected}' must be a mapping.")
    return selected, profile_cfg


@dataclass(frozen=True)
class PsqlConnection:
    args: List[str]
    env: Dict[str, str]


def _get_env_required(var_name: str) -> str:
    value = os.environ.get(var_name)
    if value is None or value == "":
        raise PgSkillError(f"Missing required environment variable: {var_name}")
    return value


def build_psql_connection(profile_cfg: Dict[str, Any]) -> PsqlConnection:
    if shutil.which("psql") is None:
        raise PgSkillError("psql not found in PATH. Install PostgreSQL client tools or ensure psql is available.")

    env: Dict[str, str] = dict(os.environ)
    env.setdefault("PGAPPNAME", "codex-postgres-connect")

    sslmode = profile_cfg.get("sslmode")
    if isinstance(sslmode, str) and sslmode:
        env["PGSSLMODE"] = sslmode

    connect_timeout = profile_cfg.get("connect_timeout")
    if isinstance(connect_timeout, (int, str)) and str(connect_timeout).strip():
        env["PGCONNECT_TIMEOUT"] = str(connect_timeout)

    password = profile_cfg.get("password")
    password_env = profile_cfg.get("password_env")
    if isinstance(password, str) and password:
        env["PGPASSWORD"] = password
    elif isinstance(password_env, str) and password_env:
        password_value = os.environ.get(password_env)
        if password_value:
            env["PGPASSWORD"] = password_value
        else:
            env.pop("PGPASSWORD", None)

    url = profile_cfg.get("url")
    url_env = profile_cfg.get("url_env")
    if isinstance(url, str) and url:
        if "://" not in url:
            raise PgSkillError(
                "Invalid 'url': it must be a full DSN (must include '://'), e.g. "
                "'postgresql://user:pass@host:5432/db?sslmode=require'. "
                "If you want to reference an environment variable, use 'url_env'."
            )
        return PsqlConnection(args=["-d", url], env=env)
    if isinstance(url_env, str) and url_env:
        return PsqlConnection(args=["-d", _get_env_required(url_env)], env=env)

    host = profile_cfg.get("host")
    port = profile_cfg.get("port")
    dbname = profile_cfg.get("dbname")
    user = profile_cfg.get("user")

    missing = [k for k in ["host", "port", "dbname", "user"] if not profile_cfg.get(k)]
    if missing:
        raise PgSkillError(f"Profile is missing required keys: {', '.join(missing)} (or provide url/url_env)")

    return PsqlConnection(
        args=["-h", str(host), "-p", str(port), "-U", str(user), "-d", str(dbname)],
        env=env,
    )


def run_psql(
    conn: PsqlConnection,
    extra_args: List[str],
    *,
    input_text: Optional[str] = None,
    capture_output: bool = False,
) -> subprocess.CompletedProcess:
    # -w: never prompt for password (fail fast in non-interactive runs)
    cmd = ["psql", "-X", "-w", "-v", "ON_ERROR_STOP=1", "-P", "pager=off", *conn.args, *extra_args]
    try:
        return subprocess.run(
            cmd,
            input=input_text,
            text=True,
            env=conn.env,
            capture_output=capture_output,
            check=False,
        )
    except OSError as exc:
        raise PgSkillError(f"Failed to run psql: {exc}") from exc


def add_common_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--config", help=f"Path to env.yaml (default resolution uses {CONFIG_ENV_VAR}/./env.yaml).")
    parser.add_argument("--profile", help="Datasource profile name (defaults to top-level 'default').")


def load_connection_from_args(args: argparse.Namespace) -> Tuple[Path, str, PsqlConnection]:
    config_path = resolve_config_path(args.config)
    config = load_config(config_path)
    profile_name, profile_cfg = pick_profile(config, args.profile)
    if isinstance(profile_cfg.get("password"), str) and profile_cfg.get("password"):
        sys.stderr.write(
            "Warning: this profile uses a plaintext 'password' in env.yaml. "
            "Make sure the file is ignored by git and protected locally (permissions/secret handling).\n"
        )
    conn = build_psql_connection(profile_cfg)
    return config_path, profile_name, conn


def redact_connection_hint(conn: PsqlConnection) -> str:
    args = conn.args[:]
    redacted = []
    for item in args:
        if item.startswith("postgres://") or item.startswith("postgresql://"):
            redacted.append("<postgres-url>")
        else:
            redacted.append(item)
    return " ".join(shlex.quote(x) for x in redacted)


def override_database(conn: PsqlConnection, database: str) -> PsqlConnection:
    if not database:
        return conn

    args = conn.args[:]
    if "-d" not in args:
        return PsqlConnection(args=args + ["-d", database], env=conn.env)

    idx = args.index("-d")
    if idx + 1 >= len(args):
        raise PgSkillError("Invalid connection args: '-d' is missing a value.")

    current = args[idx + 1]
    if isinstance(current, str) and (current.startswith("postgres://") or current.startswith("postgresql://")):
        raise PgSkillError(
            "Cannot override database when profile uses a URL/DSN. "
            "Set the database in the URL (or switch to host/port/user/dbname fields)."
        )

    args[idx + 1] = database
    return PsqlConnection(args=args, env=conn.env)


WRITE_SQL_RE = re.compile(
    r"\b(insert|update|delete|merge|create|alter|drop|truncate|grant|revoke|vacuum|analyze|copy)\b",
    re.IGNORECASE,
)


def assert_read_only_sql(sql: str) -> None:
    if WRITE_SQL_RE.search(sql):
        raise PgSkillError(
            "Refusing to run potentially write/DDL SQL without --allow-write. "
            "If you're sure, re-run with --allow-write."
        )
