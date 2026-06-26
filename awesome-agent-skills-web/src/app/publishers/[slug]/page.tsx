import Link from "next/link";
import { notFound } from "next/navigation";
import { PublisherLogo } from "@/components/publisher-logo";
import { SiteHeader } from "@/components/site-header";
import { getPublisherBySlug, getSkillsByPublisher } from "@/lib/skills";

type PublisherPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublisherPage({ params }: PublisherPageProps) {
  const { slug } = await params;
  const publisher = getPublisherBySlug(slug);

  if (!publisher) {
    notFound();
  }

  const skills = getSkillsByPublisher(slug);

  return (
    <main className="pb-16">
      <SiteHeader currentPath="/skills" />
      <div className="page-shell py-8">
        <section className="surface-panel rounded-[2rem] p-6 sm:p-8">
          <p className="eyebrow surface-muted">{publisher.kind}</p>
          <div className="mt-5">
            <PublisherLogo name={publisher.name} size="lg" slug={publisher.slug} />
          </div>
          <h1 className="display mt-4 text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
            {publisher.name}
          </h1>
          <p className="muted mt-5 max-w-2xl text-lg leading-8">
            A focused view for one publisher, useful once the homepage has done
            its job and the user wants tighter browsing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <p className="text-sm muted">{publisher.count} listed skills</p>
            <Link
              className="rounded-full border border-[var(--panel-outline)] px-4 py-2 text-sm transition hover:bg-[var(--panel-soft-hover)]"
              href={`/skills?publisher=${publisher.slug}`}
            >
              Open filtered catalog
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
              <p className="eyebrow muted">{skill.kind}</p>
              <h2 className="mt-3 text-2xl font-semibold">{skill.name}</h2>
              <p className="muted mt-3 leading-7">{skill.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
