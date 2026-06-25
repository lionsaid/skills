import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getFeaturedSkills, getPublishers, getStats } from "@/lib/skills";

export default function Home() {
  const stats = getStats();
  const featured = getFeaturedSkills();
  const publishers = getPublishers().slice(0, 8);

  const quickStarts = [
    { label: "Official skills", href: "/skills?kind=official" },
    { label: "Browse all skills", href: "/skills" },
    { label: "Anthropics", href: "/skills?publisher=anthropics" },
    { label: "OpenAI", href: "/skills?publisher=openai" },
    { label: "Docs workflows", href: "/skills?q=docs" },
    { label: "Presentations", href: "/skills?q=pptx" },
  ];

  return (
    <main className="grain flex flex-1 flex-col overflow-x-hidden pb-28 sm:pb-0">
      <section className="hero-grid relative overflow-hidden py-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-orb absolute left-1/2 top-[-5rem] h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(23,105,255,0.14)] blur-3xl" />
          <div className="hero-orb absolute right-[-5rem] top-40 h-80 w-80 rounded-full bg-[rgba(13,23,38,0.12)] blur-3xl [animation-delay:1.5s]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0))]" />
        </div>
        <SiteHeader currentPath="/" />

        <div className="page-shell grid gap-6 py-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:items-stretch lg:py-16 2xl:gap-8">
          <div className="spotlight-card glass relative overflow-hidden rounded-[2.25rem] p-6 sm:p-8 lg:p-10">
            <p className="eyebrow text-[var(--accent)]">Skill discovery</p>
            <h1 className="display mt-5 max-w-3xl text-5xl leading-[0.94] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-[5.6rem]">
              Find the right skill before you ever open GitHub.
            </h1>
            <p className="muted mt-6 max-w-2xl text-lg leading-8">
              Search the catalog from the homepage, jump to official skills, or
              narrow by publisher in a single step. This is the front door for the
              whole library.
            </p>

            <form action="/skills" className="mt-8 sm:mt-10">
              <label className="sr-only" htmlFor="home-search">
                Search skills
              </label>
              <div className="flex flex-col gap-3 rounded-[1.75rem] border border-[var(--border-soft)] bg-white/88 p-3 shadow-[0_18px_44px_rgba(20,16,10,0.08)] sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.35rem] bg-[rgba(17,17,17,0.03)] px-4 py-3">
                  <span aria-hidden="true" className="text-black/45">
                    <svg
                      fill="none"
                      height="18"
                      viewBox="0 0 24 24"
                      width="18"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 21l-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </span>
                  <input
                    autoComplete="off"
                    className="w-full bg-transparent text-base outline-none placeholder:text-black/35"
                    id="home-search"
                    name="q"
                    placeholder="Search by skill, publisher, or use case"
                    type="search"
                  />
                </div>
                <button
                  className="h-12 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
                  type="submit"
                >
                  Search catalog
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {quickStarts.map((item) => (
                <Link
                  key={item.label}
                  className="rounded-full border border-[var(--border-soft)] bg-white/70 px-4 py-2 text-sm font-medium transition hover:bg-white"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-black/55">
              <span>{stats.totalSkills} skills indexed</span>
              <span>{stats.totalPublishers} publishers</span>
              <span>{stats.officialCount} official</span>
              <span>{stats.communityCount} community</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="deep-panel rounded-[2rem] p-6 sm:p-7 xl:col-span-2">
              <p className="eyebrow text-white/65">How it works</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight">
                Three ways in. One place to decide.
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  "Search by task, publisher, or tag",
                  "Jump straight to official or community sources",
                  "Open a skill only after you know it fits",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4"
                  >
                    <p className="eyebrow text-white/45">0{index + 1}</p>
                    <p className="mt-3 text-sm leading-6 text-white/88">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[1.75rem] p-5 sm:p-6">
              <p className="eyebrow muted">Skills</p>
              <p className="mt-3 text-4xl font-semibold">{stats.totalSkills}</p>
              <p className="muted mt-2 text-sm leading-6">
                Indexed and searchable from the homepage.
              </p>
            </div>

            <div className="glass rounded-[1.75rem] p-5 sm:p-6">
              <p className="eyebrow muted">Publishers</p>
              <p className="mt-3 text-4xl font-semibold">{stats.totalPublishers}</p>
              <p className="muted mt-2 text-sm leading-6">
                Browse by source instead of digging through README files.
              </p>
            </div>

            <div className="glass rounded-[1.75rem] p-5 sm:p-6">
              <p className="eyebrow muted">Official</p>
              <p className="mt-3 text-4xl font-semibold">{stats.officialCount}</p>
              <p className="muted mt-2 text-sm leading-6">
                Built by the teams closest to the product.
              </p>
            </div>

            <div className="glass rounded-[1.75rem] p-5 sm:p-6">
              <p className="eyebrow muted">Community</p>
              <p className="mt-3 text-4xl font-semibold">{stats.communityCount}</p>
              <p className="muted mt-2 text-sm leading-6">
                Extra coverage for the long tail of workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-10 pb-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[var(--accent)]">Start here</p>
            <h2 className="display mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Fast paths into the catalog.
            </h2>
          </div>
          <Link className="text-sm font-medium text-[var(--accent)]" href="/skills">
            Open the full catalog
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link className="glass skill-card rounded-[1.75rem] p-6" href="/skills?sort=featured">
            <p className="eyebrow muted">Featured</p>
            <p className="mt-4 text-xl font-semibold">Curated starting points</p>
            <p className="muted mt-3 text-sm leading-6">
              Jump straight to the skills most people reach for first.
            </p>
          </Link>
          <Link className="glass skill-card rounded-[1.75rem] p-6" href="/skills?kind=official">
            <p className="eyebrow muted">Official only</p>
            <p className="mt-4 text-xl font-semibold">Team-authored skills</p>
            <p className="muted mt-3 text-sm leading-6">
              Filter straight to the releases that come from the source.
            </p>
          </Link>
          <Link className="glass skill-card rounded-[1.75rem] p-6" href="/skills?publisher=anthropics">
            <p className="eyebrow muted">Publisher</p>
            <p className="mt-4 text-xl font-semibold">Anthropics</p>
            <p className="muted mt-3 text-sm leading-6">
              Go directly to one of the most complete first-party collections.
            </p>
          </Link>
          <Link className="glass skill-card rounded-[1.75rem] p-6" href="/skills?publisher=openai">
            <p className="eyebrow muted">Publisher</p>
            <p className="mt-4 text-xl font-semibold">OpenAI</p>
            <p className="muted mt-3 text-sm leading-6">
              See skills from a publisher many users already trust.
            </p>
          </Link>
        </div>
      </section>

      <section className="deep-panel py-20 2xl:py-24">
        <div className="page-shell">
          <div className="max-w-4xl">
            <p className="eyebrow text-white/70">Featured skills</p>
            <h2 className="display mt-4 text-5xl leading-tight font-semibold sm:text-6xl 2xl:text-7xl">
              Start with the most useful skills, then move deeper if needed.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
              The homepage should get people to the right skill fast, not ask them to
              read a repo before they can begin.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2 2xl:grid-cols-4 2xl:gap-6">
            {featured.map((skill, index) => (
              <Link
                key={skill.slug}
                className="group rounded-[2rem] border border-white/10 bg-white/6 p-6 transition hover:bg-white/10"
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
                <div className="mt-6 text-sm font-medium text-white/78 transition group-hover:text-white">
                  Open skill →
                </div>
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
            <p className="muted mt-4 max-w-2xl text-lg leading-8">
              If users already know which ecosystem they want, we should let them go
              straight there from the homepage.
            </p>
          </div>
          <Link className="text-sm font-medium text-[var(--accent)]" href="/skills">
            See the full catalog
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:gap-6">
          {publishers.map((publisher) => (
            <Link
              key={publisher.slug}
              className="glass skill-card rounded-[1.75rem] p-5"
              href={`/publishers/${publisher.slug}`}
            >
              <p className="eyebrow muted">{publisher.kind}</p>
              <h3 className="mt-3 text-2xl font-semibold">{publisher.name}</h3>
              <p className="muted mt-4 text-sm leading-6">{publisher.count} listed skills</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
