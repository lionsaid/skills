export function FooterActionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="footer-link text-sm transition"
    >
      {label}
    </a>
  );
}
