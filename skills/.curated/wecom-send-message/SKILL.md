---
name: wecom-send-message
description: Send WeCom (企业微信) application messages by fetching an access_token then calling message/send. Use when you need a repeatable CLI/script to send text or markdown to specific users/parties/tags (or @all) via 企业微信自建应用.
metadata:
  short-description: Send WeCom app messages
  description-zh: 通过获取 access_token 并调用 message/send 发送企业微信自建应用消息。适用于需要可重复的 CLI/脚本向指定用户/部门/标签（或 @all）发送 text 或 markdown。
---

# WeCom Send Message

Send 企业微信 (WeCom) **应用消息** via the official API (gettoken + message/send).

Primary docs: https://developer.work.weixin.qq.com/document/path/90236

## Inputs

- `corp_id` (企业 ID)
- `corp_secret` (应用 Secret)
- `agent_id` (应用 AgentId)
- Recipients: `touser` and/or `toparty` and/or `totag` (use `@all` for all users)
- Message type: `text` or `markdown`

## Quick start

- Text:
  - `python "<path-to-skill>/scripts/send_app_message.py" --touser "@all" --text "hello" --agent-id "$WECOM_AGENT_ID" --corp-id "$WECOM_CORP_ID" --corp-secret "$WECOM_CORP_SECRET"`
- Markdown:
  - `python "<path-to-skill>/scripts/send_app_message.py" --touser "zhangsan|lisi" --markdown "**Build** succeeded" --agent-id "$WECOM_AGENT_ID" --corp-id "$WECOM_CORP_ID" --corp-secret "$WECOM_CORP_SECRET"`

## Workflow

1. Collect required values.
   - Prefer env vars: `WECOM_CORP_ID`, `WECOM_CORP_SECRET`, `WECOM_AGENT_ID`.
2. Choose recipients.
   - Users: `--touser "id1|id2"` (or `@all`)
   - Parties: `--toparty "1|2"`
   - Tags: `--totag "1|2"`
3. Send.
   - Use `--text` or `--markdown`.
   - Add `--safe 1` if the message must be treated as confidential.
4. If the API returns `errcode != 0`, report the full JSON response and confirm:
   - the app is enabled, `agent_id` is correct, and the user is in the app’s visible range
   - IP allowlist / network egress rules are not blocking `qyapi.weixin.qq.com`

## Notes for Codex runs

- Network access may be restricted; if running the script via tools fails due to sandbox/network, rerun the command with escalated permissions.

## Bundled resources

### scripts/send_app_message.py

Fetches `access_token` then sends an app message via `cgi-bin/message/send`.
