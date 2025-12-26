import argparse
import re
import sys
from pathlib import Path


PASSWORD_RE = re.compile(r"^(\s*password\s*:\s*)(.+?)\s*$")
URL_RE = re.compile(r"^(\s*url\s*:\s*)(.+?)\s*$")


def redact_line(line: str) -> str:
    match = PASSWORD_RE.match(line)
    if match:
        return f'{match.group(1)}"<redacted>"\n'

    match = URL_RE.match(line)
    if match:
        value = match.group(2).strip()
        if value.startswith(("postgres://", "postgresql://")):
            return f'{match.group(1)}"<postgres-url-redacted>"\n'
        # If it's likely a variable name, keep it as-is (user can decide).
        return line

    return line


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Redact secrets from env.yaml so it can be safely shared with an LLM (replaces password/url DSNs)."
    )
    parser.add_argument("path", nargs="?", default="env.yaml", help="Path to env.yaml (default: ./env.yaml).")
    args = parser.parse_args()

    path = Path(args.path).expanduser()
    if not path.exists():
        sys.stderr.write(f"File not found: {path}\n")
        return 2

    text = path.read_text(encoding="utf-8")
    redacted = "".join(redact_line(line) for line in text.splitlines(keepends=True))
    sys.stdout.write(redacted)
    if not redacted.endswith("\n"):
        sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

