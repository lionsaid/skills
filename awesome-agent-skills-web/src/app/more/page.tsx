import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageShell } from "@/components/info-page-shell";
import { buildMetadata } from "@/lib/seo";
import { getRequestLocale } from "@/lib/request-locale";
import { prefixLocalePath, type Locale } from "@/lib/i18n";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "More",
    path: "/more",
    description: "Other LionSaid products and side projects.",
  });
}

export function MorePageContent({ locale }: { locale: Locale }) {
  const cards = [
    {
      eyebrow: "Sudoku",
      title: "Sudoku.lionsaid.com",
      href: "https://sudoku.lionsaid.com/",
      description:
        locale === "zh-CN"
          ? "想换换脑子的时候，随手来一局。"
          : "A small reset when you want a change of pace.",
      cta: locale === "zh-CN" ? "去玩数独 →" : "Play Sudoku →",
    },
    {
      eyebrow: "Copybook",
      title: "Copybook.lionsaid.com",
      href: "https://copybook.lionsaid.com/",
      description:
        locale === "zh-CN"
          ? "把灵感、内容和随手记下来的东西，好好放在一起。"
          : "A calmer place for ideas, notes, and the things you want to keep close.",
      cta: locale === "zh-CN" ? "打开 Copybook →" : "Open Copybook →",
    },
  ];

  return (
    <InfoPageShell
      locale={locale}
      eyebrow={locale === "zh-CN" ? "其他产品" : "Other products"}
      title={locale === "zh-CN" ? "看看 LionSaid 的更多产品。" : "Explore more products from LionSaid."}
      intro={
        locale === "zh-CN"
          ? "如果它们刚好适合你要做的事，可以直接继续用下去。"
          : "If one of these feels right for what comes next, you can keep going from here."
      }
    >
      <section className="page-shell py-8 pb-18">
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <a
              key={card.title}
              className="glass group block rounded-[1.9rem] border border-[var(--border-soft)] p-6 transition hover:-translate-y-0.5 hover:border-[var(--accent)] sm:p-7"
              href={card.href}
              rel="noreferrer"
              target="_blank"
            >
              <p className="eyebrow muted">{card.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                {card.title}
              </h2>
              <p className="muted mt-4 max-w-xl text-base leading-7">
                {card.description}
              </p>
              <div className="mt-6 text-sm font-medium text-[var(--accent)]">
                {card.cta}
              </div>
            </a>
          ))}
        </div>
      </section>
      <section className="page-shell pb-20">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            className="surface-panel rounded-[1.65rem] p-6 transition hover:border-[var(--accent)]"
            href={prefixLocalePath("/about", locale)}
          >
            <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "关于我们" : "About us"}</p>
            <h2 className="mt-3 text-2xl font-semibold">{locale === "zh-CN" ? "了解这个站点为什么值得用。" : "See what makes this site useful."}</h2>
          </Link>
          <Link
            className="surface-panel rounded-[1.65rem] p-6 transition hover:border-[var(--accent)]"
            href={prefixLocalePath("/updates", locale)}
          >
            <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "更新历史" : "Updates"}</p>
            <h2 className="mt-3 text-2xl font-semibold">{locale === "zh-CN" ? "看看最近有哪些新变化。" : "See what is new."}</h2>
          </Link>
        </div>
      </section>
    </InfoPageShell>
  );
}

export default async function MorePage() {
  return <MorePageContent locale={await getRequestLocale()} />;
}
