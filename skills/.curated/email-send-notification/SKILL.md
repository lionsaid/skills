---
name: email-send-notification
description: Send an email notification (SMTP) when a task completes. Use when you want a repeatable script/CLI to email users on success or failure, including subject/body templating via arguments or stdin.
metadata:
  short-description: Send email notifications
  description-zh: 在任务完成时通过 SMTP 发送邮件通知。适用于需要可重复的脚本/CLI，在成功或失败时发送邮件，并支持通过参数或 stdin 模板化主题/正文。
---

# Email Send Notification

Send an email via SMTP (TLS/STARTTLS supported) using a small, dependency-free Python script. Useful for notifying a user when an automated task completes (success or failure).

## Inputs

- SMTP: `host`, `port`, `username` (optional), `password` (optional), TLS mode
- Message: `from`, `to` (one or many), `subject`, `body` (arg / file / stdin)

Recommended env vars:

- `SMTP_HOST`, `SMTP_PORT`
- `SMTP_USERNAME`, `SMTP_PASSWORD`
- `SMTP_TLS` (`starttls`, `ssl`, or `none`)
- `SMTP_ADDRESS_FAMILY` (`auto`, `ipv4`, or `ipv6`)
- `EMAIL_FROM`, `EMAIL_TO`

Spring-style alternates also supported:

- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- `MAIL_FROM`, `MAIL_TO`

## Quick start

- Print a config template (env vars):
  - `python "<path-to-skill>/scripts/send_email.py" --print-config-template`
- Send a success email (body as an argument):
  - `python "<path-to-skill>/scripts/send_email.py" --to "$EMAIL_TO" --subject "Task done" --body "All steps completed."`
- Send a failure email (body from stdin):
  - `some_command || (echo "Task failed: exit=$?" | python "<path-to-skill>/scripts/send_email.py" --to "$EMAIL_TO" --subject "Task failed" --body-stdin)`
- Send multipart (text + HTML):
  - `python "<path-to-skill>/scripts/send_email.py" --to "$EMAIL_TO" --subject "Task done" --body "All steps completed." --html "<p><b>All steps completed.</b></p>"`

## Example: Aliyun SMTP

Typical config:

- `SMTP_HOST=smtp.aliyun.com`
- `SMTP_TLS=ssl`
- `SMTP_PORT=465`
- `SMTP_USERNAME=<your mailbox>`
- `SMTP_PASSWORD=<SMTP password / auth code>`

## Deliverability tips (QQ/anti-spam)

If you see bounces like `ESO_LOCAL_SPAM`, try:

- Use a non-test subject/body (avoid only `测试` / very short content); include timestamp/task name.
- Keep `From` aligned with the authenticated mailbox (e.g., `MAIL_FROM=MAIL_USERNAME`).
- Prefer `SMTP_TLS=ssl` + `MAIL_PORT=465` for Aliyun; avoid frequent retries in a short time.
- Enable SPF/DKIM for custom domains; for complex scenarios consider Aliyun Email Push service.

## Workflow

1. Gather SMTP config (prompt the user for any missing fields).
   - Required: `SMTP_HOST`, `SMTP_TLS`, `EMAIL_FROM`, `EMAIL_TO`.
   - Optional: `SMTP_PORT` (auto-defaults to 587 for `starttls`, 465 for `ssl`), `SMTP_USERNAME`, `SMTP_PASSWORD`.
   - If `SMTP_USERNAME` is set, `SMTP_PASSWORD` is required (usually an app password / SMTP auth code).
2. Validate readiness (no send).
   - `python "<path-to-skill>/scripts/send_email.py" --check-config`
3. Send the email (no extra confirmation once prerequisites are met).
   - Provide `--subject`.
   - Provide body via `--body`, `--body-file`, or `--body-stdin`.
4. If the send fails, capture and report:
   - the exception message (auth, TLS, DNS, timeout)
   - whether your network egress allows the SMTP host/port

## Codex behavior (no-confirm send)

When the user asks to send an email notification, guide them to provide the missing SMTP config first (host/port/tls/auth/from/to). Once the config + message inputs are complete and unambiguous, run the send command immediately (do not ask for an additional “confirm send?” step). Only re-prompt when critical details are missing (recipient list / subject / body) or clearly ambiguous.

## Notes for Codex runs

- Network access may be restricted; if running the script via tools fails due to sandbox/network, rerun the command with escalated permissions.

## Troubleshooting: TLS handshake EOF

If you see errors like `ssl.SSLEOFError: EOF occurred in violation of protocol` during TLS handshake (before authentication/delivery), it usually indicates the SMTP port is being blocked/closed by the current network policy or a middlebox.

Try:

- Switch TLS mode/port pairing:
  - `SMTP_TLS=ssl` with `SMTP_PORT=465`
  - `SMTP_TLS=starttls` with `SMTP_PORT=587`
- If your network has broken IPv6, force IPv4:
  - `SMTP_ADDRESS_FAMILY=ipv4` (or pass `--address-family ipv4`)
- If the server (or middlebox) breaks on TLS1.3, pin TLS1.2:
  - `SMTP_TLS_MAX_VERSION=1.2` (or pass `--tls-max-version 1.2`)
- Probe connectivity (no send):
  - `python "<path-to-skill>/scripts/send_email.py" --probe`
  - If you want to validate AUTH too (optional): `python "<path-to-skill>/scripts/send_email.py" --probe --probe-auth`
- Verify from a non-sandboxed environment / different network (e.g. run locally on your machine, or check whether outbound `465/587` is allowed).

## Bundled resources

### scripts/send_email.py

SMTP email sender (supports `none`, `starttls`, `ssl`).
