import skillsData from "@/data/skills.generated.json";
import repoStatsData from "@/data/repo-stats.generated.json";
import jobAliasesData from "@/../config/job-aliases.json";
import publisherRulesData from "@/../config/publisher-rules.json";
import roleDefinitionsData from "@/../config/role-definitions.json";

export type Skill = {
  slug: string;
  name: string;
  url: string;
  description: string;
  repository?: string;
  publisher: string;
  publisherSlug: string;
  sectionTitle: string;
  sectionSlug: string;
  kind: "official" | "community";
  tags: string[];
  personas: string[];
  jobs: string[];
  sourceId: string;
  sourceIds: string[];
  sourceType: "curated-readme" | "github-readme" | "official-site" | "marketplace" | "github-discovery";
  trustLevel: "official" | "curated" | "untrusted";
  riskFlags: string[];
  creatorAvatarUrl?: string;
  creatorHandle?: string;
  hasPublisherLogo?: boolean;
};

export type SkillCatalogItem = Pick<
  Skill,
  | "slug"
  | "name"
  | "description"
  | "publisher"
  | "publisherSlug"
  | "sectionTitle"
  | "kind"
  | "tags"
  | "personas"
  | "jobs"
  | "sourceType"
  | "trustLevel"
  | "riskFlags"
  | "creatorAvatarUrl"
  | "creatorHandle"
  | "hasPublisherLogo"
> & {
  stars?: number | null;
  forks?: number | null;
};

type RepoStatsPayload = {
  generatedAt: string;
  statsBySlug: Record<string, { stars?: number | null; forks?: number | null }>;
};

export type RoleDefinition = {
  slug: string;
  label: string;
  summary: string;
  hero: string;
  starterSkillSlugs: string[];
  jobs: string[];
  featuredQueries: string[];
};

export type PublisherSummary = {
  name: string;
  slug: string;
  count: number;
  kind: "official" | "community";
  hasLogo?: boolean;
};

export type RelatedSkill = {
  skill: Skill;
  reason: string;
};

export type SkillSort = "featured" | "name" | "publisher";
export type SkillFilterKind = Skill["kind"] | "all";
export type SkillTrustFilter = Skill["trustLevel"] | "all";

export type SkillCatalogFilterState = {
  query: string;
  kind: SkillFilterKind;
  publisher: string;
  sort: SkillSort;
  trustFilter: SkillTrustFilter;
  enterpriseOnly: boolean;
  excludeMarketplace: boolean;
  persona: string;
  job: string;
};

type SkillsPayload = {
  generatedAt: string;
  totalSkills: number;
  skills: Skill[];
};

const payload = skillsData as SkillsPayload;
const repoStatsPayload = repoStatsData as RepoStatsPayload;
const allSkills = payload.skills;
const repoStatsBySlug = repoStatsPayload?.statsBySlug ?? {};
const hiddenRecommendationTags = new Set(["namespaced", "publisher-namespaced"]);
const preferredPublisherOrder = [
  "anthropics",
  "openai",
  "google-gemini",
  "google-labs-code",
  "googleworkspace",
  "microsoft",
  "cloudflare",
  "stripe",
  "vercel-labs",
  "supabase",
  "nvidia",
  "netlify",
  "firebase",
  "hashicorp",
  "coinbase",
  "brave",
  "expo",
  "flutter",
];
const preferredPublisherRank = new Map(
  preferredPublisherOrder.map((slug, index) => [slug, index]),
);
const roleDefinitions = roleDefinitionsData as RoleDefinition[];
const jobAliases = jobAliasesData as Record<string, string[]>;
const publisherRules = publisherRulesData as {
  logoPriorityPublishers: string[];
  fallbackInitialsAllowedPublisherSlugs: string[];
};
const logoPriorityPublisherSet = new Set(publisherRules.logoPriorityPublishers ?? []);
const fallbackInitialsAllowedPublisherSet = new Set(
  publisherRules.fallbackInitialsAllowedPublisherSlugs ?? [],
);
const curatedFeaturedSkillSlugs = [
  "googleworkspace-gws-sheets",
  "duckdb-query",
  "cloudflare-wrangler",
  "microsoft-copilot-sdk",
  "supabase-postgres-best-practices",
  "firecrawl-firecrawl-build",
  "vercel-labs-next-best-practices",
  "anthropics-doc-coauthoring",
];

function getPublisherPriority(publisher: PublisherSummary) {
  const preferredRank = preferredPublisherRank.get(publisher.slug);

  if (preferredRank !== undefined) {
    return 10_000 - preferredRank;
  }

  if (publisher.kind === "official") {
    return 5_000;
  }

  if (publisher.count >= 8) {
    return 1_000;
  }

  return 0;
}

function getRecommendationTags(skill: Skill) {
  return skill.tags.filter(
    (tag) =>
      tag !== skill.publisherSlug &&
      tag !== skill.sectionSlug &&
      !hiddenRecommendationTags.has(tag),
  );
}

function formatRelatedReason(
  target: Skill,
  skill: Skill,
  sharedTags: string[],
  locale: "en" | "zh-CN" = "en",
) {
  const reasons: string[] = [];

  if (skill.publisherSlug === target.publisherSlug) {
    reasons.push(locale === "zh-CN" ? "同一发布方" : "same publisher");
  }

  if (skill.sectionSlug === target.sectionSlug) {
    reasons.push(locale === "zh-CN" ? "同一分类" : "same section");
  }

  if (sharedTags.length > 0) {
    reasons.push(
      locale === "zh-CN"
        ? `相同标签：${sharedTags.join("、")}`
        : `shared tags: ${sharedTags.join(", ")}`,
    );
  }

  return locale === "zh-CN" ? reasons.join("；") : reasons.join("; ");
}

function toSkillCatalogItem(skill: Skill): SkillCatalogItem {
  const repoStats = repoStatsBySlug[skill.slug] ?? {};

  return {
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    publisher: skill.publisher,
    publisherSlug: skill.publisherSlug,
    sectionTitle: skill.sectionTitle,
    kind: skill.kind,
    tags: skill.tags,
    personas: skill.personas,
    jobs: skill.jobs,
    sourceType: skill.sourceType,
    trustLevel: skill.trustLevel,
    riskFlags: skill.riskFlags,
    creatorAvatarUrl: skill.creatorAvatarUrl,
    creatorHandle: skill.creatorHandle,
    hasPublisherLogo: skill.hasPublisherLogo,
    stars: typeof repoStats.stars === "number" ? repoStats.stars : null,
    forks: typeof repoStats.forks === "number" ? repoStats.forks : null,
  };
}

export function getAllSkills() {
  return allSkills;
}

export function getCatalogSkillsPage(offset = 0, limit = 36): SkillCatalogItem[] {
  return allSkills.slice(offset, offset + limit).map(toSkillCatalogItem);
}

export function isPriorityPublisher(slug: string) {
  return preferredPublisherRank.has(slug);
}

export function isLogoPriorityPublisher(slug: string) {
  return logoPriorityPublisherSet.has(slug);
}

export function canFallbackToPublisherInitials(slug: string) {
  return fallbackInitialsAllowedPublisherSet.has(slug);
}

export function getSourceTypeLabel(
  sourceType: Skill["sourceType"],
  locale: "en" | "zh-CN" = "en",
) {
  switch (sourceType) {
    case "curated-readme":
      return locale === "zh-CN" ? "已整理说明" : "Reviewed guide";
    case "github-readme":
      return locale === "zh-CN" ? "GitHub 说明" : "GitHub guide";
    case "official-site":
      return locale === "zh-CN" ? "官方网站" : "Official site";
    case "marketplace":
      return locale === "zh-CN" ? "应用市场" : "Marketplace";
    case "github-discovery":
      return locale === "zh-CN" ? "GitHub 发现" : "Found on GitHub";
    default:
      return sourceType;
  }
}

export function getTrustLevelLabel(
  trustLevel: Skill["trustLevel"],
  locale: "en" | "zh-CN" = "en",
) {
  switch (trustLevel) {
    case "official":
      return locale === "zh-CN" ? "官方出品" : "Official team";
    case "curated":
      return locale === "zh-CN" ? "人工整理" : "Reviewed source";
    case "untrusted":
      return locale === "zh-CN" ? "需自行判断" : "Use with care";
    default:
      return trustLevel;
  }
}

export function getGeneratedAt() {
  return payload.generatedAt;
}

export function getRoles() {
  return roleDefinitions;
}

export function getRoleBySlug(slug: string) {
  return roleDefinitions.find((role) => role.slug === slug);
}

export function getSkillsByPersona(persona: string) {
  return allSkills.filter((skill) => skill.personas.includes(persona));
}

export function getSkillsByJob(job: string) {
  return allSkills.filter((skill) => skill.jobs.includes(job));
}

function scoreRoleSkill(role: RoleDefinition, skill: Skill) {
  let score = 0;
  const isStarter = role.starterSkillSlugs.includes(skill.slug);
  const personaCount = skill.personas.length;
  const jobCount = skill.jobs.length;
  const jobMatches = skill.jobs.filter((job) => role.jobs.includes(job)).length;
  const hasPersonaMatch = skill.personas.includes(role.slug);
  const haystack = [
    skill.slug,
    skill.name,
    skill.description,
    skill.publisher,
    ...skill.tags,
  ]
    .join(" ")
    .toLowerCase();

  if (isStarter) {
    score += 1000;
  }

  if (hasPersonaMatch) {
    score += 320;
  }

  score += jobMatches * 40;

  if (jobMatches >= 2) {
    score += 30;
  }

  if (hasPersonaMatch && jobMatches > 0) {
    score += 60;
  }

  const queryMatches = role.featuredQueries.filter((query) => {
    const normalized = query.toLowerCase();
    return (
      skill.name.toLowerCase().includes(normalized) ||
      skill.description.toLowerCase().includes(normalized) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  }).length;
  score += queryMatches * 30;

  if (role.slug === "founder") {
    if (queryMatches >= 1) {
      score += 80;
    }

    if (
      skill.slug.includes("strategy") ||
      skill.slug.includes("launch") ||
      skill.slug.includes("pricing") ||
      skill.slug.includes("market-research") ||
      skill.slug.includes("gtm")
    ) {
      score += 120;
    }
  }

  if (role.slug === "sales") {
    if (queryMatches >= 1) {
      score += 70;
    }

    if (
      skill.slug.includes("battlecard") ||
      skill.slug.includes("value-prop") ||
      skill.slug.includes("sales-enablement") ||
      skill.slug.includes("email-sequence") ||
      skill.slug.includes("cold-email")
    ) {
      score += 120;
    }
  }

  if (role.slug === "support") {
    if (queryMatches >= 1) {
      score += 60;
    }

    if (
      skill.slug.includes("gmail") ||
      skill.slug.includes("outlook") ||
      skill.slug.includes("contact-discovery") ||
      skill.slug.includes("maintainer-triage") ||
      skill.slug.includes("guardian")
    ) {
      score += 100;
    }
  }

  if (role.slug === "designer") {
    if (
      skill.slug.includes("figma") ||
      skill.slug.includes("ui") ||
      skill.slug.includes("storyboard")
    ) {
      score += 90;
    }
  }

  if (role.slug === "pm") {
    if (
      skill.slug.includes("prd") ||
      skill.slug.includes("roadmap") ||
      skill.slug.includes("opportunity-solution-tree") ||
      skill.slug.includes("product-strategy")
    ) {
      score += 90;
    }
  }

  if (role.slug === "data-analyst") {
    const strongAnalysisTokens = [
      "duckdb",
      "clickhouse",
      "postgres",
      "sql",
      "query",
      "analytics",
      "dashboard",
      "bigquery",
      "sheets",
      "csv",
      "warehouse",
      "table",
    ];
    const weakGenericDocumentTokens = [
      "pdf",
      "docx",
      "pptx",
      "slides",
      "presentation",
      "coauthor",
      "document",
    ];

    const strongTokenMatches = strongAnalysisTokens.filter((token) =>
      haystack.includes(token),
    ).length;
    const weakTokenMatches = weakGenericDocumentTokens.filter((token) =>
      haystack.includes(token),
    ).length;

    score += strongTokenMatches * 55;

    if (skill.slug.includes("duckdb") || skill.slug.includes("clickhouse")) {
      score += 140;
    }

    if (
      skill.slug.includes("postgres") ||
      skill.slug.includes("bigquery") ||
      skill.slug.includes("analytics")
    ) {
      score += 100;
    }

    if (
      skill.slug === "googleworkspace-gws-sheets" ||
      skill.slug.includes("google-sheets") ||
      skill.slug.includes("feishu-sheets")
    ) {
      score += 90;
    }

    if (skill.trustLevel === "official") {
      score += 60;
    } else if (skill.trustLevel === "curated") {
      score += 20;
    } else {
      score -= 120;
    }

    if (skill.slug === "anthropics-xlsx") {
      score -= 220;
    }

    if (
      skill.slug === "anthropics-pdf" ||
      skill.slug === "anthropics-docx" ||
      skill.slug === "anthropics-pptx" ||
      skill.slug === "anthropics-doc-coauthoring"
    ) {
      score -= 420;
    }

    if (!isStarter) {
      score -= weakTokenMatches * 45;
    }
  }

  if (!isStarter) {
    score -= Math.max(0, personaCount - 2) * 45;
    score -= Math.max(0, jobCount - 3) * 12;
  }

  return score;
}

function getRoleSkillSignals(role: RoleDefinition, skill: Skill) {
  const isStarter = role.starterSkillSlugs.includes(skill.slug);
  const hasPersonaMatch = skill.personas.includes(role.slug);
  const jobMatches = skill.jobs.filter((job) => role.jobs.includes(job)).length;
  const queryMatches = role.featuredQueries.filter((query) => {
    const normalized = query.toLowerCase();
    return (
      skill.name.toLowerCase().includes(normalized) ||
      skill.description.toLowerCase().includes(normalized) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  }).length;

  return {
    isStarter,
    hasPersonaMatch,
    jobMatches,
    queryMatches,
    personaCount: skill.personas.length,
    jobCount: skill.jobs.length,
  };
}

function isGenericRoleSkill(skill: Skill) {
  const genericRoleSkillSlugs = new Set([
    "anthropics-pdf",
    "anthropics-docx",
    "anthropics-xlsx",
    "anthropics-pptx",
    "anthropics-doc-coauthoring",
    "anthropics-internal-comms",
  ]);

  return genericRoleSkillSlugs.has(skill.slug);
}

function isRolePriorityCandidate(role: RoleDefinition, skill: Skill) {
  const dataAnalystBlockedTags = [
    "docker",
    "terraform",
    "wrangler",
    "workers",
    "kubernetes",
    "gpu",
    "cuda",
    "ci",
    "sdk",
    "deploy",
    "deployment",
    "frontend",
    "design critique",
    "brand",
    "slides",
    "presentation",
    "docx",
    "pptx",
  ];
  const salesBlockedTags = [
    "docker",
    "terraform",
    "wrangler",
    "workers",
    "tensorrt",
    "container",
    "kubernetes",
    "ci",
    "sdk",
    "slurm",
    "megatron",
    "deepstream",
    "vision model",
    "model support",
    "import model",
    "gpu",
    "cuda",
  ];

  const supportBlockedTags = [
    "docker",
    "terraform",
    "wrangler",
    "workers",
    "tensorrt",
    "kubernetes",
    "sdk",
    "slurm",
    "megatron",
    "deepstream",
    "vision model",
    "gpu",
    "cuda",
    "model support",
    "stock",
    "trading",
    "crypto",
    "finance",
    "investment",
  ];
  const pmBlockedTags = ["docker", "terraform", "wrangler", "workers", "sdk", "kubernetes", "tensorrt", "slurm", "megatron", "deepstream", "cuda", "gpu"];
  const designerBlockedTags = ["docker", "terraform", "wrangler", "workers", "sdk", "kubernetes", "ci", "slurm", "megatron", "deepstream", "cuda", "gpu"];
  const founderBlockedTags = [
    "tensorrt",
    "kubernetes",
    "slurm",
    "megatron",
    "deepstream",
    "cuda",
    "gpu",
    "model support",
    "vision model",
    "trading",
    "stock",
    "crypto",
    "investment",
    "optimizer",
    "evaluation",
    "perf-host",
  ];

  const haystack = [
    skill.slug,
    skill.name,
    skill.description,
    skill.publisher,
    ...skill.tags,
  ]
    .join(" ")
    .toLowerCase();

  if (role.slug === "sales") {
    const salesAllowedTokens = [
      "sales",
      "proposal",
      "deck",
      "pitch",
      "email",
      "gmail",
      "slides",
      "docs",
      "docx",
      "ppt",
      "pricing",
      "follow-up",
      "enablement",
      "crm",
    ];

    if (salesBlockedTags.some((token) => haystack.includes(token))) {
      return false;
    }

    if (
      !skill.personas.includes("sales") &&
      !salesAllowedTokens.some((token) => haystack.includes(token))
    ) {
      return false;
    }
  }

  if (role.slug === "data-analyst") {
    const dataAnalystAllowedTokens = [
      "data",
      "sql",
      "query",
      "analytics",
      "dashboard",
      "spreadsheet",
      "sheets",
      "csv",
      "duckdb",
      "clickhouse",
      "postgres",
      "bigquery",
      "table",
      "report",
      "extract",
    ];

    if (
      dataAnalystBlockedTags.some((token) => haystack.includes(token)) &&
      !skill.personas.includes("data-analyst")
    ) {
      return false;
    }

    if (
      !skill.personas.includes("data-analyst") &&
      !dataAnalystAllowedTokens.some((token) => haystack.includes(token))
    ) {
      return false;
    }

    if (
      skill.slug === "anthropics-pdf" ||
      skill.slug === "anthropics-docx" ||
      skill.slug === "anthropics-pptx" ||
      skill.slug === "anthropics-doc-coauthoring"
    ) {
      return false;
    }
  }

  if (role.slug === "support") {
    const supportAllowedTokens = [
      "support",
      "response",
      "help",
      "ticket",
      "docs",
      "docx",
      "pdf",
      "gmail",
      "drive",
      "extract",
      "interact",
      "knowledge",
      "outlook",
      "email",
      "contact",
      "triage",
    ];

    if (supportBlockedTags.some((token) => haystack.includes(token))) {
      return false;
    }

    if (
      !skill.personas.includes("support") &&
      !supportAllowedTokens.some((token) => haystack.includes(token))
    ) {
      return false;
    }

    if (
      !skill.personas.includes("support") &&
      !skill.slug.includes("gmail") &&
      !skill.slug.includes("drive") &&
      !skill.slug.includes("outlook") &&
      !skill.slug.includes("contact-discovery") &&
      !skill.slug.includes("interact") &&
      !skill.slug.includes("pdf") &&
      !skill.slug.includes("docx")
    ) {
      return false;
    }
  }

  if (role.slug === "pm") {
    const pmAllowedTokens = [
      "product",
      "prd",
      "spec",
      "roadmap",
      "planning",
      "research",
      "brief",
      "docs",
      "issue",
      "stakeholder",
    ];

    if (pmBlockedTags.some((token) => haystack.includes(token)) && !skill.personas.includes("pm")) {
      return false;
    }

    if (!skill.personas.includes("pm") && !pmAllowedTokens.some((token) => haystack.includes(token))) {
      return false;
    }
  }

  if (role.slug === "designer") {
    const designerAllowedTokens = [
      "design",
      "ui",
      "ux",
      "prototype",
      "figma",
      "visual",
      "theme",
      "brand",
      "storyboard",
      "slides",
    ];

    if (designerBlockedTags.some((token) => haystack.includes(token)) && !skill.personas.includes("designer")) {
      return false;
    }

    if (!skill.personas.includes("designer") && !designerAllowedTokens.some((token) => haystack.includes(token))) {
      return false;
    }
  }

  if (role.slug === "founder") {
    const founderAllowedTokens = [
      "launch",
      "strategy",
      "pricing",
      "pitch",
      "landing",
      "research",
      "planning",
      "roadmap",
      "market",
      "docs",
      "slides",
      "proposal",
      "docs",
      "email",
      "gtm",
      "market research",
    ];

    if (founderBlockedTags.some((token) => haystack.includes(token)) && !skill.personas.includes("founder")) {
      return false;
    }

    if (!skill.personas.includes("founder") && !founderAllowedTokens.some((token) => haystack.includes(token))) {
      return false;
    }

    if (
      !skill.personas.includes("founder") &&
      !skill.slug.includes("launch") &&
      !skill.slug.includes("strategy") &&
      !skill.slug.includes("pricing") &&
      !skill.slug.includes("market-research") &&
      !skill.slug.includes("gtm") &&
      !skill.slug.includes("docs") &&
      !skill.slug.includes("build")
    ) {
      return false;
    }
  }

  return true;
}

export function getSkillsForRole(slug: string) {
  const role = getRoleBySlug(slug);
  if (!role) {
    return [];
  }

  return [...allSkills]
    .map((skill) => ({ skill, score: scoreRoleSkill(role, skill) }))
    .filter(({ score }) => score > 0)
    .filter(({ skill }) => isRolePriorityCandidate(role, skill))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const publisherOrder = a.skill.publisher.localeCompare(b.skill.publisher);
      return publisherOrder === 0 ? a.skill.name.localeCompare(b.skill.name) : publisherOrder;
    })
    .map(({ skill }) => skill);
}

export function getRolePrioritySkills(slug: string, limit = 10) {
  const role = getRoleBySlug(slug);
  if (!role) {
    return [];
  }

  const ranked = [...allSkills]
    .map((skill) => {
      const signals = getRoleSkillSignals(role, skill);
      return {
        skill,
        score: scoreRoleSkill(role, skill),
        ...signals,
      };
    })
    .filter(({ score, isStarter, hasPersonaMatch, jobMatches, queryMatches }) => {
      if (score <= 0) {
        return false;
      }

      if (isStarter) {
        return true;
      }

      if (hasPersonaMatch) {
        return true;
      }

      if (jobMatches >= 2) {
        return true;
      }

      return jobMatches >= 1 && queryMatches >= 1;
    })
    .filter(({ skill }) => isRolePriorityCandidate(role, skill))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (Number(b.isStarter) !== Number(a.isStarter)) {
        return Number(b.isStarter) - Number(a.isStarter);
      }

      if (Number(b.hasPersonaMatch) !== Number(a.hasPersonaMatch)) {
        return Number(b.hasPersonaMatch) - Number(a.hasPersonaMatch);
      }

      if (b.jobMatches !== a.jobMatches) {
        return b.jobMatches - a.jobMatches;
      }

      const publisherOrder = a.skill.publisher.localeCompare(b.skill.publisher);
      return publisherOrder === 0 ? a.skill.name.localeCompare(b.skill.name) : publisherOrder;
    });

  const selected: Skill[] = [];
  const genericLimit = role.slug === "founder" ? 2 : 3;
  let genericCount = 0;
  const publisherCounts = new Map<string, number>();

  for (const item of ranked) {
    if (selected.length >= limit) {
      break;
    }

    const isGeneric = isGenericRoleSkill(item.skill);
    if (isGeneric && genericCount >= genericLimit) {
      continue;
    }

    const publisherCount = publisherCounts.get(item.skill.publisherSlug) ?? 0;
    const tooManyFromPublisher =
      !item.isStarter &&
      publisherCount >= 3 &&
      item.hasPersonaMatch === false &&
      item.jobMatches < 2;

    if (tooManyFromPublisher) {
      continue;
    }

    if (
      role.slug === "founder" &&
      !item.isStarter &&
      item.hasPersonaMatch &&
      item.skill.publisherSlug === "nvidia"
    ) {
      continue;
    }

    if (
      role.slug === "support" &&
      !item.isStarter &&
      item.hasPersonaMatch &&
      item.skill.publisherSlug === "nvidia"
    ) {
      continue;
    }

    selected.push(item.skill);
    publisherCounts.set(item.skill.publisherSlug, publisherCount + 1);

    if (isGeneric) {
      genericCount += 1;
    }
  }

  return selected;
}

export function getStarterSkillsForRole(slug: string) {
  const role = getRoleBySlug(slug);
  if (!role) {
    return [];
  }

  const starters = role.starterSkillSlugs
    .map((starterSlug) => getSkillBySlug(starterSlug))
    .filter((skill): skill is Skill => Boolean(skill));

  return starters;
}

export function expandQueryAliases(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const matchedJobs = Object.entries(jobAliases)
    .filter(([, aliases]) => aliases.some((alias) => alias.toLowerCase().includes(normalized) || normalized.includes(alias.toLowerCase())))
    .map(([job]) => job);

  return [...new Set(matchedJobs)].sort();
}

export function filterSkills(skills: Skill[], filters: SkillCatalogFilterState) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const expandedJobs = expandQueryAliases(normalizedQuery);

  const subset = skills.filter((skill) => {
    const matchesQuery =
      !normalizedQuery ||
      skill.name.toLowerCase().includes(normalizedQuery) ||
      skill.description.toLowerCase().includes(normalizedQuery) ||
      skill.publisher.toLowerCase().includes(normalizedQuery) ||
      skill.tags.some((tag) => tag.includes(normalizedQuery)) ||
      skill.personas.some((value) => value.includes(normalizedQuery)) ||
      skill.jobs.some((value) => value.includes(normalizedQuery)) ||
      expandedJobs.some((matchedJob) => skill.jobs.includes(matchedJob));

    const matchesPublisher =
      filters.publisher === "all" || skill.publisherSlug === filters.publisher;

    const matchesKind = filters.kind === "all" || skill.kind === filters.kind;
    const matchesTrust =
      filters.trustFilter === "all" || skill.trustLevel === filters.trustFilter;
    const matchesEnterprise =
      !filters.enterpriseOnly || isPriorityPublisher(skill.publisherSlug);
    const matchesMarketplace =
      !filters.excludeMarketplace || skill.sourceType !== "marketplace";
    const matchesPersona =
      filters.persona === "all" || skill.personas.includes(filters.persona);
    const matchesJob = filters.job === "all" || skill.jobs.includes(filters.job);

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

  const sorted = [...subset];

  if (filters.sort === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (filters.sort === "publisher") {
    sorted.sort((a, b) => {
      const publisherOrder = a.publisher.localeCompare(b.publisher);
      return publisherOrder === 0 ? a.name.localeCompare(b.name) : publisherOrder;
    });
  }

  return sorted;
}

export function getFeaturedSkills() {
  const selected: Skill[] = [];
  const seenSkillSlugs = new Set<string>();
  const publisherCounts = new Map<string, number>();

  const pushSkill = (skill: Skill | undefined) => {
    if (!skill || seenSkillSlugs.has(skill.slug)) {
      return;
    }

    const publisherCount = publisherCounts.get(skill.publisherSlug) ?? 0;
    if (publisherCount >= 1 && selected.length < 8) {
      return;
    }

    selected.push(skill);
    seenSkillSlugs.add(skill.slug);
    publisherCounts.set(skill.publisherSlug, publisherCount + 1);
  };

  for (const slug of curatedFeaturedSkillSlugs) {
    pushSkill(getSkillBySlug(slug));
  }

  const fallbackPool = [...allSkills].sort((a, b) => {
    const publisherRankA = preferredPublisherRank.get(a.publisherSlug) ?? 999;
    const publisherRankB = preferredPublisherRank.get(b.publisherSlug) ?? 999;

    if (publisherRankA !== publisherRankB) {
      return publisherRankA - publisherRankB;
    }

    if (a.kind !== b.kind) {
      return a.kind === "official" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });

  for (const skill of fallbackPool) {
    if (selected.length >= 8) {
      break;
    }

    pushSkill(skill);
  }

  if (selected.length < 8) {
    for (const skill of fallbackPool) {
      if (selected.length >= 8) {
        break;
      }

      if (!seenSkillSlugs.has(skill.slug)) {
        selected.push(skill);
        seenSkillSlugs.add(skill.slug);
      }
    }
  }

  return selected;
}

export function getSkillBySlug(slug: string) {
  return allSkills.find((skill) => skill.slug === slug);
}

export function getRelatedSkills(
  slug: string,
  limit = 6,
  locale: "en" | "zh-CN" = "en",
): RelatedSkill[] {
  const target = getSkillBySlug(slug);

  if (!target) {
    return [];
  }

  const targetTags = new Set(getRecommendationTags(target));

  return allSkills
    .filter((skill) => skill.slug !== target.slug)
    .map((skill) => {
      let score = 0;
      const sharedTags = getRecommendationTags(skill).filter((tag) =>
        targetTags.has(tag),
      );

      if (skill.publisherSlug === target.publisherSlug) {
        score += 5;
      }

      if (skill.sectionSlug === target.sectionSlug) {
        score += 2;
      }

      score += sharedTags.length;

      return {
        skill,
        reason: formatRelatedReason(target, skill, sharedTags, locale),
        score,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.skill.name.localeCompare(b.skill.name);
    })
    .slice(0, limit)
    .map(({ skill, reason }) => ({ skill, reason }));
}

export function getPublishers(): PublisherSummary[] {
  const map = new Map<string, PublisherSummary>();

  for (const skill of allSkills) {
    const existing = map.get(skill.publisherSlug);
    if (existing) {
      existing.count += 1;
      if (skill.kind === "official") {
        existing.kind = "official";
      }
      existing.hasLogo = existing.hasLogo || Boolean(skill.hasPublisherLogo);
      continue;
    }

    map.set(skill.publisherSlug, {
      name: skill.publisher,
      slug: skill.publisherSlug,
      count: 1,
      kind: skill.kind,
      hasLogo: Boolean(skill.hasPublisherLogo),
    });
  }

  return [...map.values()].sort((a, b) => {
    const priorityDiff = getPublisherPriority(b) - getPublisherPriority(a);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    if (b.count !== a.count) {
      return b.count - a.count;
    }

    return a.name.localeCompare(b.name);
  });
}

export function getPublisherBySlug(slug: string) {
  return getPublishers().find((publisher) => publisher.slug === slug);
}

export function getSkillsByPublisher(slug: string) {
  return allSkills.filter((skill) => skill.publisherSlug === slug);
}

export function getStats() {
  const publishers = getPublishers();
  const officialCount = allSkills.filter((skill) => skill.kind === "official").length;
  const communityCount = allSkills.length - officialCount;

  return {
    totalSkills: allSkills.length,
    totalPublishers: publishers.length,
    officialCount,
    communityCount,
  };
}
