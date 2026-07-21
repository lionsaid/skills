import jobAliasesData from "@/../config/job-aliases.json";
import roleDefinitionsData from "@/../config/role-definitions.json";
import publisherRulesData from "@/../config/publisher-rules.json";
import type {
  RoleDefinition,
  SkillCatalogFilterState,
  SkillFilterKind,
  SkillSort,
  SkillTrustFilter,
} from "@/lib/skill-types";

export type { SkillCatalogFilterState, SkillFilterKind, SkillSort, SkillTrustFilter };

export type ParsedSearchQuery = {
  normalized: string;
  compact: string;
  tokens: string[];
  shouldCompactMatch: boolean;
};

const roleDefinitions = roleDefinitionsData as RoleDefinition[];

export function canFallbackToPublisherInitials(slug: string) {
  const publisherRules = publisherRulesData as {
    logoPriorityPublishers: string[];
    fallbackInitialsAllowedPublisherSlugs: string[];
  };
  return (publisherRules.fallbackInitialsAllowedPublisherSlugs ?? []).includes(slug);
}

export function isPriorityPublisher(slug: string) {
  return [
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
  ].includes(slug);
}

export function getRoles() {
  return roleDefinitions;
}

export function getSourceTypeLabel(
  sourceType: "curated-readme" | "github-readme" | "official-site" | "marketplace" | "github-discovery",
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
  trustLevel: "official" | "curated" | "untrusted",
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

export function expandQueryAliases(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const jobAliases = jobAliasesData as Record<string, string[]>;
  const matchedJobs = Object.entries(jobAliases)
    .filter(([, aliases]) =>
      aliases.some(
        (alias) =>
          alias.toLowerCase().includes(normalized) || normalized.includes(alias.toLowerCase()),
      ),
    )
    .map(([job]) => job);

  return [...new Set(matchedJobs)].sort();
}

export function normalizeSearchInput(value: string) {
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

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const normalized = query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return { normalized: "", compact: "", tokens: [], shouldCompactMatch: false };
  }

  const rawTokens = normalized
    .split(/[\s/|,_-]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const compact = normalized.replace(/\s+/g, "");
  const singleCharOnly = rawTokens.every((token) => token.length === 1);

  const tokens = Array.from(
    new Set(
      rawTokens.filter((token) => {
        if (/[\u4e00-\u9fff]/.test(token)) {
          return token.length >= 1;
        }

        if (singleCharOnly) {
          return false;
        }

        return token.length >= 2;
      }),
    ),
  );

  return {
    normalized,
    compact,
    tokens,
    shouldCompactMatch: !singleCharOnly && compact.length >= 3,
  };
}

export function matchesSearchQuery(
  fields: string[],
  parsedQuery: ParsedSearchQuery,
  expandedAliases: string[] = [],
) {
  if (!parsedQuery.normalized) {
    return true;
  }

  const haystacks = fields
    .map((field) => field.toLowerCase())
    .filter(Boolean);

  if (haystacks.some((field) => field.includes(parsedQuery.normalized))) {
    return true;
  }

  if (
    parsedQuery.shouldCompactMatch &&
    parsedQuery.compact &&
    parsedQuery.compact !== parsedQuery.normalized &&
    haystacks.some((field) => field.replace(/\s+/g, "").includes(parsedQuery.compact))
  ) {
    return true;
  }

  if (parsedQuery.tokens.length > 0) {
    const tokenMatched = parsedQuery.tokens.every((token) =>
      haystacks.some((field) => field.includes(token)),
    );

    if (tokenMatched) {
      return true;
    }
  }

  return expandedAliases.length > 0;
}
