"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type {
  PublisherSummary,
  Skill,
  SkillFilterKind,
  SkillSort,
} from "@/lib/skills";

const PAGE_SIZE = 36;

type SkillsCatalogProps = {
  initialKind: SkillFilterKind;
  initialPublisher: string;
  initialQuery: string;
  initialSort: SkillSort;
  publishers: PublisherSummary[];
  skills: Skill[];
};

type FilterOption = {
  value: string;
  label: string;
  trailing?: string;
  leading?: React.ReactNode;
};

type RepoStats = {
  stars: number | null;
  forks: number | null;
};

function sortSkills(skills: Skill[], sort: SkillSort) {
  const sorted = [...skills];

  if (sort === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "publisher") {
    sorted.sort((a, b) => {
      const publisherOrder = a.publisher.localeCompare(b.publisher);
      return publisherOrder === 0 ? a.name.localeCompare(b.name) : publisherOrder;
    });
  }

  return sorted;
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PublisherBadge({
  label,
  slug,
  size = "md",
}: {
  label: string;
  slug: string;
  size?: "sm" | "md";
}) {
  const initials = label
    .split(/[\s/-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const isNvidia = slug === "nvidia";

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white/90 font-semibold tracking-[-0.04em] text-[var(--foreground)] ${
        size === "sm" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]"
      } ${isNvidia ? "bg-[#76b900]/15 text-[#76b900]" : ""}`}
    >
      {isNvidia ? "N" : initials || label.slice(0, 1).toUpperCase()}
    </span>
  );
}

function PublisherMark({ slug }: { slug: string }) {
  if (slug === "anthropics") {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#111111] text-[12px] font-semibold text-white shadow-sm">
        A
      </span>
    );
  }

  if (slug === "nvidia") {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#76b900]/20 bg-[#76b900]/12 text-[12px] font-semibold text-[#76b900] shadow-sm">
        N
      </span>
    );
  }

  if (slug === "google-gemini" || slug === "google-labs-code" || slug === "googleworkspace") {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[12px] font-semibold text-[#4285f4] shadow-sm">
        G
      </span>
    );
  }

  const initials = slug
    .split(/[\s/-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[12px] font-semibold text-[var(--foreground)] shadow-sm">
      {initials || slug.slice(0, 1).toUpperCase()}
    </span>
  );
}

function getRepositoryInfo(skill: Skill) {
  try {
    const parsed = new URL(skill.url);

    if (parsed.hostname === "github.com") {
      const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
      if (!owner || !repo) {
        return null;
      }

      return {
        apiUrl: `https://api.github.com/repos/${owner}/${repo}`,
      };
    }

    if (parsed.hostname === "officialskills.sh") {
      return {
        apiUrl: `https://api.github.com/repos/${skill.publisher}/skills`,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function DropdownFilter({
  currentLabel,
  currentLeading,
  onChange,
  options,
  value,
  widthClass = "min-w-[160px]",
}: {
  currentLabel: string;
  currentLeading?: React.ReactNode;
  onChange: (nextValue: string) => void;
  options: FilterOption[];
  value: string;
  widthClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        open &&
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className={`relative ${widthClass}`} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex h-12 w-full items-center justify-between rounded-full border px-4 text-sm outline-none transition ${
          open
            ? "border-[var(--accent)] bg-white shadow-[0_12px_28px_rgba(23,105,255,0.14)] ring-1 ring-[var(--accent-soft)]"
            : "border-[var(--border-soft)] bg-white/80 hover:bg-white/90 focus:border-[var(--accent)]"
        }`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {currentLeading ? currentLeading : null}
          <span className="truncate">{currentLabel}</span>
        </span>
        <span className={`ml-3 text-black/50 transition ${open ? "rotate-180 text-[var(--accent)]" : ""}`}>
          ⌄
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[250px] overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-white shadow-[0_20px_50px_rgba(20,16,10,0.16)]">
          <div className="max-h-[260px] overflow-auto py-1">
            {options.map((item) => (
              <button
                key={item.value}
                className={`flex h-11 w-full items-center gap-3 px-4 text-left text-sm transition hover:bg-[var(--accent-soft)] ${
                  value === item.value ? "bg-[var(--accent-soft)] font-medium" : ""
                }`}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                type="button"
              >
                {item.leading ? item.leading : null}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.trailing ? <span className="text-xs text-black/45">{item.trailing}</span> : null}
                {value === item.value ? <span className="text-[var(--accent)]">✓</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SkillsCatalog({
  initialKind,
  initialPublisher,
  initialQuery,
  initialSort,
  publishers,
  skills,
}: SkillsCatalogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<SkillFilterKind>(initialKind);
  const [publisher, setPublisher] = useState(initialPublisher);
  const [sort, setSort] = useState<SkillSort>(initialSort);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [repoStatsBySlug, setRepoStatsBySlug] = useState<Record<string, RepoStats>>(
    {},
  );
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [, startTransition] = useTransition();

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredQuery) params.set("q", deferredQuery);
    if (kind !== "all") params.set("kind", kind);
    if (publisher !== "all") params.set("publisher", publisher);
    if (sort !== "featured") params.set("sort", sort);

    const nextUrl = params.toString() ? `/skills?${params.toString()}` : "/skills";
    window.history.replaceState(null, "", nextUrl);
  }, [deferredQuery, kind, publisher, sort]);

  const filteredSkills = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    const subset = skills.filter((skill) => {
      const matchesQuery =
        !normalizedQuery ||
        skill.name.toLowerCase().includes(normalizedQuery) ||
        skill.description.toLowerCase().includes(normalizedQuery) ||
        skill.publisher.toLowerCase().includes(normalizedQuery) ||
        skill.tags.some((tag) => tag.includes(normalizedQuery));

      const matchesPublisher =
        publisher === "all" || skill.publisherSlug === publisher;

      const matchesKind = kind === "all" || skill.kind === kind;

      return matchesQuery && matchesPublisher && matchesKind;
    });

    return sortSkills(subset, sort);
  }, [deferredQuery, kind, publisher, skills, sort]);

  const visibleSkills = useMemo(() => {
    return filteredSkills.slice(0, visibleCount);
  }, [filteredSkills, visibleCount]);

  const hasMore = visibleCount < filteredSkills.length;

  const currentPublisherName =
    publishers.find((item) => item.slug === publisher)?.name ?? publisher;

  useEffect(() => {
    const missingSkills = visibleSkills.filter(
      (skill) => repoStatsBySlug[skill.slug] === undefined,
    );

    if (missingSkills.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadRepoStats() {
      const updates = await Promise.all(
        missingSkills.map(async (skill) => {
          const repositoryInfo = getRepositoryInfo(skill);

          if (!repositoryInfo) {
            return [skill.slug, { stars: null, forks: null }] as const;
          }

          try {
            const response = await fetch(repositoryInfo.apiUrl, {
              headers: {
                Accept: "application/vnd.github+json",
              },
            });

            if (!response.ok) {
              return [skill.slug, { stars: null, forks: null }] as const;
            }

            const payload = (await response.json()) as {
              stargazers_count?: number;
              forks_count?: number;
            };

            return [
              skill.slug,
              {
                stars:
                  typeof payload.stargazers_count === "number"
                    ? payload.stargazers_count
                    : null,
                forks:
                  typeof payload.forks_count === "number" ? payload.forks_count : null,
              },
            ] as const;
          } catch {
            return [skill.slug, { stars: null, forks: null }] as const;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      setRepoStatsBySlug((current) => {
        const next = { ...current };
        for (const [slug, stats] of updates) {
          if (next[slug] === undefined) {
            next[slug] = stats;
          }
        }
        return next;
      });
    }

    void loadRepoStats();

    return () => {
      cancelled = true;
    };
  }, [repoStatsBySlug, visibleSkills]);

  useEffect(() => {
    const root = scrollAreaRef.current;
    const sentinel = sentinelRef.current;

    if (!root || !sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setVisibleCount((current) =>
            Math.min(current + PAGE_SIZE, filteredSkills.length),
          );
        }
      },
      {
        root,
        rootMargin: "240px 0px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [filteredSkills.length, hasMore]);

  return (
    <div className="page-shell mt-8 grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-6">
      <section className="relative overflow-visible">
        <div className="relative z-30 rounded-[2rem] border border-[var(--border-soft)] bg-white/55 px-4 py-3.5 shadow-[0_24px_70px_rgba(20,16,10,0.08)] backdrop-blur md:px-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:justify-between">
              <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-[var(--border-soft)] bg-white/80 px-4">
                <FilterIcon />
                <input
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-black/35"
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    startTransition(() => {
                      setQuery(nextValue);
                      setVisibleCount(PAGE_SIZE);
                    });
                  }}
                  placeholder="Search skills, publishers, tags"
                  type="search"
                  value={query}
                />
              </div>

              <div className="flex flex-wrap items-stretch gap-3 lg:justify-end">
                <DropdownFilter
                  currentLabel={
                    kind === "all"
                      ? "All skills"
                      : kind === "official"
                        ? "Official only"
                        : "Community only"
                  }
                  onChange={(nextValue) =>
                    startTransition(() => {
                      setKind(nextValue as SkillFilterKind);
                      setVisibleCount(PAGE_SIZE);
                    })
                  }
                  options={[
                    { value: "all", label: "All skills" },
                    { value: "official", label: "Official only" },
                    { value: "community", label: "Community only" },
                  ]}
                  value={kind}
                  widthClass="min-w-[160px]"
                />

                <DropdownFilter
                  currentLabel={currentPublisherName}
                  currentLeading={
                    publisher === "all" ? (
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-black/15 bg-black/5 text-[11px] font-semibold text-black/45">
                        All
                      </span>
                    ) : (
                      <PublisherBadge label={currentPublisherName} slug={publisher} size="sm" />
                    )
                  }
                  onChange={(nextValue) =>
                    startTransition(() => {
                      setPublisher(nextValue);
                      setVisibleCount(PAGE_SIZE);
                    })
                  }
                  options={[
                    {
                      value: "all",
                      label: "All publishers",
                      leading: (
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-black/15 bg-black/5 text-[11px] font-semibold text-black/45">
                          All
                        </span>
                      ),
                    },
                    ...publishers.map((item) => ({
                      value: item.slug,
                      label: item.name,
                      leading: <PublisherBadge label={item.name} slug={item.slug} size="sm" />,
                      trailing: `(${item.count})`,
                    })),
                  ]}
                  value={publisher}
                  widthClass="min-w-[180px]"
                />

                <DropdownFilter
                  currentLabel={
                    sort === "featured"
                      ? "Featured order"
                      : sort === "name"
                        ? "Alphabetical"
                        : "By publisher"
                  }
                  onChange={(nextValue) =>
                    startTransition(() => {
                      setSort(nextValue as SkillSort);
                      setVisibleCount(PAGE_SIZE);
                    })
                  }
                  options={[
                    { value: "featured", label: "Featured order" },
                    { value: "name", label: "Alphabetical" },
                    { value: "publisher", label: "By publisher" },
                  ]}
                  value={sort}
                  widthClass="min-w-[170px]"
                />

                <button
                  className="h-12 rounded-full border border-[var(--border-soft)] px-4 text-sm font-medium transition hover:bg-white/70"
                  onClick={() =>
                    startTransition(() => {
                      setQuery("");
                      setKind("all");
                      setPublisher("all");
                      setSort("featured");
                      setVisibleCount(PAGE_SIZE);
                    })
                  }
                  type="button"
                >
                  Reset
                </button>
              </div>
            </div>

            {(deferredQuery || kind !== "all" || publisher !== "all" || sort !== "featured") && (
              <div className="flex flex-wrap gap-2">
                {deferredQuery ? (
                  <span className="rounded-full bg-white/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    Search: {deferredQuery}
                  </span>
                ) : null}
                {kind !== "all" ? (
                  <span className="rounded-full bg-white/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    {kind}
                  </span>
                ) : null}
                {publisher !== "all" ? (
                  <span className="rounded-full bg-white/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    {currentPublisherName}
                  </span>
                ) : null}
                {sort !== "featured" ? (
                  <span className="rounded-full bg-white/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    {sort}
                  </span>
                ) : null}
              </div>
            )}

          </div>
        </div>

      </section>

      <section className="min-h-0 overflow-hidden rounded-[2rem]">
        <div className="flex h-full min-h-0 flex-col rounded-[2rem] border border-[var(--border-soft)] bg-white/35 p-3 shadow-[0_24px_70px_rgba(20,16,10,0.06)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between px-2">
            <div>
              <p className="eyebrow text-[var(--accent)]">Results</p>
              <p className="muted mt-1 text-sm">
                {filteredSkills.length} matching skills
              </p>
            </div>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
            ref={scrollAreaRef}
          >
            <div className="grid gap-4">
              {visibleSkills.length === 0 ? (
                <div className="glass rounded-[1.75rem] p-8">
                  <h3 className="text-2xl font-semibold">No skills match this filter set.</h3>
                  <p className="muted mt-3 max-w-xl leading-7">
                    Try removing the publisher filter first, then widen the search
                    term. This catalog is large enough that overly specific combinations
                    can easily collapse to zero.
                  </p>
                </div>
              ) : (
                visibleSkills.map((skill) => (
                  <Link
                    key={skill.slug}
                    className="glass skill-card grid gap-4 rounded-[1.75rem] p-5 sm:grid-cols-[220px_1fr_auto] sm:items-center"
                    href={`/skills/${skill.slug}`}
                  >
                    <div>
                      <p className="eyebrow muted">{skill.kind}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <PublisherMark slug={skill.publisherSlug} />
                        <p className="text-xl font-semibold leading-none">{skill.publisher}</p>
                      </div>
                      <p className="muted mt-2 text-xs uppercase tracking-[0.18em]">
                        {skill.sectionTitle}
                      </p>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{skill.name}</h2>
                      <p className="muted mt-2 leading-7">{skill.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {skill.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-3 justify-self-start sm:items-end sm:justify-self-end">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/62">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[var(--border-soft)]">
                          ★
                          <span>
                            {repoStatsBySlug[skill.slug]?.stars === null ||
                            repoStatsBySlug[skill.slug]?.stars === undefined
                              ? "—"
                              : formatCompactNumber(repoStatsBySlug[skill.slug]?.stars ?? 0)}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[var(--border-soft)]">
                          ⑂
                          <span>
                            {repoStatsBySlug[skill.slug]?.forks === null ||
                            repoStatsBySlug[skill.slug]?.forks === undefined
                              ? "—"
                              : formatCompactNumber(repoStatsBySlug[skill.slug]?.forks ?? 0)}
                          </span>
                        </span>
                      </div>
                      <span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                        Open
                      </span>
                    </div>
                  </Link>
                ))
              )}
              {hasMore ? <div aria-hidden="true" ref={sentinelRef} className="h-4" /> : null}
            </div>
          </div>
          {hasMore ? (
            <div className="mt-3 px-2 pb-1 text-center text-xs uppercase tracking-[0.22em] text-black/45">
              Scroll for more
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
