#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional


WECOM_API_BASE = "https://qyapi.weixin.qq.com/cgi-bin"


def _http_get_json(url: str, timeout_s: float) -> dict:
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            data = resp.read()
    except urllib.error.HTTPError as e:
        data = e.read()
        raise RuntimeError(f"HTTP {e.code} GET failed: {data.decode('utf-8', errors='replace')}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"GET failed: {e}") from e
    try:
        return json.loads(data.decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"Failed to parse JSON: {data[:200]!r}") from e


def _http_post_json(url: str, payload: Dict[str, Any], timeout_s: float) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            data = resp.read()
    except urllib.error.HTTPError as e:
        data = e.read()
        raise RuntimeError(f"HTTP {e.code} POST failed: {data.decode('utf-8', errors='replace')}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"POST failed: {e}") from e
    try:
        return json.loads(data.decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"Failed to parse JSON: {data[:200]!r}") from e


def get_access_token(*, corp_id: str, corp_secret: str, timeout_s: float) -> str:
    qs = urllib.parse.urlencode({"corpid": corp_id, "corpsecret": corp_secret})
    url = f"{WECOM_API_BASE}/gettoken?{qs}"
    resp = _http_get_json(url, timeout_s)
    if resp.get("errcode") != 0:
        raise RuntimeError(f"gettoken failed: {json.dumps(resp, ensure_ascii=False)}")
    token = resp.get("access_token")
    if not token:
        raise RuntimeError(f"gettoken missing access_token: {json.dumps(resp, ensure_ascii=False)}")
    return token


def send_app_message(
    *,
    access_token: str,
    agent_id: int,
    touser: Optional[str],
    toparty: Optional[str],
    totag: Optional[str],
    msgtype: str,
    content: str,
    safe: int,
    enable_id_trans: Optional[int],
    enable_duplicate_check: Optional[int],
    duplicate_check_interval: Optional[int],
    timeout_s: float,
) -> dict:
    url = f"{WECOM_API_BASE}/message/send?access_token={urllib.parse.quote(access_token)}"

    payload: Dict[str, Any] = {
        "agentid": agent_id,
        "msgtype": msgtype,
        "safe": safe,
    }
    if touser:
        payload["touser"] = touser
    if toparty:
        payload["toparty"] = toparty
    if totag:
        payload["totag"] = totag

    if msgtype == "text":
        payload["text"] = {"content": content}
    elif msgtype == "markdown":
        payload["markdown"] = {"content": content}
    else:
        raise ValueError(f"Unsupported msgtype: {msgtype}")

    if enable_id_trans is not None:
        payload["enable_id_trans"] = enable_id_trans
    if enable_duplicate_check is not None:
        payload["enable_duplicate_check"] = enable_duplicate_check
    if duplicate_check_interval is not None:
        payload["duplicate_check_interval"] = duplicate_check_interval

    resp = _http_post_json(url, payload, timeout_s)
    return resp


def _env(name: str) -> Optional[str]:
    v = os.environ.get(name)
    if v is None or not v.strip():
        return None
    return v.strip()


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(description="Send WeCom (企业微信) app message via gettoken + message/send.")
    parser.add_argument("--corp-id", default=_env("WECOM_CORP_ID"), help="WeCom corp_id (or env WECOM_CORP_ID)")
    parser.add_argument(
        "--corp-secret", default=_env("WECOM_CORP_SECRET"), help="WeCom corp_secret (or env WECOM_CORP_SECRET)"
    )
    parser.add_argument("--agent-id", default=_env("WECOM_AGENT_ID"), help="WeCom agent_id (or env WECOM_AGENT_ID)")
    parser.add_argument("--touser", help='Recipients by user IDs, e.g. "zhangsan|lisi" or "@all"')
    parser.add_argument("--toparty", help='Recipients by party IDs, e.g. "1|2"')
    parser.add_argument("--totag", help='Recipients by tag IDs, e.g. "1|2"')
    msg_group = parser.add_mutually_exclusive_group(required=True)
    msg_group.add_argument("--text", help="Text content")
    msg_group.add_argument("--markdown", help="Markdown content")
    parser.add_argument("--safe", type=int, default=0, choices=[0, 1], help="0=not confidential, 1=confidential")
    parser.add_argument("--enable-id-trans", type=int, choices=[0, 1], default=None)
    parser.add_argument("--enable-duplicate-check", type=int, choices=[0, 1], default=None)
    parser.add_argument("--duplicate-check-interval", type=int, default=None)
    parser.add_argument("--timeout", type=float, default=20.0, help="HTTP timeout seconds (default: 20)")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output")

    args = parser.parse_args(argv)

    if not args.corp_id:
        parser.error("--corp-id is required (or env WECOM_CORP_ID)")
    if not args.corp_secret:
        parser.error("--corp-secret is required (or env WECOM_CORP_SECRET)")
    if not args.agent_id:
        parser.error("--agent-id is required (or env WECOM_AGENT_ID)")

    try:
        agent_id_int = int(args.agent_id)
    except ValueError:
        parser.error("--agent-id must be an integer")

    if not (args.touser or args.toparty or args.totag):
        parser.error("At least one of --touser/--toparty/--totag is required")

    msgtype = "text" if args.text is not None else "markdown"
    content = args.text if args.text is not None else args.markdown
    assert content is not None

    token = get_access_token(corp_id=args.corp_id, corp_secret=args.corp_secret, timeout_s=args.timeout)
    resp = send_app_message(
        access_token=token,
        agent_id=agent_id_int,
        touser=args.touser,
        toparty=args.toparty,
        totag=args.totag,
        msgtype=msgtype,
        content=content,
        safe=args.safe,
        enable_id_trans=args.enable_id_trans,
        enable_duplicate_check=args.enable_duplicate_check,
        duplicate_check_interval=args.duplicate_check_interval,
        timeout_s=args.timeout,
    )

    out = json.dumps(resp, ensure_ascii=False, indent=2 if args.pretty else None, sort_keys=False)
    sys.stdout.write(out + "\n")

    errcode = resp.get("errcode")
    return 0 if errcode == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
