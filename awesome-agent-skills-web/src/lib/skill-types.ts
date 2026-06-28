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
  sourceType:
    | "curated-readme"
    | "github-readme"
    | "official-site"
    | "marketplace"
    | "github-discovery";
  trustLevel: "official" | "curated" | "untrusted";
  riskFlags: string[];
  creatorAvatarUrl?: string;
  creatorHandle?: string;
  hasPublisherLogo?: boolean;
};

export type SkillListItem = Pick<
  Skill,
  | "slug"
  | "name"
  | "description"
  | "publisher"
  | "publisherSlug"
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
>;

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

export type SkillCatalogIndexItem = Pick<
  Skill,
  | "slug"
  | "name"
  | "description"
  | "publisher"
  | "publisherSlug"
  | "kind"
  | "tags"
  | "personas"
  | "jobs"
  | "sourceType"
  | "trustLevel"
> & {
  chunkIndex: number;
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
