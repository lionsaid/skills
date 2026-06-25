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

function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="14"
      viewBox="0 0 16 16"
      width="14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.88 3.81 4.204.611a.75.75 0 0 1 .416 1.279l-3.042 2.965.718 4.186a.75.75 0 0 1-1.088.79L8 12.333l-3.76 1.976a.75.75 0 0 1-1.088-.79l.718-4.186L.827 6.368a.75.75 0 0 1 .416-1.279l4.204-.61L7.327.667A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="14"
      viewBox="0 0 16 16"
      width="14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 3.25a2.25 2.25 0 1 0-1.5 2.122v2.256A2.75 2.75 0 0 0 6.25 10.38h1v.998a2.25 2.25 0 1 0 1.5 0V10.38h1A2.75 2.75 0 0 0 12.5 7.63V5.372A2.251 2.251 0 1 0 11 5.372V7.63c0 .69-.56 1.25-1.25 1.25h-1V5.372a2.251 2.251 0 1 0-1.5 0V8.88h-1C5.56 8.88 5 8.32 5 7.63V5.372A2.25 2.25 0 0 0 5 3.25Z" />
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

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function NativeFilterSelect({
  label,
  value,
  onChange,
  options,
  leading,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  options: FilterOption[];
  leading?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/42">
        {label}
      </span>
      <div className="relative">
        <select
          className="h-12 w-full appearance-none rounded-full border border-[var(--border-soft)] bg-white/90 px-4 pr-10 text-sm outline-none transition focus:border-[var(--accent)]"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {options.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-black/45">
          ⌄
        </span>
      </div>
      {leading ? <div className="mt-2">{leading}</div> : null}
    </label>
  );
}

function DropdownFilter({
  currentLabel,
  currentLeading,
  onChange,
  options,
  value,
  widthClass = "w-full sm:min-w-[160px] sm:w-auto",
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
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-white shadow-[0_20px_50px_rgba(20,16,10,0.16)] sm:w-[250px]">
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [draftKind, setDraftKind] = useState<SkillFilterKind>(initialKind);
  const [draftPublisher, setDraftPublisher] = useState(initialPublisher);
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
  const activeFilterCount =
    Number(kind !== "all") + Number(publisher !== "all");

  const currentPublisherName =
    publishers.find((item) => item.slug === publisher)?.name ?? publisher;

  const currentKindLabel =
    kind === "all"
      ? "All skills"
      : kind === "official"
        ? "Official only"
        : "Community only";

  const currentSortLabel =
    sort === "featured"
      ? "Featured order"
      : sort === "name"
        ? "Alphabetical"
        : "By publisher";

  const currentDraftPublisherName =
    publishers.find((item) => item.slug === draftPublisher)?.name ?? draftPublisher;

  function resetAllFilters() {
    setQuery("");
    setKind("all");
    setPublisher("all");
    setSort("featured");
    setDraftKind("all");
    setDraftPublisher("all");
    setVisibleCount(PAGE_SIZE);
  }

  function openMobileFilters() {
    setDraftKind(kind);
    setDraftPublisher(publisher);
    setMobileFiltersOpen(true);
  }

  function closeMobileFilters() {
    setDraftKind(kind);
    setDraftPublisher(publisher);
    setMobileFiltersOpen(false);
  }

  function applyMobileFilters() {
    startTransition(() => {
      setKind(draftKind);
      setPublisher(draftPublisher);
      setVisibleCount(PAGE_SIZE);
      setMobileFiltersOpen(false);
    });
  }

  useEffect(() => {
    const missingSkills = visibleSkills.filter(
      (skill) => repoStatsBySlug[skill.slug] === undefined,
    );

    if (missingSkills.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadRepoStats() {
      try {
        const params = new URLSearchParams();
        for (const skill of missingSkills) {
          params.append("slug", skill.slug);
        }

        const response = await fetch(`/api/repo-stats?${params.toString()}`);
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as Record<string, RepoStats>;

        if (cancelled) {
          return;
        }

        setRepoStatsBySlug((current) => {
          const next = { ...current };
          for (const skill of missingSkills) {
            if (next[skill.slug] === undefined) {
              next[skill.slug] = payload[skill.slug] ?? { stars: null, forks: null };
            }
          }
          return next;
        });
      } catch {
        return;
      }
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

  useEffect(() => {
    if (!mobileFiltersOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileFiltersOpen]);

  return (
    <div className="page-shell h-full min-h-0 py-4 sm:py-5">
      <section className="h-full min-h-0 overflow-hidden rounded-[1.75rem] border border-[var(--border-soft)] bg-white/40 shadow-[0_24px_70px_rgba(20,16,10,0.07)] backdrop-blur sm:rounded-[2rem]">
        <div className="flex h-full min-h-0 flex-col p-3">
          <div className="relative z-30 rounded-[1.5rem] bg-white/34 px-2 py-2.5 sm:rounded-[1.75rem] sm:px-3 sm:py-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div
                  className="flex min-w-0 items-center gap-3 rounded-full border border-[var(--border-soft)] bg-white/80 px-5 sm:px-6 xl:max-w-[36rem] xl:flex-1"
                  style={{ height: 48 }}
                >
                  <FilterIcon />
                  <input
                    className="h-full w-full bg-transparent text-base outline-none placeholder:text-black/35"
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

                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 xl:hidden">
                  <button
                    aria-expanded={mobileFiltersOpen}
                    className={`flex h-12 items-center justify-between rounded-full border px-4 text-sm font-medium transition ${
                      mobileFiltersOpen || activeFilterCount > 0
                        ? "border-[var(--accent)] bg-white shadow-[0_12px_28px_rgba(23,105,255,0.14)]"
                        : "border-[var(--border-soft)] bg-white/80 hover:bg-white/90"
                    }`}
                    onClick={openMobileFilters}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <span>Filters</span>
                      {activeFilterCount > 0 ? (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--accent-soft)] px-1.5 text-[11px] font-semibold text-[var(--accent)]">
                          {activeFilterCount}
                        </span>
                      ) : null}
                    </span>
                    <span className="ml-3 text-black/50">⌄</span>
                  </button>

                  <DropdownFilter
                    currentLabel={currentSortLabel}
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
                    widthClass="w-full"
                  />
                </div>

                <div className="hidden xl:flex xl:flex-1 xl:flex-wrap xl:justify-end xl:gap-3">
                  <DropdownFilter
                    currentLabel={currentKindLabel}
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
                    widthClass="w-full xl:min-w-[150px] xl:w-auto"
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
                    widthClass="w-full xl:min-w-[180px] xl:w-auto"
                  />

                  <DropdownFilter
                    currentLabel={currentSortLabel}
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
                    widthClass="w-full xl:min-w-[170px] xl:w-auto"
                  />

                  <button
                    className={`h-12 rounded-full border px-4 text-sm font-medium transition xl:w-auto ${
                      deferredQuery || kind !== "all" || publisher !== "all" || sort !== "featured"
                        ? "border-[var(--accent)] bg-white text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                        : "border-[var(--border-soft)] bg-white/65 text-black/40 hover:bg-white/70"
                    }`}
                    onClick={() =>
                      startTransition(() => {
                        resetAllFilters();
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
                  <button
                    className="rounded-full bg-white/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-white"
                    onClick={() =>
                      startTransition(() => {
                        setQuery("");
                        setVisibleCount(PAGE_SIZE);
                      })
                    }
                    type="button"
                  >
                    Search: {deferredQuery} ✕
                  </button>
                ) : null}
                {kind !== "all" ? (
                  <button
                    className="rounded-full bg-white/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-white"
                    onClick={() =>
                      startTransition(() => {
                        setKind("all");
                        setVisibleCount(PAGE_SIZE);
                      })
                    }
                    type="button"
                  >
                    Type: {currentKindLabel} ✕
                  </button>
                ) : null}
                {publisher !== "all" ? (
                  <button
                    className="rounded-full bg-white/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-white"
                    onClick={() =>
                      startTransition(() => {
                        setPublisher("all");
                        setVisibleCount(PAGE_SIZE);
                      })
                    }
                    type="button"
                  >
                    Publisher: {currentPublisherName} ✕
                  </button>
                ) : null}
                {sort !== "featured" ? (
                  <button
                    className="rounded-full bg-white/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-white"
                    onClick={() =>
                      startTransition(() => {
                        setSort("featured");
                        setVisibleCount(PAGE_SIZE);
                      })
                    }
                    type="button"
                  >
                    Sort: {currentSortLabel} ✕
                  </button>
                ) : null}
              </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-[var(--border-soft)] pt-3 sm:mt-4 sm:pt-4">

            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-28 sm:pb-0"
              ref={scrollAreaRef}
            >
              <div className="grid gap-3 sm:gap-4">
                {visibleSkills.length === 0 ? (
                  <div className="glass rounded-[1.75rem] p-8">
                    <h3 className="text-2xl font-semibold">No skills match this filter set.</h3>
                    <p className="muted mt-3 max-w-xl leading-7">
                      Try removing the publisher filter first, then widen the search
                      term. This catalog is large enough that overly specific combinations
                      can easily collapse to zero.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
                        onClick={() =>
                          startTransition(() => {
                            resetAllFilters();
                          })
                        }
                        type="button"
                      >
                        Clear filters
                      </button>
                      {deferredQuery ? (
                        <button
                          className="rounded-full border border-[var(--border-soft)] bg-white/75 px-4 py-2 text-sm font-medium"
                          onClick={() =>
                            startTransition(() => {
                              setQuery("");
                              setVisibleCount(PAGE_SIZE);
                            })
                          }
                          type="button"
                        >
                          Remove search
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  visibleSkills.map((skill) => (
                    <Link
                      key={skill.slug}
                      className="glass skill-card grid gap-4 rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-5 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center"
                      href={`/skills/${skill.slug}`}
                    >
                      <div>
                        <p className="eyebrow muted">{skill.kind}</p>
                        <div className="mt-2 flex items-center gap-3">
                          <PublisherMark slug={skill.publisherSlug} />
                          <p className="min-w-0 text-xl font-semibold leading-none">{skill.publisher}</p>
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
                              className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.16em]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-3 justify-self-start lg:items-end lg:justify-self-end">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium tracking-[0.02em] text-[#59636e]">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e7d9b4] bg-[#fff8e6] px-3 py-1.5 text-[#8a6a18]">
                            <StarIcon />
                            <span>
                              {repoStatsBySlug[skill.slug]?.stars === null ||
                              repoStatsBySlug[skill.slug]?.stars === undefined
                                ? "—"
                                : formatCompactNumber(repoStatsBySlug[skill.slug]?.stars ?? 0)}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4dde8] bg-[#f5f9ff] px-3 py-1.5 text-[#5c6f88]">
                            <ForkIcon />
                            <span>
                              {repoStatsBySlug[skill.slug]?.forks === null ||
                              repoStatsBySlug[skill.slug]?.forks === undefined
                                ? "—"
                                : formatCompactNumber(repoStatsBySlug[skill.slug]?.forks ?? 0)}
                            </span>
                          </span>
                        </div>
                        <span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                          Open
                        </span>
                      </div>
                    </Link>
                  ))
                )}
                {hasMore ? <div aria-hidden="true" ref={sentinelRef} className="h-4" /> : null}
              </div>
            </div>

          </div>
        </div>
      </section>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            aria-label="Close filters"
            className="absolute inset-0 bg-[rgba(17,17,17,0.22)]"
            onClick={closeMobileFilters}
            type="button"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-hidden rounded-t-[2rem] border border-[var(--border-soft)] bg-[#f8f4ed] shadow-[0_-14px_30px_rgba(20,16,10,0.1)]">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Filters</h2>
                <p className="mt-1 text-sm text-black/50">
                  {activeFilterCount > 0 ? `${activeFilterCount} filters applied` : "Refine the catalog"}
                </p>
              </div>
              <button
                className="rounded-full border border-[var(--border-soft)] bg-white/80 px-4 py-2 text-sm font-medium"
                onClick={closeMobileFilters}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="flex max-h-[calc(82vh-148px)] flex-col gap-5 overflow-y-auto px-5 py-5">
              <NativeFilterSelect
                label="Type"
                onChange={(nextValue) => setDraftKind(nextValue as SkillFilterKind)}
                options={[
                  { value: "all", label: "All skills" },
                  { value: "official", label: "Official only" },
                  { value: "community", label: "Community only" },
                ]}
                value={draftKind}
              />

              <NativeFilterSelect
                label="Publisher"
                leading={
                  draftPublisher === "all" ? null : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/72 px-3 py-2 text-xs font-medium text-black/55">
                      <PublisherBadge label={currentDraftPublisherName} slug={draftPublisher} size="sm" />
                      {currentDraftPublisherName}
                    </span>
                  )
                }
                onChange={(nextValue) => setDraftPublisher(nextValue)}
                options={[
                  {
                    value: "all",
                    label: "All publishers",
                  },
                  ...publishers.map((item) => ({
                    value: item.slug,
                    label: `${item.name} (${item.count})`,
                  })),
                ]}
                value={draftPublisher}
              />
            </div>

            <div className="flex items-center gap-3 border-t border-[var(--border-soft)] bg-white/72 px-5 py-4">
              <button
                className="h-12 flex-1 rounded-full border border-transparent bg-transparent text-sm font-medium text-black/62 transition hover:bg-black/[0.04] hover:text-black"
                onClick={() => {
                  setDraftKind("all");
                  setDraftPublisher("all");
                }}
                type="button"
              >
                Reset
              </button>
              <button
                className="h-12 flex-1 rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-4 text-sm font-semibold text-[var(--accent)] shadow-none transition hover:bg-white"
                onClick={applyMobileFilters}
                type="button"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
