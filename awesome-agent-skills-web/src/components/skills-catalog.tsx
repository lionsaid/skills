"use client";

import Link from "next/link";
import { DelayedSkillLink } from "@/components/delayed-skill-link";
import { PublisherLogo } from "@/components/publisher-logo";
import { SkillAvatar } from "@/components/skill-avatar";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { PublisherSummary, SkillCatalogIndexItem, SkillCatalogItem, Skill } from "@/lib/skill-types";
import { getRoles, getSourceTypeLabel, getTrustLevelLabel, isPriorityPublisher, matchesSearchQuery, parseSearchQuery } from "@/lib/skills-common";
import { getCopy, type Locale } from "@/lib/i18n";
import { expandQueryAliases as expandQueryAliasesLight, type SkillFilterKind, type SkillSort, type SkillTrustFilter } from "@/lib/skills-common";

const PAGE_SIZE = 36;
const DEFAULT_CHUNK_SIZE = 120;

type SkillsCatalogProps = {
  locale?: Locale;
  initialKind: SkillFilterKind;
  initialPublisher: string;
  initialQuery: string;
  initialSort: SkillSort;
  initialTrustFilter: SkillTrustFilter;
  initialEnterpriseOnly: boolean;
  initialExcludeMarketplace: boolean;
  initialPersona?: string;
  initialJob?: string;
  publishers: PublisherSummary[];
  initialSkills: SkillCatalogItem[];
  totalSkills: number;
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

type SkillsCatalogChunkPayload = {
  generatedAt: string;
  chunkIndex: number;
  totalSkills: number;
  skills: SkillCatalogItem[];
};

type SkillsCatalogManifest = {
  generatedAt: string;
  totalSkills: number;
  chunkSize: number;
  chunkCount: number;
};

type SkillsCatalogIndexPayload = {
  generatedAt: string;
  totalSkills: number;
  chunkSize: number;
  fields?: string[];
  items: Array<
    | SkillCatalogIndexItem
    | [
        string,
        string,
        string,
        string,
        string,
        Skill["kind"],
        string[],
        string[],
        string[],
        Skill["sourceType"],
        Skill["trustLevel"],
        number,
      ]
  >;
};

function sortIndexSkills(skills: SkillCatalogIndexItem[], sort: SkillSort) {
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

function decodeCatalogIndexItem(
  item:
    | SkillCatalogIndexItem
    | [
        string,
        string,
        string,
        string,
        string,
        Skill["kind"],
        string[],
        string[],
        string[],
        Skill["sourceType"],
        Skill["trustLevel"],
        number,
      ],
): SkillCatalogIndexItem {
  if (!Array.isArray(item)) {
    return item;
  }

  const [
    slug,
    name,
    description,
    publisher,
    publisherSlug,
    kind,
    tags,
    personas,
    jobs,
    sourceType,
    trustLevel,
    chunkIndex,
  ] = item;

  return {
    slug,
    name,
    description,
    publisher,
    publisherSlug,
    kind,
    tags,
    personas,
    jobs,
    sourceType,
    trustLevel,
    chunkIndex,
  };
}

function normalizeSearchInput(value: string) {
  const trimmedLeft = value.replace(/^\s+/, "");
  const withoutSpaces = trimmedLeft.replace(/\s+/g, "");
  const characters = Array.from(withoutSpaces.toLocaleLowerCase());

  if (
    trimmedLeft.includes(" ") &&
    characters.length > 1 &&
    characters.every((character) => character === characters[0])
  ) {
    return withoutSpaces;
  }

  if (/^(?:[\p{L}\p{N}]\s+){2,}[\p{L}\p{N}]?\s*$/u.test(trimmedLeft)) {
    return withoutSpaces;
  }

  return trimmedLeft.replace(/\s{2,}/g, " ");
}

function getTrustTone(trustLevel: Skill["trustLevel"]) {
  if (trustLevel === "official") {
    return "border-[#b7ebc6] bg-[#eefcf2] text-[#246a35]";
  }

  if (trustLevel === "curated") {
    return "border-[#d9d8ff] bg-[#f4f2ff] text-[#5745c6]";
  }

  return "border-[#f1d6d6] bg-[#fff3f3] text-[#9a4040]";
}

function getSourceTone(sourceType: Skill["sourceType"]) {
  if (sourceType === "official-site") {
    return "border-[#bfd9ff] bg-[#f2f7ff] text-[#2f63b4]";
  }

  if (sourceType === "marketplace") {
    return "border-[#f3ddbb] bg-[#fff7ec] text-[#9b6820]";
  }

  if (sourceType === "github-discovery") {
    return "border-[#e2d8f7] bg-[#f8f4ff] text-[#7054ae]";
  }

  return "border-[#d8e0ea] bg-[#f6f8fb] text-[#556577]";
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 16L20 20"
        stroke="currentColor"
        strokeLinecap="round"
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
  return <PublisherLogo name={label} size={size === "sm" ? "sm" : "md"} slug={slug} />;
}

function PublisherMark({ slug }: { slug: string }) {
  const label = slug
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

  return <PublisherLogo name={label} size="sm" slug={slug} />;
}

function SkillOwnerMark({ skill }: { skill: SkillCatalogItem }) {
  if (skill.sourceType === "github-discovery" || skill.creatorAvatarUrl) {
    return <SkillAvatar avatarUrl={skill.creatorAvatarUrl} name={skill.creatorHandle ?? skill.publisher} size="sm" />;
  }

  return <PublisherMark slug={skill.publisherSlug} />;
}

function formatCompactNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "zh-CN" ? "zh-CN" : "en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatFullNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "zh-CN" ? "zh-CN" : "en").format(value);
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
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {label}
      </span>
      <div className="relative">
        <select
          className="h-12 w-full appearance-none rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 pr-10 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {options.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--ink-muted)]">
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
        className={`catalog-control flex h-12 w-full items-center justify-between rounded-full border px-4 text-sm outline-none transition ${
          open
            ? "catalog-control-active shadow-[0_12px_28px_rgba(225,6,0,0.14)] ring-1 ring-[var(--accent-soft)]"
            : "hover:bg-[var(--surface)] focus:border-[var(--accent)]"
        }`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {currentLeading ? currentLeading : null}
          <span className="truncate">{currentLabel}</span>
        </span>
        <span className={`ml-3 text-[var(--ink-muted)] transition ${open ? "rotate-180 text-[var(--accent)]" : ""}`}>
          ⌄
        </span>
      </button>

      {open ? (
        <div className="catalog-popover absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full min-w-0 overflow-hidden rounded-2xl border shadow-[0_20px_50px_rgba(20,16,10,0.16)] sm:w-[250px]">
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
                {item.trailing ? <span className="text-xs text-[var(--ink-muted)]">{item.trailing}</span> : null}
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
  locale = "en",
  initialKind,
  initialPublisher,
  initialQuery,
  initialSort,
  initialTrustFilter,
  initialEnterpriseOnly,
  initialExcludeMarketplace,
  initialPersona = "all",
  initialJob = "all",
  publishers,
  initialSkills,
  totalSkills,
}: SkillsCatalogProps) {
  const copy = getCopy(locale);
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<SkillFilterKind>(initialKind);
  const [publisher, setPublisher] = useState(initialPublisher);
  const [sort, setSort] = useState<SkillSort>(initialSort);
  const [trustFilter, setTrustFilter] = useState<SkillTrustFilter>(initialTrustFilter);
  const [enterpriseOnly, setEnterpriseOnly] = useState(initialEnterpriseOnly);
  const [excludeMarketplace, setExcludeMarketplace] = useState(initialExcludeMarketplace);
  const [persona, setPersona] = useState(initialPersona);
  const [job, setJob] = useState(initialJob);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [draftKind, setDraftKind] = useState<SkillFilterKind>(initialKind);
  const [draftPublisher, setDraftPublisher] = useState(initialPublisher);
  const [draftTrustFilter, setDraftTrustFilter] = useState<SkillTrustFilter>(initialTrustFilter);
  const [draftEnterpriseOnly, setDraftEnterpriseOnly] = useState(initialEnterpriseOnly);
  const [draftExcludeMarketplace, setDraftExcludeMarketplace] = useState(initialExcludeMarketplace);
  const [draftPersona, setDraftPersona] = useState(initialPersona);
  const [draftJob, setDraftJob] = useState(initialJob);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(
    initialKind !== "all" ||
      initialPublisher !== "all" ||
      initialTrustFilter !== "all" ||
      initialPersona !== "all" ||
      initialJob !== "all" ||
      initialEnterpriseOnly ||
      initialExcludeMarketplace ||
      initialSort !== "featured",
  );
  const [desktopFiltersExpanded, setDesktopFiltersExpanded] = useState(false);
  const [catalogIndex, setCatalogIndex] = useState<SkillCatalogIndexItem[]>(
    initialSkills.map((skill, index) => ({
      ...skill,
      chunkIndex: Math.floor(index / DEFAULT_CHUNK_SIZE),
    })),
  );
  const [catalogSkills, setCatalogSkills] = useState<SkillCatalogItem[]>(initialSkills);
  const [catalogLoaded, setCatalogLoaded] = useState(initialSkills.length >= totalSkills);
  const [catalogVersion, setCatalogVersion] = useState<string | null>(null);
  const [loadedChunkIndexes, setLoadedChunkIndexes] = useState<Set<number>>(() => new Set());
  const [repoStatsBySlug, setRepoStatsBySlug] = useState<Record<string, RepoStats>>(() =>
    Object.fromEntries(
      initialSkills.map((skill) => [
        skill.slug,
        {
          stars: skill.stars ?? null,
          forks: skill.forks ?? null,
        },
      ]),
    ),
  );
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const [showBackToSearch, setShowBackToSearch] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalogIndex() {
      try {
        const manifestResponse = await fetch("/data/skills-catalog/manifest.json", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!manifestResponse.ok) {
          throw new Error(`Failed to load skills manifest: ${manifestResponse.status}`);
        }

        const manifestPayload = (await manifestResponse.json()) as SkillsCatalogManifest;
        const version = manifestPayload.generatedAt;
        const indexResponseWithVersion = await fetch(
          `/data/skills-catalog/index.json?v=${encodeURIComponent(version)}`,
          {
            cache: "force-cache",
            signal: controller.signal,
          },
        );

        if (!indexResponseWithVersion.ok) {
          throw new Error(`Failed to load skills index: ${indexResponseWithVersion.status}`);
        }

        const indexPayload = (await indexResponseWithVersion.json()) as SkillsCatalogIndexPayload;
        if (!controller.signal.aborted) {
          setCatalogVersion(version);
          setCatalogIndex(indexPayload.items.map((item) => decodeCatalogIndexItem(item)));
          setLoadedChunkIndexes(new Set());
          setCatalogLoaded(initialSkills.length >= manifestPayload.totalSkills);
        }
      } catch {
        if (!controller.signal.aborted) {
          setCatalogLoaded(initialSkills.length >= totalSkills);
        }
      }
    }

    void loadCatalogIndex();

    return () => controller.abort();
  }, [initialSkills, totalSkills]);

  const filteredIndexSkills = useMemo(() => {
    const parsedQuery = parseSearchQuery(query);
    const expandedJobs = expandQueryAliasesLight(parsedQuery.normalized);

    const subset = catalogIndex.filter((skill) => {
      const matchesQuery = matchesSearchQuery(
        [
          skill.name,
          skill.description,
          skill.publisher,
          ...skill.tags,
          ...skill.personas,
          ...skill.jobs,
        ],
        parsedQuery,
        expandedJobs.filter((matchedJob) => skill.jobs.includes(matchedJob)),
      );

      const matchesPublisher =
        publisher === "all" || skill.publisherSlug === publisher;

      const matchesKind = kind === "all" || skill.kind === kind;
      const matchesTrust =
        trustFilter === "all" || skill.trustLevel === trustFilter;
      const matchesEnterprise =
        !enterpriseOnly || isPriorityPublisher(skill.publisherSlug);
      const matchesMarketplace =
        !excludeMarketplace || skill.sourceType !== "marketplace";
      const matchesPersona = persona === "all" || skill.personas.includes(persona);
      const matchesJob = job === "all" || skill.jobs.includes(job);

      return (
        matchesQuery &&
        matchesPublisher &&
        matchesKind &&
        matchesTrust &&
        matchesEnterprise &&
        matchesMarketplace &&
        matchesPersona &&
        matchesJob
      );
    });

    return sortIndexSkills(subset, sort);
  }, [query, kind, publisher, catalogIndex, sort, trustFilter, enterpriseOnly, excludeMarketplace, persona, job]);

  const totalPages = Math.max(1, Math.ceil(filteredIndexSkills.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleLimit = safePage * PAGE_SIZE;
  const currentPageIndexSkills = useMemo(
    () => filteredIndexSkills.slice(0, visibleLimit),
    [filteredIndexSkills, visibleLimit],
  );
  const requiredChunkIndexes = useMemo(
    () => [...new Set(currentPageIndexSkills.map((skill) => skill.chunkIndex))].sort((a, b) => a - b),
    [currentPageIndexSkills],
  );
  const visibleSkills = useMemo(() => {
    const bySlug = new Map(catalogSkills.map((skill) => [skill.slug, skill]));
    return currentPageIndexSkills
      .map((skill) => bySlug.get(skill.slug))
      .filter((skill): skill is SkillCatalogItem => Boolean(skill));
  }, [catalogSkills, currentPageIndexSkills]);
  useEffect(() => {
    const controller = new AbortController();

    async function ensurePageChunks() {
      if (!catalogVersion) {
        return;
      }

      const missingChunkIndexes = requiredChunkIndexes.filter((index) => !loadedChunkIndexes.has(index));

      if (missingChunkIndexes.length === 0) {
        return;
      }

      try {
        const chunks = await Promise.all(
          missingChunkIndexes.map(async (index) => {
            const response = await fetch(`/data/skills-catalog/chunk-${index}.json?v=${encodeURIComponent(catalogVersion)}`, {
              cache: "force-cache",
              signal: controller.signal,
            });

            if (!response.ok) {
              throw new Error(`Failed to load skills chunk ${index}: ${response.status}`);
            }

            return (await response.json()) as SkillsCatalogChunkPayload;
          }),
        );

        if (controller.signal.aborted) {
          return;
        }

        setCatalogSkills((current) => {
          const bySlug = new Map(current.map((skill) => [skill.slug, skill]));
          for (const chunk of chunks) {
            for (const skill of chunk.skills) {
              bySlug.set(skill.slug, skill);
            }
          }
          return [...bySlug.values()];
        });

        setRepoStatsBySlug((current) => {
          const next = { ...current };
          for (const chunk of chunks) {
            for (const skill of chunk.skills) {
              next[skill.slug] = {
                stars: skill.stars ?? null,
                forks: skill.forks ?? null,
              };
            }
          }
          return next;
        });

        setLoadedChunkIndexes((current) => {
          const next = new Set(current);
          for (const index of missingChunkIndexes) {
            next.add(index);
          }
          return next;
        });
      } catch {
        return;
      }
    }

    void ensurePageChunks();

    return () => controller.abort();
  }, [catalogVersion, requiredChunkIndexes, loadedChunkIndexes]);
  const activeFilterCount =
    Number(query !== "") +
    Number(kind !== "all") +
    Number(publisher !== "all") +
    Number(trustFilter !== "all") +
    Number(enterpriseOnly) +
    Number(excludeMarketplace) +
    Number(persona !== "all") +
    Number(job !== "all");
  const currentPublisherName =
    publishers.find((item) => item.slug === publisher)?.name ?? publisher;

  const currentKindLabel =
    kind === "all"
      ? copy.skills.allSkills
      : kind === "official"
        ? copy.skills.officialOnly
        : copy.skills.communityOnly;

  const currentSortLabel =
    sort === "featured"
      ? copy.skillFilters.sort.featured
      : sort === "name"
        ? copy.skillFilters.sort.name
        : copy.skillFilters.sort.publisher;
  const currentTrustLabel =
    trustFilter === "all" ? copy.skills.trustAll : getTrustLevelLabel(trustFilter, locale);

  const currentDraftPublisherName =
    publishers.find((item) => item.slug === draftPublisher)?.name ?? draftPublisher;
  const hasActiveSearchOrFilter =
    query.trim() !== "" ||
    kind !== "all" ||
    publisher !== "all" ||
    trustFilter !== "all" ||
    enterpriseOnly ||
    excludeMarketplace ||
    persona !== "all" ||
    job !== "all";
  const headerResultsLabel = hasActiveSearchOrFilter
    ? catalogLoaded
      ? locale === "zh-CN"
        ? `当前显示第 ${safePage} 页，已展示 ${visibleSkills.length} / ${filteredIndexSkills.length} 个结果`
        : `Showing page ${safePage}, with ${visibleSkills.length} of ${filteredIndexSkills.length} results`
      : locale === "zh-CN"
        ? `当前显示第 ${safePage} 页，已展示 ${visibleSkills.length} 个结果，正在从 ${formatFullNumber(totalSkills, locale)} 个已索引 skill 中继续筛选`
        : `Showing page ${safePage}, with ${visibleSkills.length} results while filtering across ${formatFullNumber(totalSkills, locale)} indexed skills`
    : locale === "zh-CN"
      ? `当前显示第 ${safePage} 页，已展示 ${visibleSkills.length} / ${formatFullNumber(totalSkills, locale)} 个已索引 skill`
      : `Showing page ${safePage}, with ${visibleSkills.length} of ${formatFullNumber(totalSkills, locale)} indexed skills`;
  const desktopResultsLabel = hasActiveSearchOrFilter
    ? catalogLoaded
      ? locale === "zh-CN"
        ? `${formatFullNumber(filteredIndexSkills.length, locale)} 个结果`
        : `${formatFullNumber(filteredIndexSkills.length, locale)} results`
      : locale === "zh-CN"
        ? `索引命中 ${formatFullNumber(filteredIndexSkills.length, locale)} 个`
        : `${formatFullNumber(filteredIndexSkills.length, locale)} matched`
    : locale === "zh-CN"
      ? `${formatFullNumber(totalSkills, locale)} 个已索引`
      : `${formatFullNumber(totalSkills, locale)} indexed`;

  function resetAllFilters() {
    setQuery("");
    setKind("all");
    setPublisher("all");
    setSort("featured");
    setTrustFilter("all");
    setEnterpriseOnly(false);
    setExcludeMarketplace(false);
    setPersona("all");
    setJob("all");
    setPage(1);
    setDraftKind("all");
    setDraftPublisher("all");
    setDraftTrustFilter("all");
    setDraftEnterpriseOnly(false);
    setDraftExcludeMarketplace(false);
    setDraftPersona("all");
    setDraftJob("all");
  }

  function openMobileFilters() {
    setDraftKind(kind);
    setDraftPublisher(publisher);
    setDraftTrustFilter(trustFilter);
    setDraftEnterpriseOnly(enterpriseOnly);
    setDraftExcludeMarketplace(excludeMarketplace);
    setDraftPersona(persona);
    setDraftJob(job);
    setMobileFiltersOpen(true);
  }

  function closeMobileFilters() {
    setDraftKind(kind);
    setDraftPublisher(publisher);
    setDraftTrustFilter(trustFilter);
    setDraftEnterpriseOnly(enterpriseOnly);
    setDraftExcludeMarketplace(excludeMarketplace);
    setDraftPersona(persona);
    setDraftJob(job);
    setMobileFiltersOpen(false);
  }

  function applyMobileFilters() {
    startTransition(() => {
      setKind(draftKind);
      setPublisher(draftPublisher);
      setTrustFilter(draftTrustFilter);
      setEnterpriseOnly(draftEnterpriseOnly);
      setExcludeMarketplace(draftExcludeMarketplace);
      setPersona(draftPersona);
      setJob(draftJob);
      setPage(1);
      setMobileFiltersOpen(false);
    });
  }

  const roles = getRoles();
  const personaOptions = [
    { value: "all", label: copy.skills.allRoles },
    ...roles.map((role) => ({ value: role.slug, label: copy.roleLabels[role.slug] ?? role.label })),
  ];

  const jobOptions = [
    { value: "all", label: copy.skills.allTasks },
    { value: "sql-analysis", label: copy.taskLabels["sql-analysis"] },
    { value: "spreadsheet-cleaning", label: copy.taskLabels["spreadsheet-cleaning"] },
    { value: "dashboarding", label: copy.taskLabels["dashboarding"] },
    { value: "reporting", label: copy.taskLabels["reporting"] },
    { value: "data-extraction", label: copy.taskLabels["data-extraction"] },
    { value: "workflow-automation", label: copy.taskLabels["workflow-automation"] },
    { value: "research-synthesis", label: copy.taskLabels["research-synthesis"] },
    { value: "development-workflows", label: copy.taskLabels["development-workflows"] },
    { value: "testing-debugging", label: copy.taskLabels["testing-debugging"] },
    { value: "deployment-ops", label: copy.taskLabels["deployment-ops"] },
    { value: "api-integration", label: copy.taskLabels["api-integration"] },
    { value: "prd-specs", label: copy.taskLabels["prd-specs"] },
    { value: "planning-roadmapping", label: copy.taskLabels["planning-roadmapping"] },
    { value: "ui-ux-design", label: copy.taskLabels["ui-ux-design"] },
    { value: "design-critique", label: copy.taskLabels["design-critique"] },
    { value: "presentation-building", label: copy.taskLabels["presentation-building"] },
    { value: "visual-assets", label: copy.taskLabels["visual-assets"] },
    { value: "content-production", label: copy.taskLabels["content-production"] },
    { value: "campaign-planning", label: copy.taskLabels["campaign-planning"] },
    { value: "landing-pages", label: copy.taskLabels["landing-pages"] },
    { value: "document-authoring", label: copy.taskLabels["document-authoring"] },
  ];

  const currentPersonaLabel =
    personaOptions.find((item) => item.value === persona)?.label ?? persona;
  const currentJobLabel =
    jobOptions.find((item) => item.value === job)?.label ?? job;

  useEffect(() => {
    if (typeof window === "undefined" || (!desktopFiltersOpen && !desktopFiltersExpanded)) {
      return;
    }

    let collapsed = false;

    const collapseFilters = () => {
      if (collapsed) {
        return;
      }
      collapsed = true;
      setDesktopFiltersOpen(false);
      setDesktopFiltersExpanded(false);
    };

    const onScroll = () => {
      if (window.scrollY > 8) {
        collapseFilters();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [desktopFiltersOpen, desktopFiltersExpanded]);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onScroll = () => {
      setShowBackToSearch(window.scrollY > 520);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1760px] min-w-0 flex-col px-3 py-3 sm:h-full sm:px-5 sm:py-4 lg:px-6">
      <section className="catalog-shell flex min-h-0 flex-col overflow-visible rounded-[1.75rem] border shadow-[0_24px_70px_rgba(20,16,10,0.07)] backdrop-blur sm:flex-1 sm:overflow-hidden sm:rounded-[2rem]">
        <div className="grid min-h-0 min-w-0 p-2.5 sm:flex-1 sm:grid-rows-[auto_auto_minmax(0,1fr)] sm:p-3">
          <div className="relative z-30 shrink-0 px-0.5 py-0.5 sm:px-1 sm:py-1">
            <div className="flex flex-col gap-3">
              <div className="catalog-top-grid flex min-w-0 flex-col gap-3">
                <div className="flex min-w-0 flex-col gap-2.5 xl:flex-row xl:items-center">
                  <div className="min-w-0 flex-1">
                    <div
                      ref={searchBarRef}
                      className="catalog-search-wrap catalog-control flex min-w-0 items-center gap-3 rounded-[1.2rem] border px-4 sm:px-5"
                      style={{ minHeight: 50 }}
                    >
                      <SearchIcon />
                      <input
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="h-full w-full bg-transparent text-base text-[var(--foreground)] outline-none placeholder:text-[var(--ink-muted)]"
                        onChange={(event) => {
                          const nextValue = normalizeSearchInput(event.target.value);
                          setQuery(nextValue);
                          setPage(1);
                        }}
                        placeholder={copy.skills.searchPlaceholder}
                        spellCheck={false}
                        type="search"
                        value={query}
                      />
                    </div>
                  </div>

                  <div className="hidden xl:flex xl:min-w-[fit-content] xl:shrink-0 xl:items-center xl:justify-end">
                    <button
                      aria-expanded={desktopFiltersOpen}
                      className={`catalog-control inline-flex min-h-[50px] items-center whitespace-nowrap rounded-[1.2rem] border px-4 text-sm font-medium transition hover:bg-[var(--surface)] ${
                        desktopFiltersOpen ? "catalog-control-active shadow-[0_12px_28px_rgba(225,6,0,0.14)]" : ""
                      }`}
                      onClick={() => setDesktopFiltersOpen((current) => !current)}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span>
                          {locale === "zh-CN" ? "展开筛选" : "Show filters"} {desktopFiltersOpen ? "−" : "+"}
                        </span>
                        {activeFilterCount > 0 ? (
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-semibold text-[var(--accent-contrast)]">
                            {activeFilterCount}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid min-w-0 grid-cols-1 gap-2.5 xl:hidden">
                  <button
                    aria-expanded={mobileFiltersOpen}
                    className={`catalog-control flex h-12 min-w-0 items-center justify-between rounded-full border px-4 text-sm font-medium transition ${
                      mobileFiltersOpen || activeFilterCount > 0
                        ? "catalog-control-active shadow-[0_12px_28px_rgba(225,6,0,0.14)]"
                        : "hover:bg-[var(--surface)]"
                    }`}
                    onClick={openMobileFilters}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <span>{locale === "zh-CN" ? "筛选" : "Filters"}</span>
                      {activeFilterCount > 0 ? (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-semibold text-[var(--accent-contrast)]">
                          {activeFilterCount}
                        </span>
                      ) : null}
                    </span>
                    <span className="ml-3 text-[var(--ink-muted)]">⌄</span>
                  </button>
                </div>

                <div className="hidden xl:flex xl:min-w-0 xl:flex-col xl:gap-2.5">
                  {desktopFiltersOpen ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                            {locale === "zh-CN" ? "筛选条件" : "Filters"}
                          </p>
                          <p className="mt-1 text-sm text-[var(--ink-muted)]">
                            {locale === "zh-CN"
                              ? "需要时再展开，按来源、公司、任务和排序缩小范围。"
                              : "Open only when needed, then narrow by source, company, task, or sort."}
                          </p>
                        </div>
                        <div className="rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)]">
                          {desktopResultsLabel}
                        </div>
                      </div>

                      <div className="grid min-w-0 grid-cols-[repeat(3,minmax(0,1fr))_auto] gap-2 2xl:gap-2.5">
                        <DropdownFilter
                          currentLabel={currentKindLabel}
                          onChange={(nextValue) =>
                            startTransition(() => {
                              setKind(nextValue as SkillFilterKind);
                              setPage(1);
                            })
                          }
                          options={[
                            { value: "all", label: copy.skills.allSkills },
                            { value: "official", label: copy.skills.officialOnly },
                            { value: "community", label: copy.skills.communityOnly },
                          ]}
                          value={kind}
                          widthClass="w-full"
                        />

                        <DropdownFilter
                          currentLabel={currentPublisherName}
                          currentLeading={
                            publisher === "all" ? (
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border-soft)] bg-[var(--surface)] text-[11px] font-semibold text-[var(--ink-muted)]">
                                {locale === "zh-CN" ? "全" : "All"}
                              </span>
                            ) : (
                              <PublisherBadge label={currentPublisherName} slug={publisher} size="sm" />
                            )
                          }
                          onChange={(nextValue) =>
                            startTransition(() => {
                              setPublisher(nextValue);
                              setPage(1);
                            })
                          }
                          options={[
                            {
                              value: "all",
                              label: copy.common.allPublishers,
                              leading: (
                                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border-soft)] bg-[var(--surface)] text-[11px] font-semibold text-[var(--ink-muted)]">
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
                          widthClass="w-full"
                        />

                        <DropdownFilter
                          currentLabel={currentJobLabel}
                          onChange={(nextValue) =>
                            startTransition(() => {
                              setJob(nextValue);
                              setPage(1);
                            })
                          }
                          options={jobOptions}
                          value={job}
                          widthClass="w-full"
                        />

                        <DropdownFilter
                          currentLabel={currentSortLabel}
                          onChange={(nextValue) =>
                            startTransition(() => {
                              setSort(nextValue as SkillSort);
                              setPage(1);
                            })
                          }
                          options={[
                            { value: "featured", label: copy.skillFilters.sort.featured },
                            { value: "name", label: copy.skillFilters.sort.name },
                            { value: "publisher", label: copy.skillFilters.sort.publisher },
                          ]}
                          value={sort}
                          widthClass="w-full"
                        />

                        <button
                          aria-expanded={desktopFiltersExpanded}
                          className={`catalog-control h-12 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition hover:bg-[var(--surface)] ${
                            desktopFiltersExpanded ? "catalog-control-active shadow-[0_12px_28px_rgba(225,6,0,0.14)]" : ""
                          }`}
                          onClick={() => setDesktopFiltersExpanded((current) => !current)}
                          type="button"
                        >
                          {locale === "zh-CN" ? "更多筛选" : "More filters"} {desktopFiltersExpanded ? "−" : "+"}
                        </button>
                      </div>

                      {desktopFiltersExpanded ? (
                        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto] gap-2 border-t border-[var(--border-soft)] pt-2.5 2xl:gap-2.5">
                          <DropdownFilter
                            currentLabel={currentTrustLabel}
                            onChange={(nextValue) =>
                              startTransition(() => {
                                setTrustFilter(nextValue as SkillTrustFilter);
                                setPage(1);
                              })
                            }
                            options={[
                              { value: "all", label: copy.skills.trustAll },
                              { value: "official", label: copy.skillFilters.trust.official },
                              { value: "curated", label: copy.skillFilters.trust.curated },
                              { value: "untrusted", label: copy.skillFilters.trust.untrusted },
                            ]}
                            value={trustFilter}
                            widthClass="w-full"
                          />

                          <DropdownFilter
                            currentLabel={currentPersonaLabel}
                            onChange={(nextValue) =>
                              startTransition(() => {
                                setPersona(nextValue);
                                setPage(1);
                              })
                            }
                            options={personaOptions}
                            value={persona}
                            widthClass="w-full"
                          />

                          <button
                            className={`catalog-control h-12 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
                              enterpriseOnly
                                ? "catalog-control-active shadow-[0_12px_28px_rgba(225,6,0,0.14)]"
                                : "hover:bg-[var(--surface)]"
                            }`}
                            onClick={() =>
                              startTransition(() => {
                                setEnterpriseOnly((current) => !current);
                                setPage(1);
                              })
                            }
                            type="button"
                          >
                            {copy.skills.enterpriseOnly}
                          </button>

                          <button
                            className={`catalog-control h-12 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
                              excludeMarketplace
                                ? "catalog-control-active shadow-[0_12px_28px_rgba(225,6,0,0.14)]"
                                : "hover:bg-[var(--surface)]"
                            }`}
                            onClick={() =>
                              startTransition(() => {
                                setExcludeMarketplace((current) => !current);
                                setPage(1);
                              })
                            }
                            type="button"
                          >
                            {copy.skills.excludeMarketplace}
                          </button>

                          <button
                            className={`catalog-control h-12 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
                              activeFilterCount > 0 || sort !== "featured"
                                ? "catalog-control-active hover:bg-[var(--foreground)]"
                                : "text-[var(--ink-muted)] hover:bg-[var(--surface)]"
                            }`}
                            onClick={() =>
                              startTransition(() => {
                                resetAllFilters();
                              })
                            }
                            type="button"
                          >
                            {locale === "zh-CN" ? "重置" : "Reset"}
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col border-t border-[var(--border-soft)] pt-3">

            <div className="mb-3 flex shrink-0 flex-col gap-2 rounded-[1.1rem] border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="min-w-0 break-words sm:truncate">
                {headerResultsLabel}
              </p>
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end sm:gap-3">
                {!catalogLoaded ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {locale === "zh-CN" ? "按需加载中" : "Loading on demand"}
                  </p>
                ) : totalPages > 1 ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {locale === "zh-CN" ? `共 ${totalPages} 页` : `${totalPages} pages total`}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              ref={listScrollRef}
              data-testid="skills-list-scroll"
              className="min-h-0 overflow-visible pb-24 sm:pb-6"
            >
              <div className="grid gap-3 sm:gap-4">
                {visibleSkills.length === 0 ? (
                  <div className="glass rounded-[1.75rem] p-8">
                    <h3 className="text-2xl font-semibold">
                      {locale === "zh-CN" ? "暂时没找到合适的 skill。" : "No matching skills yet."}
                    </h3>
                    <p className="muted mt-3 max-w-xl leading-7">
                      {locale === "zh-CN"
                        ? "先少选几个条件试试，或者换个更宽一点的关键词，通常很快就能看到结果。"
                        : "Try fewer filters or a broader keyword. That usually brings useful results back quickly."}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        className="action-primary rounded-full border px-4 py-2 text-sm font-semibold transition"
                        onClick={() =>
                          startTransition(() => {
                            resetAllFilters();
                          })
                        }
                        type="button"
                      >
                        {locale === "zh-CN" ? "清除筛选" : "Clear filters"}
                      </button>
                      {query ? (
                        <button
                          className="action-secondary rounded-full border px-4 py-2 text-sm font-semibold transition"
                          onClick={() =>
                            startTransition(() => {
                              setQuery("");
                              setPage(1);
                            })
                          }
                          type="button"
                        >
                          {locale === "zh-CN" ? "移除搜索" : "Remove search"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  visibleSkills.map((skill) => (
                    <DelayedSkillLink
                      key={skill.slug}
                      className="glass skill-card grid min-w-0 gap-4 rounded-[1.5rem] p-4 text-left sm:rounded-[1.75rem] sm:p-5 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center"
                      locale={locale}
                      skillSlug={skill.slug}
                    >
                      <div className="min-w-0">
                        <p className="eyebrow muted">{skill.kind}</p>
                        <div className="mt-2 flex min-w-0 items-center gap-3">
                          <SkillOwnerMark skill={skill} />
                          <div className="min-w-0">
                            <p className="truncate text-xl font-semibold leading-none">{skill.publisher}</p>
                            {skill.creatorHandle ? (
                              <p className="mt-1 truncate text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                                @{skill.creatorHandle}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <p className="muted mt-2 text-xs uppercase tracking-[0.18em]">
                          {skill.sectionTitle}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl font-semibold">{skill.name}</h2>
                        <p className="muted mt-2 leading-7">{skill.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getTrustTone(
                              skill.trustLevel,
                            )}`}
                          >
                            {getTrustLevelLabel(skill.trustLevel, locale)}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getSourceTone(
                              skill.sourceType,
                            )}`}
                          >
                            {getSourceTypeLabel(skill.sourceType, locale)}
                          </span>
                          {skill.riskFlags.slice(0, 2).map((flag) => (
                            <span
                              key={flag}
                              className="inline-flex items-center rounded-full border border-[#edd7d7] bg-[#fff5f5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b4b4b]"
                            >
                              {flag.replaceAll("-", " ")}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {skill.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="catalog-chip rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.16em]"
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
                              : formatCompactNumber(repoStatsBySlug[skill.slug]?.stars ?? 0, locale)}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4dde8] bg-[#f5f9ff] px-3 py-1.5 text-[#5c6f88]">
                            <ForkIcon />
                            <span>
                              {repoStatsBySlug[skill.slug]?.forks === null ||
                              repoStatsBySlug[skill.slug]?.forks === undefined
                                ? "—"
                                : formatCompactNumber(repoStatsBySlug[skill.slug]?.forks ?? 0, locale)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </DelayedSkillLink>
                  ))
                )}
                {filteredIndexSkills.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                    <div className="rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--ink-muted)]">
                      {locale === "zh-CN"
                        ? `已加载第 ${safePage} / ${totalPages} 页`
                        : `Loaded ${safePage} of ${totalPages} pages`}
                    </div>
                    {safePage < totalPages ? (
                      <button
                        className="action-primary inline-flex min-w-[11rem] items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition"
                        onClick={() => {
                          setPage((current) => Math.min(totalPages, Math.max(current, safePage) + 1));
                        }}
                        type="button"
                      >
                        {locale === "zh-CN" ? "立即加载下一页" : "Load next page now"}
                      </button>
                    ) : (
                      <div className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--ink-muted)]">
                        {locale === "zh-CN" ? "已加载完全部结果" : "All results loaded"}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

          </div>
        </div>
      </section>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden" data-testid="mobile-filters-modal">
          <button
            aria-label={locale === "zh-CN" ? "关闭筛选" : "Close filters"}
            className="absolute inset-0 bg-[rgba(17,17,17,0.22)]"
            onClick={closeMobileFilters}
            type="button"
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-hidden rounded-t-[2rem] border border-[var(--border-soft)] bg-[#f8f4ed] shadow-[0_-14px_30px_rgba(20,16,10,0.1)]"
            data-testid="mobile-filters-sheet"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">{locale === "zh-CN" ? "筛选" : "Filters"}</h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  {activeFilterCount > 0
                    ? locale === "zh-CN"
                      ? `已应用 ${activeFilterCount} 个筛选`
                      : `${activeFilterCount} filters applied`
                    : locale === "zh-CN"
                      ? "继续缩小目录"
                      : "Refine the catalog"}
                </p>
              </div>
              <button
                className="action-secondary rounded-full border px-4 py-2 text-sm font-semibold transition"
                onClick={closeMobileFilters}
                type="button"
              >
                {locale === "zh-CN" ? "关闭" : "Close"}
              </button>
            </div>

            <div className="flex max-h-[calc(82vh-148px)] flex-col gap-5 overflow-y-auto px-5 py-5">
              <NativeFilterSelect
                label={locale === "zh-CN" ? "类型" : "Type"}
                onChange={(nextValue) => setDraftKind(nextValue as SkillFilterKind)}
                options={[
                  { value: "all", label: copy.skills.allSkills },
                  { value: "official", label: copy.skills.officialOnly },
                  { value: "community", label: copy.skills.communityOnly },
                ]}
                value={draftKind}
              />

              <NativeFilterSelect
                label={locale === "zh-CN" ? "发布方" : "Publisher"}
                leading={
                  draftPublisher === "all" ? null : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-strong)] px-3 py-2 text-xs font-medium text-[var(--ink-muted)]">
                      <PublisherBadge label={currentDraftPublisherName} slug={draftPublisher} size="sm" />
                      {currentDraftPublisherName}
                    </span>
                  )
                }
                onChange={(nextValue) => setDraftPublisher(nextValue)}
                options={[
                  {
                    value: "all",
                    label: copy.common.allPublishers,
                  },
                  ...publishers.map((item) => ({
                    value: item.slug,
                    label: `${item.name} (${item.count})`,
                  })),
                ]}
                value={draftPublisher}
              />

              <NativeFilterSelect
                label={locale === "zh-CN" ? "角色" : "Role"}
                onChange={(nextValue) => setDraftPersona(nextValue)}
                options={personaOptions}
                value={draftPersona}
              />

              <NativeFilterSelect
                label={locale === "zh-CN" ? "任务" : "Task"}
                onChange={(nextValue) => setDraftJob(nextValue)}
                options={jobOptions}
                value={draftJob}
              />

              <NativeFilterSelect
                label={locale === "zh-CN" ? "来源质量" : "Source quality"}
                onChange={(nextValue) => setDraftTrustFilter(nextValue as SkillTrustFilter)}
                options={[
                  { value: "all", label: copy.skills.trustAll },
                  { value: "official", label: copy.skillFilters.trust.official },
                  { value: "curated", label: copy.skillFilters.trust.curated },
                  { value: "untrusted", label: copy.skillFilters.trust.untrusted },
                ]}
                value={draftTrustFilter}
              />

              <label className="flex items-center justify-between rounded-[1.2rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-3">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {copy.skills.enterpriseOnly}
                </span>
                <input
                  checked={draftEnterpriseOnly}
                  className="h-4 w-4 accent-[var(--accent)]"
                  onChange={(event) => setDraftEnterpriseOnly(event.target.checked)}
                  type="checkbox"
                />
              </label>

              <label className="flex items-center justify-between rounded-[1.2rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-3">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {copy.skills.excludeMarketplace}
                </span>
                <input
                  checked={draftExcludeMarketplace}
                  className="h-4 w-4 accent-[var(--accent)]"
                  onChange={(event) => setDraftExcludeMarketplace(event.target.checked)}
                  type="checkbox"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 border-t border-[var(--border-soft)] bg-[var(--surface)] px-5 py-4">
              <button
                className="action-secondary h-12 flex-1 rounded-full border px-4 text-sm font-semibold transition"
                onClick={() => {
                  setDraftKind("all");
                  setDraftPublisher("all");
                  setDraftTrustFilter("all");
                  setDraftEnterpriseOnly(false);
                  setDraftExcludeMarketplace(false);
                  setDraftPersona("all");
                  setDraftJob("all");
                }}
                type="button"
              >
                {locale === "zh-CN" ? "重置" : "Reset"}
              </button>
              <button
                className="action-primary h-12 flex-1 rounded-full border px-4 text-sm font-semibold transition"
                onClick={applyMobileFilters}
                type="button"
              >
                {locale === "zh-CN" ? "应用筛选" : "Apply filters"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showBackToSearch ? (
        <button
          aria-label={locale === "zh-CN" ? "回到搜索" : "Back to search"}
          className="action-primary fixed bottom-5 right-5 z-[55] inline-flex h-12 w-12 items-center justify-center rounded-full border transition sm:bottom-6 sm:right-6"
          data-testid="back-to-search-button"
          onClick={() => {
            searchBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          type="button"
        >
          <span aria-hidden="true" className="text-[22px] leading-none">↑</span>
        </button>
      ) : null}
    </div>
  );
}
