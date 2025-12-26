#!/usr/bin/env python3
import argparse
import os
import smtplib
import ssl
import sys
import socket
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr, formatdate, make_msgid
from textwrap import dedent
from typing import List, Optional, Tuple


def _env(name: str) -> Optional[str]:
    v = os.environ.get(name)
    if v is None:
        return None
    v = v.strip()
    return v or None


def _env_any(*names: str) -> Optional[str]:
    for name in names:
        v = _env(name)
        if v is not None:
            return v
    return None


def _split_recipients(value: str) -> List[str]:
    parts: List[str] = []
    for chunk in value.replace(";", ",").split(","):
        addr = chunk.strip()
        if addr:
            parts.append(addr)
    return parts


def _read_body(args: argparse.Namespace) -> str:
    if args.body is not None:
        return args.body
    if args.body_file is not None:
        with open(args.body_file, "r", encoding="utf-8") as f:
            return f.read()
    if args.body_stdin:
        return sys.stdin.read()
    raise RuntimeError("Body is required (use --body / --body-file / --body-stdin)")


def _connect_smtp(
    *,
    host: str,
    port: int,
    tls_mode: str,
    timeout_s: float,
    address_family: str,
    tls_min_version: Optional[str],
    tls_max_version: Optional[str],
) -> Tuple[smtplib.SMTP, bool]:
    if tls_mode == "ssl":
        ctx = ssl.create_default_context()
        _configure_tls_versions(ctx, tls_min_version=tls_min_version, tls_max_version=tls_max_version)
        return _SMTP_SSL(host=host, port=port, timeout=timeout_s, context=ctx, address_family=address_family), True
    smtp = _SMTP(host=host, port=port, timeout=timeout_s, address_family=address_family)
    return smtp, False


@dataclass(frozen=True)
class _ResolvedConfig:
    smtp_host: str
    smtp_port: int
    smtp_tls: str
    smtp_username: Optional[str]
    smtp_password: Optional[str]
    address_family: str
    tls_min_version: Optional[str]
    tls_max_version: Optional[str]
    from_addr: str
    from_name: Optional[str]
    to_addrs: List[str]
    cc_addrs: List[str]
    bcc_addrs: List[str]


def _default_port(tls_mode: str) -> int:
    return 465 if tls_mode == "ssl" else 587


def _parse_address_family(value: str) -> str:
    v = (value or "").strip().lower()
    if v in ("auto", "any", ""):
        return "auto"
    if v in ("ipv4", "4", "inet", "af_inet"):
        return "ipv4"
    if v in ("ipv6", "6", "inet6", "af_inet6"):
        return "ipv6"
    raise ValueError(f"invalid address family: {value!r} (expected auto/ipv4/ipv6)")


def _family_candidates(address_family: str) -> List[int]:
    if address_family == "ipv4":
        return [socket.AF_INET]
    if address_family == "ipv6":
        return [socket.AF_INET6]
    return [socket.AF_UNSPEC]


def _create_connection_socket(host: str, port: int, timeout_s: float, address_family: str) -> socket.socket:
    last_exc: Optional[BaseException] = None
    for family in _family_candidates(address_family):
        try:
            addrinfos = socket.getaddrinfo(host, port, family=family, type=socket.SOCK_STREAM)
        except OSError as e:
            last_exc = e
            continue
        for af, socktype, proto, _canonname, sockaddr in addrinfos:
            sock = socket.socket(af, socktype, proto)
            try:
                sock.settimeout(timeout_s)
                sock.connect(sockaddr)
                return sock
            except OSError as e:
                last_exc = e
                try:
                    sock.close()
                except Exception:
                    pass
                continue
    if last_exc is not None:
        raise last_exc
    raise OSError("failed to resolve/connect")


class _SMTP(smtplib.SMTP):
    def __init__(self, *, host: str, port: int, timeout: float, address_family: str):
        self._address_family = address_family
        super().__init__(host=host, port=port, timeout=timeout)

    def _get_socket(self, host: str, port: int, timeout: float) -> socket.socket:  # type: ignore[override]
        return _create_connection_socket(host, port, timeout, self._address_family)


class _SMTP_SSL(smtplib.SMTP_SSL):
    def __init__(self, *, host: str, port: int, timeout: float, context: ssl.SSLContext, address_family: str):
        self._address_family = address_family
        super().__init__(host=host, port=port, timeout=timeout, context=context)

    def _get_socket(self, host: str, port: int, timeout: float) -> ssl.SSLSocket:  # type: ignore[override]
        raw = _create_connection_socket(host, port, timeout, self._address_family)
        return self.context.wrap_socket(raw, server_hostname=host)


_TLS_VERSION_ALIASES = {
    "1": "1.0",
    "1.0": "1.0",
    "1.1": "1.1",
    "1.2": "1.2",
    "1.3": "1.3",
    "tls1": "1.0",
    "tls1.0": "1.0",
    "tls1.1": "1.1",
    "tls1.2": "1.2",
    "tls1.3": "1.3",
}


def _parse_tls_version(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    v = value.strip().lower()
    if not v:
        return None
    if v not in _TLS_VERSION_ALIASES:
        raise ValueError(f"invalid TLS version: {value!r} (expected 1.0/1.1/1.2/1.3)")
    return _TLS_VERSION_ALIASES[v]


def _tls_version_obj(version: str) -> "ssl.TLSVersion":
    # ssl.TLSVersion exists in Python 3.7+
    mapping = {
        "1.0": ssl.TLSVersion.TLSv1,
        "1.1": ssl.TLSVersion.TLSv1_1,
        "1.2": ssl.TLSVersion.TLSv1_2,
        "1.3": ssl.TLSVersion.TLSv1_3,
    }
    return mapping[version]


def _configure_tls_versions(
    ctx: ssl.SSLContext,
    *,
    tls_min_version: Optional[str],
    tls_max_version: Optional[str],
) -> None:
    if tls_min_version is None and tls_max_version is None:
        return
    if tls_min_version is not None:
        ctx.minimum_version = _tls_version_obj(tls_min_version)
    if tls_max_version is not None:
        ctx.maximum_version = _tls_version_obj(tls_max_version)


def _resolve_config(parser: argparse.ArgumentParser, args: argparse.Namespace) -> _ResolvedConfig:
    if not args.smtp_host:
        parser.error("--smtp-host is required (or env SMTP_HOST)")

    smtp_port_raw = args.smtp_port
    if smtp_port_raw is None:
        smtp_port_raw = str(_default_port(args.smtp_tls))
    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        parser.error("--smtp-port must be an integer")

    if not args.from_addr:
        parser.error('--from is required (or env EMAIL_FROM), example: "no-reply@example.com"')
    if not args.to:
        parser.error('--to is required (or env EMAIL_TO), example: "a@example.com,b@example.com"')

    to_addrs = _split_recipients(args.to)
    cc_addrs = _split_recipients(args.cc) if args.cc else []
    bcc_addrs = _split_recipients(args.bcc) if args.bcc else []
    if not to_addrs:
        parser.error("--to must contain at least one recipient")

    if args.smtp_username and args.smtp_password is None:
        parser.error("--smtp-password is required when --smtp-username is set (or env SMTP_PASSWORD)")

    try:
        address_family = _parse_address_family(args.address_family)
    except ValueError as e:
        parser.error(str(e))

    try:
        tls_min_version = _parse_tls_version(args.tls_min_version)
        tls_max_version = _parse_tls_version(args.tls_max_version)
    except ValueError as e:
        parser.error(str(e))
    if tls_min_version and tls_max_version:
        if _tls_version_obj(tls_min_version) > _tls_version_obj(tls_max_version):
            parser.error("--tls-min-version must be <= --tls-max-version")

    return _ResolvedConfig(
        smtp_host=args.smtp_host,
        smtp_port=smtp_port,
        smtp_tls=args.smtp_tls,
        smtp_username=args.smtp_username,
        smtp_password=args.smtp_password,
        address_family=address_family,
        tls_min_version=tls_min_version,
        tls_max_version=tls_max_version,
        from_addr=args.from_addr,
        from_name=args.from_name,
        to_addrs=to_addrs,
        cc_addrs=cc_addrs,
        bcc_addrs=bcc_addrs,
    )


def _print_config_template() -> None:
    sys.stdout.write(
        dedent(
            """\
            # SMTP / mail env template (fill in and export)
            export SMTP_HOST="smtp.example.com"
            export SMTP_TLS="starttls"  # starttls | ssl | none
            export SMTP_PORT="587"      # optional; defaults based on SMTP_TLS
            export SMTP_ADDRESS_FAMILY="auto"  # auto | ipv4 | ipv6 (try ipv4 if your IPv6 path is broken)
            export SMTP_TLS_MIN_VERSION=""     # optional, e.g. "1.2" to avoid broken TLS1.3 paths
            export SMTP_TLS_MAX_VERSION=""     # optional, e.g. "1.2" to pin TLS1.2

            # Optional auth (many providers require an app password / auth code)
            export SMTP_USERNAME="user@example.com"
            export SMTP_PASSWORD="<app-password-or-auth-code>"

            # Message defaults
            export EMAIL_FROM="user@example.com"
            export EMAIL_TO="recipient@example.com,other@example.com"
            """
        )
    )


def _print_probe_hints(tls_mode: str) -> None:
    if tls_mode == "ssl":
        port_hint = "465"
        openssl_hint = "openssl s_client -connect smtp.example.com:465 -servername smtp.example.com"
    else:
        port_hint = "587"
        openssl_hint = "openssl s_client -starttls smtp -connect smtp.example.com:587 -servername smtp.example.com"

    sys.stderr.write(
        dedent(
            f"""\

            Troubleshooting hints:
            - If you see EOF/handshake failures, your network may be blocking SMTP ports (common for 465/587/25).
            - Try {port_hint} with the matching TLS mode (ssl->465, starttls->587), and test from a different network.
            - Quick port test: nc -vz smtp.example.com {port_hint}
            - TLS test: {openssl_hint}
            - In sandboxed runs, network access may require escalated permissions.
            """
        )
    )


def _probe_smtp_connection(
    *,
    cfg: _ResolvedConfig,
    timeout_s: float,
    debug: bool,
    auth: bool,
) -> int:
    try:
        infos = socket.getaddrinfo(cfg.smtp_host, cfg.smtp_port, type=socket.SOCK_STREAM)
        addrs = []
        for family, _socktype, _proto, _canonname, sockaddr in infos:
            ip = sockaddr[0]
            addrs.append((family, ip))
        unique_ips = []
        seen = set()
        for family, ip in addrs:
            key = (family, ip)
            if key in seen:
                continue
            seen.add(key)
            unique_ips.append(key)
        if unique_ips:
            sys.stdout.write(
                "resolved_ips=" + ",".join([ip for _family, ip in unique_ips[:10]]) + ("\n" if len(unique_ips) else "")
            )
    except Exception:
        pass

    smtp, is_ssl = _connect_smtp(
        host=cfg.smtp_host,
        port=cfg.smtp_port,
        tls_mode=cfg.smtp_tls,
        timeout_s=timeout_s,
        address_family=cfg.address_family,
        tls_min_version=cfg.tls_min_version,
        tls_max_version=cfg.tls_max_version,
    )
    try:
        if debug:
            smtp.set_debuglevel(1)
        smtp.ehlo()
        if not is_ssl and cfg.smtp_tls == "starttls":
            ctx = ssl.create_default_context()
            smtp.starttls(context=ctx)
            smtp.ehlo()
        if auth and cfg.smtp_username:
            smtp.login(cfg.smtp_username, cfg.smtp_password or "")
        sys.stdout.write("probe=ok\n")
        return 0
    except ssl.SSLError as e:
        sys.stderr.write(f"probe=failed ssl_error={type(e).__name__}: {e}\n")
        _print_probe_hints(cfg.smtp_tls)
        return 2
    except (OSError, smtplib.SMTPException) as e:
        sys.stderr.write(f"probe=failed error={type(e).__name__}: {e}\n")
        _print_probe_hints(cfg.smtp_tls)
        return 2
    finally:
        try:
            smtp.quit()
        except Exception:
            try:
                smtp.close()
            except Exception:
                pass


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(description="Send an email via SMTP (none/starttls/ssl).")
    parser.add_argument(
        "--print-config-template",
        action="store_true",
        help="Print an env var template and exit (no send).",
    )
    parser.add_argument(
        "--check-config",
        action="store_true",
        help="Validate required SMTP/message config and exit (no send).",
    )
    parser.add_argument(
        "--probe",
        action="store_true",
        help="Probe TCP/TLS connectivity (EHLO + STARTTLS/SSL handshake), then exit (no send).",
    )
    parser.add_argument(
        "--probe-auth",
        action="store_true",
        help="With --probe, also attempt SMTP AUTH if username is set.",
    )
    parser.add_argument(
        "--debug-smtp",
        action="store_true",
        help="Enable smtplib debug output (use with --probe or send).",
    )
    parser.add_argument(
        "--address-family",
        default=_env_any("SMTP_ADDRESS_FAMILY", "MAIL_ADDRESS_FAMILY") or "auto",
        help="Address family: auto/ipv4/ipv6 (or env SMTP_ADDRESS_FAMILY / MAIL_ADDRESS_FAMILY).",
    )
    parser.add_argument(
        "--tls-min-version",
        default=_env_any("SMTP_TLS_MIN_VERSION", "MAIL_TLS_MIN_VERSION"),
        help='Optional TLS min version: 1.0/1.1/1.2/1.3 (or env SMTP_TLS_MIN_VERSION / MAIL_TLS_MIN_VERSION).',
    )
    parser.add_argument(
        "--tls-max-version",
        default=_env_any("SMTP_TLS_MAX_VERSION", "MAIL_TLS_MAX_VERSION"),
        help='Optional TLS max version: 1.0/1.1/1.2/1.3 (or env SMTP_TLS_MAX_VERSION / MAIL_TLS_MAX_VERSION).',
    )
    parser.add_argument(
        "--smtp-host",
        default=_env_any("SMTP_HOST", "MAIL_HOST"),
        help="SMTP host (or env SMTP_HOST / MAIL_HOST)",
    )
    parser.add_argument(
        "--smtp-port",
        default=_env_any("SMTP_PORT", "MAIL_PORT"),
        help="SMTP port (or env SMTP_PORT / MAIL_PORT); default depends on --smtp-tls",
    )
    parser.add_argument(
        "--smtp-tls",
        default=_env_any("SMTP_TLS", "MAIL_TLS") or "starttls",
        choices=["none", "starttls", "ssl"],
        help="TLS mode: none, starttls, ssl (or env SMTP_TLS / MAIL_TLS)",
    )
    parser.add_argument(
        "--smtp-username",
        default=_env_any("SMTP_USERNAME", "MAIL_USERNAME"),
        help="SMTP username (or env SMTP_USERNAME / MAIL_USERNAME)",
    )
    parser.add_argument(
        "--smtp-password",
        default=_env_any("SMTP_PASSWORD", "MAIL_PASSWORD"),
        help="SMTP password (or env SMTP_PASSWORD / MAIL_PASSWORD)",
    )
    parser.add_argument(
        "--from",
        dest="from_addr",
        default=_env_any("EMAIL_FROM", "MAIL_FROM", "MAIL_USERNAME", "SMTP_USERNAME"),
        help="From address (or env EMAIL_FROM / MAIL_FROM; falls back to username)",
    )
    parser.add_argument(
        "--from-name",
        dest="from_name",
        default=_env_any("EMAIL_FROM_NAME", "MAIL_FROM_NAME"),
        help='Optional display name, e.g. "Lionsaid Bot" (or env EMAIL_FROM_NAME / MAIL_FROM_NAME)',
    )
    parser.add_argument(
        "--to",
        default=_env_any("EMAIL_TO", "MAIL_TO"),
        help="To addresses (comma/semicolon separated) or env EMAIL_TO / MAIL_TO",
    )
    parser.add_argument("--cc", default=None, help="CC addresses (comma/semicolon separated)")
    parser.add_argument("--bcc", default=None, help="BCC addresses (comma/semicolon separated)")
    parser.add_argument("--subject", default=None, help="Email subject")

    body_group = parser.add_mutually_exclusive_group(required=False)
    body_group.add_argument("--body", help="Body text")
    body_group.add_argument("--body-file", help="Read body from file (utf-8)")
    body_group.add_argument("--body-stdin", action="store_true", help="Read body from stdin")
    parser.add_argument(
        "--html",
        default=None,
        help="Optional HTML body; when set, sends multipart (text + html).",
    )

    parser.add_argument("--timeout", type=float, default=20.0, help="SMTP timeout seconds (default: 20)")
    parser.add_argument("--dry-run", action="store_true", help="Print message and exit without sending")

    args = parser.parse_args(argv)

    if args.print_config_template:
        _print_config_template()
        return 0

    cfg = _resolve_config(parser, args)
    if args.check_config:
        sys.stdout.write(
            dedent(
                f"""\
                OK
                smtp_host={cfg.smtp_host}
                smtp_port={cfg.smtp_port}
                smtp_tls={cfg.smtp_tls}
                smtp_username={'<set>' if cfg.smtp_username else '<not set>'}
                smtp_password={'<set>' if cfg.smtp_password else '<not set>'}
                address_family={cfg.address_family}
                tls_min_version={cfg.tls_min_version or '<default>'}
                tls_max_version={cfg.tls_max_version or '<default>'}
                from={cfg.from_addr}
                to={','.join(cfg.to_addrs)}
                """
            )
        )
        return 0

    if args.probe:
        return _probe_smtp_connection(
            cfg=cfg,
            timeout_s=args.timeout,
            debug=args.debug_smtp,
            auth=args.probe_auth,
        )

    if not args.subject:
        parser.error("--subject is required")
    if args.body is None and args.body_file is None and not args.body_stdin:
        parser.error("Body is required (use --body / --body-file / --body-stdin)")
    body = _read_body(args)

    msg = EmailMessage()
    msg["From"] = formataddr((cfg.from_name, cfg.from_addr)) if cfg.from_name else cfg.from_addr
    msg["To"] = ", ".join(cfg.to_addrs)
    if cfg.cc_addrs:
        msg["Cc"] = ", ".join(cfg.cc_addrs)
    msg["Subject"] = args.subject
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid()
    msg["Reply-To"] = cfg.from_addr
    msg.set_content(body)
    if args.html:
        msg.add_alternative(args.html, subtype="html")

    if args.dry_run:
        sys.stdout.write(msg.as_string() + "\n")
        return 0

    all_recipients = cfg.to_addrs + cfg.cc_addrs + cfg.bcc_addrs

    try:
        smtp, is_ssl = _connect_smtp(
            host=cfg.smtp_host,
            port=cfg.smtp_port,
            tls_mode=cfg.smtp_tls,
            timeout_s=args.timeout,
            address_family=cfg.address_family,
            tls_min_version=cfg.tls_min_version,
            tls_max_version=cfg.tls_max_version,
        )
    except ssl.SSLError as e:
        sys.stderr.write(f"send=failed ssl_error={type(e).__name__}: {e}\n")
        _print_probe_hints(cfg.smtp_tls)
        return 2
    except (OSError, smtplib.SMTPException) as e:
        sys.stderr.write(f"send=failed error={type(e).__name__}: {e}\n")
        _print_probe_hints(cfg.smtp_tls)
        return 2
    try:
        if args.debug_smtp:
            smtp.set_debuglevel(1)
        smtp.ehlo()
        if not is_ssl and cfg.smtp_tls == "starttls":
            ctx = ssl.create_default_context()
            _configure_tls_versions(ctx, tls_min_version=cfg.tls_min_version, tls_max_version=cfg.tls_max_version)
            smtp.starttls(context=ctx)
            smtp.ehlo()

        if cfg.smtp_username:
            smtp.login(cfg.smtp_username, cfg.smtp_password or "")

        smtp.send_message(msg, from_addr=cfg.from_addr, to_addrs=all_recipients)
    finally:
        try:
            smtp.quit()
        except Exception:
            try:
                smtp.close()
            except Exception:
                pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
