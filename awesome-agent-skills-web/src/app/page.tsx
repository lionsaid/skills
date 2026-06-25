import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getFeaturedSkills, getPublishers, getStats } from "@/lib/skills";

export default function Home() {
  const stats = getStats();
  const featured = getFeaturedSkills();
  const publishers = getPublishers().slice(0, 10);

  return (
    <main className="grain flex flex-1 flex-col">
      <section className="hero-grid relative overflow-hidden py-6">
        <SiteHeader currentPath="/" />

        <div className="page-shell grid gap-10 py-16 lg:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.75fr)] lg:items-end lg:py-24 2xl:gap-16 2xl:py-28">
          <div>
            <p className="eyebrow mb-6 text-[var(--accent)]">
              Curated discovery for agent builders
            </p>
            <h1 className="display max-w-7xl text-6xl leading-[0.92] font-semibold tracking-[-0.04em] text-balance sm:text-7xl lg:text-[6.5rem] 2xl:text-[8rem]">
              A calmer front door for a very large skills universe.
            </h1>
            <p className="muted mt-8 max-w-3xl text-lg leading-8 2xl:text-xl 2xl:leading-9">
              Apple-inspired storytelling for the first impression. Fast,
              search-first catalog behavior once you start browsing.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-[var(--background)]"
                href="/skills?sort=featured"
              >
                Explore the catalog
              </Link>
              <a
                className="rounded-full border border-[var(--border-soft)] px-6 py-3 text-sm font-medium"
                href="https://github.com/VoltAgent/awesome-agent-skills/blob/main/README.md"
                rel="noreferrer"
                target="_blank"
              >
                Read the source README
              </a>
            </div>
          </div>

          <div className="glass spotlight-card rounded-[2rem] p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-white/60 p-5">
                <p className="eyebrow muted">Skills</p>
                <p className="mt-3 text-4xl font-semibold">{stats.totalSkills}</p>
                <p className="muted mt-2 text-sm">Parsed directly from README.md</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/60 p-5">
                <p className="eyebrow muted">Publishers</p>
                <p className="mt-3 text-4xl font-semibold">{stats.totalPublishers}</p>
                <p className="muted mt-2 text-sm">Official teams and community authors</p>
              </div>
            </div>
            <div className="mt-4 rounded-[1.5rem] bg-[var(--midnight)] p-6 text-white">
              <p className="eyebrow text-white/70">Quality stance</p>
              <p className="mt-3 max-w-sm text-xl leading-8">
                Hand-picked, not AI-slop generated.
              </p>
              <div className="mt-6 flex gap-6 text-sm text-white/72">
                <span>{stats.officialCount} official</span>
                <span>{stats.communityCount} community</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-8 pb-16">
        <div className="grid gap-4 md:grid-cols-3 xl:gap-6">
          {[
            "Story-led landing for trust and orientation",
            "Searchable catalog for the long-tail of skills",
            "Structured data extracted from the existing README",
          ].map((item) => (
            <div key={item} className="glass rounded-[1.75rem] p-6">
              <p className="text-lg leading-7">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="deep-panel py-20 2xl:py-24">
        <div className="page-shell">
          <div className="max-w-4xl">
            <p className="eyebrow text-white/70">Featured skills</p>
            <h2 className="display mt-4 text-5xl leading-tight font-semibold sm:text-6xl 2xl:text-7xl">
              Start with the skills people are most likely to need first.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2 2xl:grid-cols-4 2xl:gap-6">
            {featured.map((skill, index) => (
              <Link
                key={skill.slug}
                className="rounded-[2rem] border border-white/10 bg-white/6 p-6 transition hover:bg-white/10"
                href={`/skills/${skill.slug}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow text-white/55">
                      {String(index + 1).padStart(2, "0")} · {skill.publisher}
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold">{skill.name}</h3>
                  </div>
                  <span className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/70">
                    {skill.kind}
                  </span>
                </div>
                <p className="muted mt-5 max-w-xl leading-7">{skill.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-20 2xl:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-[var(--accent)]">Publishers</p>
            <h2 className="display mt-3 text-5xl font-semibold tracking-[-0.04em] 2xl:text-6xl">
              Browse by source, not by chaos.
            </h2>
          </div>
          <Link className="text-sm font-medium text-[var(--accent)]" href="/skills">
            See the full catalog
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5 2xl:gap-6">
          {publishers.map((publisher) => (
            <Link
              key={publisher.slug}
              className="glass skill-card rounded-[1.75rem] p-5"
              href={`/publishers/${publisher.slug}`}
            >
              <p className="eyebrow muted">{publisher.kind}</p>
              <h3 className="mt-3 text-2xl font-semibold">{publisher.name}</h3>
              <p className="muted mt-4 text-sm">{publisher.count} listed skills</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
