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
      className="footer-link inline-flex w-fit items-center rounded-full border border-[color:var(--footer-border)] px-3 py-1.5 text-left text-sm font-medium transition hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
    >
      {label}
    </a>
  );
}
