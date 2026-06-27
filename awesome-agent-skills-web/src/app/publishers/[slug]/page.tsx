import Link from "next/link";
import { notFound } from "next/navigation";
import { PublisherLogo } from "@/components/publisher-logo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRequestLocale } from "@/lib/request-locale";
import { getPublisherBySlug, getSkillsByPublisher } from "@/lib/skills";

type PublisherPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublisherPage({ params }: PublisherPageProps) {
  const locale = await getRequestLocale();
  const { slug } = await params;
  const publisher = getPublisherBySlug(slug);

  if (!publisher) {
    notFound();
  }

  const skills = getSkillsByPublisher(slug);

  return (
    <main className="pb-16">
      <SiteHeader currentPath="/skills" locale={locale} />
      <div className="page-shell py-8">
        <section className="surface-panel rounded-[2rem] p-6 sm:p-8">
          <p className="eyebrow surface-muted">
            {publisher.kind === "official"
              ? locale === "zh-CN"
                ? "官方出品"
                : "Official team"
              : locale === "zh-CN"
                ? "社区整理"
                : "Community"}
          </p>
          <div className="mt-5">
            <PublisherLogo name={publisher.name} size="lg" slug={publisher.slug} />
          </div>
          <h1 className="display mt-4 text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
            {publisher.name}
          </h1>
          <p className="muted mt-5 max-w-2xl text-lg leading-8">
            {locale === "zh-CN"
              ? "如果你已经知道想看这个发布方的 skill，可以直接从这里开始。"
              : "If you already know this publisher is relevant, start here and compare the most useful skills faster."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <p className="text-sm muted">
              {locale === "zh-CN" ? `${publisher.count} 个相关 skill` : `${publisher.count} skills to explore`}
            </p>
            <Link
              className="rounded-full border border-[var(--panel-outline)] px-4 py-2 text-sm transition hover:bg-[var(--panel-soft-hover)]"
              href={`/skills?publisher=${publisher.slug}`}
            >
              {locale === "zh-CN" ? "查看全部" : "See all skills"}
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4">
          {skills.map((skill) => (
            <Link
              key={skill.slug}
              className="glass skill-card rounded-[1.75rem] p-5"
              href={`/skills/${skill.slug}`}
            >
              <p className="eyebrow muted">
                {skill.kind === "official"
                  ? locale === "zh-CN"
                    ? "官方"
                    : "Official"
                  : locale === "zh-CN"
                    ? "社区"
                    : "Community"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{skill.name}</h2>
              <p className="muted mt-3 leading-7">{skill.description}</p>
            </Link>
          ))}
        </section>
      </div>
      <SiteFooter locale={locale} />
    </main>
  );
}
