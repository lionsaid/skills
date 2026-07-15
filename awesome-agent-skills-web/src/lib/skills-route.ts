import { getRoles, type PublisherSummary, type SkillFilterKind, type SkillSort, type SkillTrustFilter } from "@/lib/skills";
import { normalizeSearchInput } from "@/lib/skills-common";

export type SkillsRouteSearchParams =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | {
      get(name: string): string | null;
    };

export type ParsedSkillsRouteFilters = {
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

const validSorts = new Set<SkillSort>(["featured", "name", "publisher"]);
const validKinds = new Set<SkillFilterKind>(["all", "official", "community"]);
const validTrustFilters = new Set<SkillTrustFilter>(["all", "official", "curated", "untrusted"]);
const truthyValues = new Set(["1", "true", "yes", "on"]);
const falsyValues = new Set(["0", "false", "no", "off", ""]);

function readSearchParam(input: SkillsRouteSearchParams | undefined, key: string) {
  if (!input) {
    return undefined;
  }

  if (typeof (input as URLSearchParams).get === "function") {
    return (input as URLSearchParams).get(key) ?? undefined;
  }

  const value = (input as Record<string, string | string[] | undefined>)[key];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseBooleanParam(value: string | undefined, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (truthyValues.has(normalized)) {
    return true;
  }

  if (falsyValues.has(normalized)) {
    return false;
  }

  return defaultValue;
}

function parseEnumValue<T extends string>(
  value: string | undefined,
  validValues: Set<T>,
  defaultValue: T,
): T {
  const normalized = value?.trim().toLowerCase() as T | undefined;
  if (normalized && validValues.has(normalized)) {
    return normalized;
  }

  return defaultValue;
}

export function parseSkillsRouteFilters(
  searchParams: SkillsRouteSearchParams | undefined,
  publishers: PublisherSummary[] = [],
): ParsedSkillsRouteFilters {
  const roles = getRoles();
  const publisherSlugs = new Set(publishers.map((publisher) => publisher.slug));
  const personaSlugs = new Set(roles.map((role) => role.slug));
  const jobSlugs = new Set(roles.flatMap((role) => role.jobs));

  const query = normalizeSearchInput(
    readSearchParam(searchParams, "q") ?? readSearchParam(searchParams, "query") ?? "",
  );
  const kind = parseEnumValue(readSearchParam(searchParams, "kind"), validKinds, "all");
  const publisher = parseEnumValue(
    readSearchParam(searchParams, "publisher"),
    new Set([...publisherSlugs, "all"]),
    "all",
  );
  const sort = parseEnumValue(readSearchParam(searchParams, "sort"), validSorts, "featured");
  const trustFilter = parseEnumValue(
    readSearchParam(searchParams, "trust") ?? readSearchParam(searchParams, "trustFilter"),
    validTrustFilters,
    "all",
  );
  const enterpriseOnly = parseBooleanParam(
    readSearchParam(searchParams, "enterprise") ?? readSearchParam(searchParams, "enterpriseOnly"),
  );
  const excludeMarketplace = parseBooleanParam(readSearchParam(searchParams, "excludeMarketplace"));
  const persona = parseEnumValue(
    readSearchParam(searchParams, "persona"),
    new Set([...personaSlugs, "all"]),
    "all",
  );
  const job = parseEnumValue(
    readSearchParam(searchParams, "job"),
    new Set([...jobSlugs, "all"]),
    "all",
  );

  return {
    query,
    kind,
    publisher,
    sort,
    trustFilter,
    enterpriseOnly,
    excludeMarketplace,
    persona,
    job,
  };
}
