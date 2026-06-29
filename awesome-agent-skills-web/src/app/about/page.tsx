import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageShell } from "@/components/info-page-shell";
import { buildMetadata } from "@/lib/seo";
import { getRequestLocale } from "@/lib/request-locale";
import { prefixLocalePath, type Locale } from "@/lib/i18n";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "About",
    path: "/about",
    description: "About LionSaid Skills.",
  });
}

export function AboutPageContent({ locale }: { locale: Locale }) {
  const blocks = [
    {
      title: locale === "zh-CN" ? "这个站点能帮你做什么" : "What this site helps you do",
      body:
        locale === "zh-CN"
          ? "当你知道自己要做什么，却还不知道该用哪个 skill 时，这里会帮你更快找到方向。"
          : "When you know what you need to do but not which skill to open, this site helps you find a clearer starting point.",
    },
    {
      title: locale === "zh-CN" ? "你可以怎么找" : "How you can browse",
      body:
        locale === "zh-CN"
          ? "你可以按角色、任务、公司或来源开始找，先看到更适合当下工作的选择。"
          : "You can start by role, task, company, or source, so the right options show up sooner.",
    },
    {
      title: locale === "zh-CN" ? "为什么会有这个站点" : "Why this directory exists",
      body:
        locale === "zh-CN"
          ? "可选的 skill 越来越多，但真正难的是判断哪个值得现在打开。这个站点想把这一步变简单。"
          : "There are more skills than ever. The harder part is knowing which one is worth opening now. This site is here to make that easier.",
    },
  ];

  return (
    <InfoPageShell
      locale={locale}
      eyebrow={locale === "zh-CN" ? "关于我们" : "About us"}
      title={locale === "zh-CN" ? "帮你更快找到适合当前工作的 skill。" : "Find the right skill for the job in front of you."}
      intro={
        locale === "zh-CN"
          ? "少一点来回搜索，少一点试错，更快找到那个真正能帮上忙的 skill。"
          : "Less searching. Less guesswork. A quicker way to the skill that can actually help."
      }
    >
      <section className="page-shell py-8 pb-18">
        <div className="grid gap-4 lg:grid-cols-3">
          {blocks.map((block) => (
            <div
              key={block.title}
              className="surface-panel rounded-[1.75rem] p-6 sm:p-7"
            >
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                {block.title}
              </h2>
              <p className="muted mt-4 text-base leading-8">
                {block.body}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="surface-panel rounded-[1.75rem] p-6 sm:p-7">
            <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "联系" : "Contact"}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              {locale === "zh-CN" ? "如果你想联系 LionSaid，可以直接发邮件。" : "If you would like to reach LionSaid, email us directly."}
            </h2>
            <p className="muted mt-4 text-base leading-8">
              {locale === "zh-CN"
                ? "我们会把联系方式放在这里，方便你随时找到。"
                : "We keep our contact details here so they are easy to find when you need them."}
            </p>
            <a
              className="mt-6 inline-flex rounded-full border border-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent-soft)]"
              href="mailto:lionsaid@aliyun.com"
            >
              lionsaid@aliyun.com
            </a>
          </div>
        </div>
      </section>
      <section className="page-shell pb-20">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            className="surface-panel rounded-[1.65rem] p-6 transition hover:border-[var(--accent)]"
            href={prefixLocalePath("/updates", locale)}
          >
            <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "更新历史" : "Updates"}</p>
            <h2 className="mt-3 text-2xl font-semibold">{locale === "zh-CN" ? "看看最近有哪些新变化。" : "See what is new."}</h2>
          </Link>
          <Link
            className="surface-panel rounded-[1.65rem] p-6 transition hover:border-[var(--accent)]"
            href={prefixLocalePath("/more", locale)}
          >
            <p className="eyebrow text-[var(--accent)]">{locale === "zh-CN" ? "其他产品" : "Other products"}</p>
            <h2 className="mt-3 text-2xl font-semibold">{locale === "zh-CN" ? "看看 LionSaid 的更多产品。" : "Explore more from LionSaid."}</h2>
          </Link>
        </div>
      </section>
    </InfoPageShell>
  );
}

export default async function AboutPage() {
  return <AboutPageContent locale={await getRequestLocale()} />;
}
