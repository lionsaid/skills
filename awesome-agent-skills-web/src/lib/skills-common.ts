import jobAliasesData from "@/../config/job-aliases.json";
import roleDefinitionsData from "@/../config/role-definitions.json";
import publisherRulesData from "@/../config/publisher-rules.json";
import type {
  RoleDefinition,
  Skill,
  SkillCatalogFilterState,
  SkillFilterKind,
  SkillSort,
  SkillTrustFilter,
} from "@/lib/skill-types";

export type { SkillCatalogFilterState, SkillFilterKind, SkillSort, SkillTrustFilter };

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
