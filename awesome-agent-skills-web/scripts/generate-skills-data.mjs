import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const outputDir = path.join(projectRoot, "src", "data");
const outputPath = path.join(outputDir, "skills.generated.json");
const repoStatsPath = path.join(outputDir, "repo-stats.generated.json");
const publicDataDir = path.join(projectRoot, "public", "data");
const publicCatalogDir = path.join(publicDataDir, "skills-catalog");
const classificationRulesPath = path.join(projectRoot, "config", "classification-rules.json");
const skillOverridesPath = path.join(projectRoot, "config", "skill-overrides.json");
const skillSourcesPath = path.join(projectRoot, "config", "skill-sources.json");
const publisherRulesPath = path.join(projectRoot, "config", "publisher-rules.json");
const githubSkillRepoCachePath = path.join(outputDir, "github-repo-expansion.generated.json");
const githubAvatarCachePath = path.join(outputDir, "github-avatars.generated.json");

let committedGeneratedSkillsCache = null;

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readRepoStatsBySlug() {
  try {
    const payload = readJson(repoStatsPath);
    if (payload && typeof payload.statsBySlug === "object" && !Array.isArray(payload.statsBySlug)) {
      return payload.statsBySlug;
    }
  } catch {
    return {};
  }

  return {};
}

function readCommittedGeneratedSkills() {
  if (committedGeneratedSkillsCache) {
    return committedGeneratedSkillsCache;
  }

  try {
    const raw = execFileSync(
      "git",
      ["show", "HEAD~1:awesome-agent-skills-web/src/data/skills.generated.json"],
      {
        cwd: path.join(projectRoot, ".."),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 64 * 1024 * 1024,
      },
    );
    const payload = JSON.parse(raw);
    committedGeneratedSkillsCache = Array.isArray(payload?.skills) ? payload.skills : [];
  } catch {
    committedGeneratedSkillsCache = [];
  }

  return committedGeneratedSkillsCache;
}

function readFallbackSkillsForSource(sourceId) {
  return readCommittedGeneratedSkills().filter((skill) => {
    if (Array.isArray(skill?.sourceIds) && skill.sourceIds.includes(sourceId)) {
      return true;
    }

    return skill?.sourceId === sourceId;
  });
}

function readClassificationRules() {
  const rules = readJson(classificationRulesPath);

  if (!Array.isArray(rules)) {
    throw new Error("Classification rules config must be an array.");
  }

  for (const [index, rule] of rules.entries()) {
    const label = `classification rule #${index + 1}`;

    if (typeof rule.tag !== "string" || !rule.tag) {
      throw new Error(`${label} must include a non-empty tag.`);
    }

    for (const key of ["sections", "publishers", "patterns"]) {
      if (!Array.isArray(rule[key]) || rule[key].some((value) => typeof value !== "string")) {
        throw new Error(`${label} must include a ${key} string array.`);
      }
    }
  }

  return rules;
}

function readSkillSources() {
  const sources = readJson(skillSourcesPath);

  if (!Array.isArray(sources)) {
    throw new Error("Skill sources config must be an array.");
  }

  for (const [index, source] of sources.entries()) {
    const label = `skill source #${index + 1}`;

    for (const key of ["id", "label", "transport", "parser"]) {
      if (typeof source[key] !== "string" || !source[key]) {
        throw new Error(`${label} must include a non-empty ${key}.`);
      }
    }

    if (typeof source.enabled !== "boolean") {
      throw new Error(`${label} must include a boolean enabled flag.`);
    }

    if (source.transport === "local" && (typeof source.path !== "string" || !source.path)) {
      throw new Error(`${label} must include path for local transport.`);
    }

    if (source.transport === "remote" && (typeof source.url !== "string" || !source.url)) {
      throw new Error(`${label} must include url for remote transport.`);
    }

    for (const key of ["sourceType", "trustLevel", "riskFlags"]) {
      if (key === "riskFlags") {
        if (!Array.isArray(source[key]) || source[key].some((value) => typeof value !== "string")) {
          throw new Error(`${label} must include a ${key} string array.`);
        }
      } else if (typeof source[key] !== "string" || !source[key]) {
        throw new Error(`${label} must include a non-empty ${key}.`);
      }
    }

    if (source.parser === "remote-html") {
      for (const key of ["linkPattern", "sectionTitle", "kind", "descriptionFallback"]) {
        if (typeof source[key] !== "string" || !source[key]) {
          throw new Error(`${label} must include a non-empty ${key} for ${source.parser}.`);
        }
      }
    }

    if (source.parser === "marketplace-api") {
      for (const key of ["sectionTitle", "kind", "descriptionFallback"]) {
        if (typeof source[key] !== "string" || !source[key]) {
          throw new Error(`${label} must include a non-empty ${key} for marketplace-api.`);
        }
      }

      if (
        typeof source.maxPages !== "number" ||
        !Number.isInteger(source.maxPages) ||
        source.maxPages < 1
      ) {
        throw new Error(`${label} must include a positive integer maxPages.`);
      }

      if (
        typeof source.pageSize !== "number" ||
        !Number.isInteger(source.pageSize) ||
        source.pageSize < 1
      ) {
        throw new Error(`${label} must include a positive integer pageSize.`);
      }
    }

    if (source.parser === "github-repo-expansion") {
      for (const key of ["sectionTitle", "kind", "descriptionFallback"]) {
        if (typeof source[key] !== "string" || !source[key]) {
          throw new Error(`${label} must include a non-empty ${key} for github-repo-expansion.`);
        }
      }

      if (
        typeof source.maxRepositories !== "number" ||
        !Number.isInteger(source.maxRepositories) ||
        source.maxRepositories < 1
      ) {
        throw new Error(`${label} must include a positive integer maxRepositories.`);
      }
    }
  }

  return sources;
}

function readSkillOverrides() {
  const payload = readJson(skillOverridesPath);
  const slugOverrides = payload?.slugOverrides;

  if (!slugOverrides || typeof slugOverrides !== "object" || Array.isArray(slugOverrides)) {
    throw new Error("Skill overrides config must include a slugOverrides object.");
  }

  return slugOverrides;
}

const classificationRules = readClassificationRules();
const skillSources = readSkillSources();
const skillOverrides = readSkillOverrides();
const publisherRules = readJson(publisherRulesPath);
const repoStatsBySlug = readRepoStatsBySlug();
const sourcePriority = new Map(
  skillSources.map((source, index) => [source.id, skillSources.length - index]),
);
const logoAllowedKinds = new Set(publisherRules.logoAllowedKinds ?? []);
const logoAllowedSourceTypes = new Set(publisherRules.logoAllowedSourceTypes ?? []);
const logoAllowedPublisherSlugs = new Set(publisherRules.logoAllowedPublisherSlugs ?? []);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCatalogItem(skill) {
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
    creatorAvatarUrl: skill.creatorAvatarUrl ?? null,
    creatorHandle: skill.creatorHandle ?? null,
    hasPublisherLogo: Boolean(skill.hasPublisherLogo),
    stars: typeof repoStats.stars === "number" ? repoStats.stars : null,
    forks: typeof repoStats.forks === "number" ? repoStats.forks : null,
  };
}

const CATALOG_CHUNK_SIZE = 240;

function normalizePublisher(raw) {
  return raw
    .replace(/^official\s+/i, "")
    .replace(/^skills by\s+/i, "")
    .replace(/^marketing skills by\s+/i, "")
    .replace(/^advertising skills by\s+/i, "")
    .replace(/^security skills by\s+/i, "")
    .replace(/\s+team(?:\s+for.*)?$/i, "")
    .trim();
}

function toCatalogIndexItem(skill, chunkIndex) {
  return [
    skill.slug,
    skill.name,
    skill.description,
    skill.publisher,
    skill.publisherSlug,
    skill.kind,
    skill.tags,
    skill.personas,
    skill.jobs,
    skill.sourceType,
    skill.trustLevel,
    chunkIndex,
  ];
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");
}

function stripHtml(value) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeEscapedString(value) {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\\/g, "\\")
    .trim();
}

function normalizeUrl(rawUrl, baseUrl) {
  const url = new URL(rawUrl, baseUrl);
  url.hash = "";
  url.search = "";

  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

function extractHeading(line) {
  const markdownHeading = line.match(/^###\s+(.+)$/);
  if (markdownHeading) return markdownHeading[1].trim();

  const summaryHeading = line.match(/<summary><h3[^>]*>(.+?)<\/h3><\/summary>/i);
  if (summaryHeading) return summaryHeading[1].trim();

  return null;
}

function parseKind(sectionTitle) {
  return /community/i.test(sectionTitle) ? "community" : "official";
}

function inferTags({ name, description, publisher, publisherSlug, sectionTitle, sectionSlug }) {
  const haystack = `${name} ${description} ${publisher} ${sectionTitle}`.toLowerCase();
  const tags = new Set([publisherSlug, sectionSlug]);

  const normalizedSection = sectionTitle.toLowerCase();
  const normalizedPublisher = publisherSlug.toLowerCase();

  for (const rule of classificationRules) {
    const matchesSection = rule.sections.some(
      (section) => normalizedSection === section.toLowerCase(),
    );
    const matchesPublisher = rule.publishers.some(
      (publisherRule) => normalizedPublisher === publisherRule.toLowerCase(),
    );
    const matchesPattern = rule.patterns.some((pattern) =>
      haystack.includes(pattern.toLowerCase()),
    );

    if (
      (matchesSection && (matchesPublisher || matchesPattern)) ||
      (matchesPublisher && matchesPattern)
    ) {
      tags.add(rule.tag);
    }
  }

  if (name.includes("/") && normalizedPublisher !== "community") {
    tags.add("publisher-namespaced");
  }

  tags.add("namespaced");

  return [...tags].filter(Boolean).sort();
}

function buildSourceMetadata(source) {
  return {
    sourceType: source.sourceType,
    trustLevel: source.trustLevel,
    riskFlags: [...source.riskFlags].sort(),
  };
}

function canPublisherUseLogo(skill) {
  if (logoAllowedPublisherSlugs.has(skill.publisherSlug)) {
    return true;
  }

  return logoAllowedKinds.has(skill.kind) && logoAllowedSourceTypes.has(skill.sourceType);
}

function inferPersonasAndJobs({ name, description, tags, publisherSlug, sectionSlug }) {
  const haystack = [
    name,
    description,
    publisherSlug,
    sectionSlug,
    ...tags,
  ]
    .join(" ")
    .toLowerCase();

  const personas = new Set();
  const jobs = new Set();

  const has = (pattern) => pattern.test(haystack);
  const dataSignals =
    has(/\b(sql|postgres|bigquery|snowflake|redshift|duckdb|clickhouse|query|queries)\b/) ||
    has(/\b(spreadsheet|excel|xlsx|csv|tsv)\b/) ||
    has(/\b(dashboard|chart|visualization|analytics|analysis|metrics|kpi|tableau|power bi|looker)\b/);
  const reportingSignals =
    has(/\b(report|reporting|scorecard|weekly update|weekly report|status update|business review|qbr)\b/) ||
    (has(/\b(slides|deck|pptx|presentation)\b/) &&
      has(/\b(report|review|quarterly|monthly|business)\b/));
  const documentSignals =
    has(/\b(docx|document|coauthor|memo|contract|proposal|writer|writing|redline|comment)\b/) &&
    !has(/\bdocs\b/);
  const extractionSignals = has(/\b(extract|ocr|parse|parser|pdf|docx|scan|ingest|unpack)\b/);
  const researchSignals =
    has(/\b(research|search|summarize|summary|insight|findings|evidence|synthesis|literature)\b/);
  const pmSignals =
    has(/\b(product|prd|spec|requirements|roadmap|roadmapping|stakeholder|backlog)\b/) ||
    has(/opportunity solution tree/);
  const designSignals =
    has(/\b(design|ui|ux|prototype|wireframe|figma|visual|critique|theme|frontend|storyboard|brand)\b/);
  const salesSignals =
    has(/\b(sales|proposal|pricing|quote|crm|pipeline|follow-up|followup|outreach|prospect|pitch|enablement)\b/) ||
    (has(/\b(deck|slides|pptx|presentation)\b/) && has(/\b(customer|client|buyer|prospect|sales)\b/));
  const supportSignals =
    has(/\b(support|customer success|help desk|ticket|knowledge base|faq|response|reply|triage)\b/);
  const founderSignals =
    has(/\b(launch|strategy|pricing|gtm|go-to-market|pitch|investor|landing page|market research)\b/);
  const sqlSignals = has(/\b(sql|postgres|bigquery|snowflake|redshift|duckdb|clickhouse|query|queries)\b/);
  const spreadsheetSignals = has(/\b(spreadsheet|excel|xlsx|csv|tsv)\b/);
  const dashboardSignals = has(/\b(dashboard|chart|visualization|analytics|analysis|metrics|kpi|tableau|power bi|looker)\b/);
  const strongDataSignals = sqlSignals || spreadsheetSignals || dashboardSignals;

  const add = (persona, personaJobs) => {
    personas.add(persona);
    for (const job of personaJobs) {
      jobs.add(job);
    }
  };

  if (dataSignals || (reportingSignals && strongDataSignals)) {
    add("data-analyst", [
      "sql-analysis",
      "spreadsheet-cleaning",
      "dashboarding",
      "reporting",
      "data-extraction",
      "workflow-automation",
    ]);
  }

  if (/(api|sdk|infra|deploy|cloudflare|vercel|firebase|supabase|debug|test|ci|build|code)/.test(haystack)) {
    add("engineer", [
      "development-workflows",
      "testing-debugging",
      "deployment-ops",
      "api-integration",
      "workflow-automation",
    ]);
  }

  if (pmSignals || (researchSignals && has(/\b(brief|decision|stakeholder|product)\b/))) {
    add("pm", [
      "research-synthesis",
      "prd-specs",
      "planning-roadmapping",
      "reporting",
      "workflow-automation",
    ]);
  }

  if (designSignals) {
    add("designer", [
      "ui-ux-design",
      "design-critique",
      "presentation-building",
      "visual-assets",
      "workflow-automation",
    ]);
  }

  if (/(marketing|campaign|seo|landing page|copy|content|brand|newsletter|growth)/.test(haystack)) {
    add("marketer", [
      "content-production",
      "campaign-planning",
      "research-synthesis",
      "reporting",
      "landing-pages",
    ]);
  }

  if (salesSignals) {
    add("sales", [
      "document-authoring",
      "presentation-building",
      "reporting",
      "workflow-automation",
    ]);
  }

  if (supportSignals || (documentSignals && has(/\b(faq|response|ticket|help|knowledge|reply)\b/))) {
    add("support", [
      "workflow-automation",
      "document-authoring",
      "data-extraction",
      "reporting",
    ]);
  }

  if (founderSignals) {
    add("founder", [
      "planning-roadmapping",
      "research-synthesis",
      "landing-pages",
      "workflow-automation",
    ]);
  }

  if (researchSignals || (extractionSignals && has(/\b(insight|summary|synthesis|research)\b/))) {
    jobs.add("research-synthesis");
  }

  if (
    spreadsheetSignals &&
    (
      /(clean|cleanup|normalize|transform|formula|sheet|table|tabular|pivot)/.test(haystack) ||
      sqlSignals ||
      dashboardSignals
    )
  ) {
    jobs.add("spreadsheet-cleaning");
  }

  if (dashboardSignals) {
    jobs.add("dashboarding");
  }

  if (sqlSignals) {
    jobs.add("sql-analysis");
  }

  if (reportingSignals || has(/\b(brief|memo)\b/)) {
    jobs.add("reporting");
  }

  if (extractionSignals) {
    jobs.add("data-extraction");
  }

  if (/(automate|automation|workflow|batch|pipeline)/.test(haystack)) {
    jobs.add("workflow-automation");
  }

  if (/(api|sdk|integration|mcp|service)/.test(haystack)) {
    jobs.add("api-integration");
  }

  if (/(test|testing|debug|qa|playwright|ci)/.test(haystack)) {
    jobs.add("testing-debugging");
  }

  if (/(deploy|deployment|ops|infra|cloudflare|vercel|supabase|firebase)/.test(haystack)) {
    jobs.add("deployment-ops");
  }

  if (/(code|coding|dev|developer|frontend|backend|tooling)/.test(haystack)) {
    jobs.add("development-workflows");
  }

  if (/(prd|spec|requirements|product doc)/.test(haystack)) {
    jobs.add("prd-specs");
  }

  if (/(roadmap|planning|roadmapping|milestone|backlog)/.test(haystack)) {
    jobs.add("planning-roadmapping");
  }

  if (/(ui|ux|wireframe|prototype|frontend design|interaction design)/.test(haystack)) {
    jobs.add("ui-ux-design");
  }

  if (/(critique|review design|heuristic|usability)/.test(haystack)) {
    jobs.add("design-critique");
  }

  if (/(slides|presentation|deck|pptx)/.test(haystack)) {
    jobs.add("presentation-building");
  }

  if (/(visual|image|canvas|theme|brand asset|poster)/.test(haystack)) {
    jobs.add("visual-assets");
  }

  if (/(content|copy|newsletter|blog|social)/.test(haystack)) {
    jobs.add("content-production");
  }

  if (/(campaign|launch|promotion|growth|ads)/.test(haystack)) {
    jobs.add("campaign-planning");
  }

  if (/(landing page|landing|conversion|marketing site)/.test(haystack)) {
    jobs.add("landing-pages");
  }

  if (documentSignals) {
    jobs.add("document-authoring");
  }

  return {
    personas: [...personas].sort(),
    jobs: [...jobs].sort(),
  };
}

function applySkillOverrides(skillSlug, roleMetadata) {
  const override = skillOverrides[skillSlug];

  if (!override) {
    return roleMetadata;
  }

  return {
    personas: Array.isArray(override.personas)
      ? [...new Set(override.personas.filter(Boolean))].sort()
      : [...new Set(roleMetadata.personas ?? [])].sort(),
    jobs: Array.isArray(override.jobs)
      ? [...new Set(override.jobs.filter(Boolean))].sort()
      : [...new Set(roleMetadata.jobs ?? [])].sort(),
  };
}

function parseAwesomeMarkdown(content, source) {
  const lines = content.split(/\r?\n/);
  const skills = [];

  let currentSection = "";
  let currentPublisher = "";
  let currentKind = "official";

  for (const line of lines) {
    const heading = extractHeading(line);
    if (heading) {
      currentSection = heading;
      currentKind = parseKind(heading);
      currentPublisher = normalizePublisher(heading);
      continue;
    }

    const skillMatch = line.match(/^- \*\*\[(.+?)\]\((.+?)\)\*\* - (.+)$/);
    if (!skillMatch || !currentSection) continue;

    const [, name, url, description] = skillMatch;
    const publisher = name.includes("/") ? name.split("/")[0] : currentPublisher;
    const publisherSlug = slugify(publisher);
    const sectionSlug = slugify(currentSection);
    const normalizedUrl = normalizeUrl(url);
    const tags = inferTags({
      name,
      description,
      publisher,
      publisherSlug,
      sectionTitle: currentSection,
      sectionSlug,
    });
    const roleMetadata = applySkillOverrides(
      slugify(name),
      inferPersonasAndJobs({
        name,
        description,
        tags,
        publisherSlug,
        sectionSlug,
      }),
    );

    skills.push({
      slug: slugify(name),
      name,
      url: normalizedUrl,
      description: description.trim(),
      publisher,
      publisherSlug,
      sectionTitle: currentSection,
      sectionSlug,
      kind: currentKind,
      tags,
      ...roleMetadata,
      sourceId: source.id,
      sourceIds: [source.id],
      ...buildSourceMetadata(source),
    });
  }

  return skills;
}

function parseRemoteHtml(content, source) {
  const baseUrl = source.url;
  const skillAnchors = new Map();
  const linkPattern = new RegExp(source.linkPattern, "i");
  const anchorRegex =
    /<a\b[^>]*href=(["'])([^"'#>]+)\1[^>]*>([\s\S]*?)<\/a>/gi;
  const descriptionPattern = source.descriptionPattern
    ? new RegExp(source.descriptionPattern, "i")
    : null;

  for (const match of content.matchAll(anchorRegex)) {
    const [, , href, innerHtml] = match;
    let normalizedUrl;

    try {
      normalizedUrl = normalizeUrl(href, baseUrl);
    } catch {
      continue;
    }

    const url = new URL(normalizedUrl);
    const pathMatch = url.pathname.match(linkPattern);

    if (!pathMatch) continue;

    const [, publisherSegment, skillSegment] = pathMatch;
    const name = `${publisherSegment}/${skillSegment}`;
    const publisher = publisherSegment;
    const publisherSlug = slugify(publisher);
    const sectionTitle = source.sectionTitle;
    const sectionSlug = slugify(sectionTitle);
    const descriptionMatch = descriptionPattern ? innerHtml.match(descriptionPattern) : null;
    const text = descriptionMatch ? decodeEscapedString(stripHtml(descriptionMatch[1])) : stripHtml(innerHtml);
    const fallbackDescription = source.descriptionFallback;
    const description = text && text !== name ? text : fallbackDescription;
    const tags = inferTags({
      name,
      description,
      publisher,
      publisherSlug,
      sectionTitle,
      sectionSlug,
    });
    const roleMetadata = applySkillOverrides(
      slugify(name),
      inferPersonasAndJobs({
        name,
        description,
        tags,
        publisherSlug,
        sectionSlug,
      }),
    );

    const existing = skillAnchors.get(normalizedUrl);
    if (existing && existing.description !== fallbackDescription) {
      continue;
    }

    skillAnchors.set(normalizedUrl, {
      slug: slugify(name),
      name,
      url: normalizedUrl,
      description,
      publisher,
      publisherSlug,
      sectionTitle,
      sectionSlug,
      kind: source.kind,
      tags,
      ...roleMetadata,
      sourceId: source.id,
      sourceIds: [source.id],
      ...buildSourceMetadata(source),
    });
  }

  return [...skillAnchors.values()];
}

function parseMarketplaceApi(items, source) {
  const skills = [];
  const seen = new Set();

  for (const item of items) {
    const publisher = item.ownerHandle || item.owner?.handle || "clawhub";
    const slug = item.skill?.slug || item.slug;
    const summary =
      item.latestVersion?.parsed?.description ||
      item.skill?.summary ||
      item.description ||
      item.summary ||
      source.descriptionFallback;
    if (!slug) continue;

    const publisherSlug = slugify(publisher);
    const name = `${publisher}/${slug}`;
    const url = normalizeUrl(`/${publisher}/${slug}`, "https://clawhub.ai");
    if (seen.has(url)) continue;
    seen.add(url);

    const sectionTitle = source.sectionTitle;
    const sectionSlug = slugify(sectionTitle);
    const description = decodeEscapedString(summary) || source.descriptionFallback;
    const tags = inferTags({
      name,
      description,
      publisher,
      publisherSlug,
      sectionTitle,
      sectionSlug,
    });
    const roleMetadata = applySkillOverrides(
      slugify(name),
      inferPersonasAndJobs({
        name,
        description,
        tags,
        publisherSlug,
        sectionSlug,
      }),
    );

    skills.push({
      slug: slugify(name),
      name,
      url,
      description,
      publisher,
      publisherSlug,
      sectionTitle,
      sectionSlug,
      kind: source.kind,
      tags,
      ...roleMetadata,
      sourceId: source.id,
      sourceIds: [source.id],
      ...buildSourceMetadata(source),
    });
  }

  return skills;
}

async function collectMarketplaceApiItems(source) {
  const items = [];
  let nextCursor = null;
  let warning = null;

  for (let page = 0; page < source.maxPages; page += 1) {
    const payload = {
      path: "skills:listPublicPageV4",
      format: "convex_encoded_json",
      args: [
        {
          dir: "desc",
          numItems: source.pageSize,
          sort: "downloads",
          ...(nextCursor ? { cursor: nextCursor } : {}),
        },
      ],
    };

    const response = await fetch(source.url, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "convex-client": "npm-1.41.0",
        Origin: "https://clawhub.ai",
        Referer: "https://clawhub.ai/",
        "User-Agent": "lionsaid-skills-web",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (items.length > 0 && response.status >= 500) {
        warning = `Stopped after partial ClawHub fetch at page ${page + 1}: HTTP ${response.status}`;
        break;
      }

      throw new Error(`Failed to fetch ${source.url}: HTTP ${response.status}`);
    }

    const responsePayload = await response.json();
    const value = responsePayload?.value;
    if (!Array.isArray(value?.page)) {
      break;
    }

    items.push(...value.page);

    if (!value.nextCursor) {
      break;
    }

    nextCursor = value.nextCursor;
  }

  return { items, warning };
}

function parseGithubRepoExpansion(items, source) {
  const skills = [];

  for (const item of items) {
    if (!item?.repository || !item?.url || !item?.path || !item?.skillName) continue;

    const repository = item.repository;
    const repoOwner = repository.split("/")[0];
    const repoName = repository.split("/")[1] ?? repository;
    const normalizedSkillName =
      typeof item.path === "string"
        ? /^skills\/.+\/SKILL\.md$/i.test(item.path)
          ? item.path.replace(/^skills\//i, "").replace(/\/SKILL\.md$/i, "")
          : /^.+\/SKILL\.md$/i.test(item.path)
            ? item.path.replace(/\/SKILL\.md$/i, "")
            : /^SKILL\.md$/i.test(item.path)
              ? repoName
              : item.skillName
        : item.skillName;
    const name = `${repoOwner}/${normalizedSkillName}`;
    const publisher = repoOwner;
    const publisherSlug = slugify(publisher);
    const creatorHandle = repoOwner;
    const sectionTitle = source.sectionTitle;
    const sectionSlug = slugify(sectionTitle);
    const description = item.description || `${source.descriptionFallback}: ${repository}`;
    const tags = inferTags({
      name,
      description,
      publisher,
      publisherSlug,
      sectionTitle,
      sectionSlug,
    });
    const roleMetadata = applySkillOverrides(
      slugify(name),
      inferPersonasAndJobs({
        name,
        description,
        tags,
        publisherSlug,
        sectionSlug,
      }),
    );

    skills.push({
      slug: typeof item.slug === "string" && item.slug ? item.slug : slugify(name),
      name,
      url: normalizeUrl(item.url),
      description,
      publisher,
      publisherSlug,
      sectionTitle,
      sectionSlug,
      kind: source.kind,
      tags,
      ...roleMetadata,
      sourceId: source.id,
      sourceIds: [source.id],
      repository,
      discoveryPath: item.path,
      creatorHandle,
      creatorAvatarUrl: getGithubAvatarUrl(creatorHandle),
      ...buildSourceMetadata(source),
    });
  }

  return skills;
}

function readGithubRepoExpansionCache() {
  try {
    const payload = readJson(githubSkillRepoCachePath);
    return Array.isArray(payload.items) ? payload.items : [];
  } catch {
    return [];
  }
}

function readGithubAvatarCache() {
  try {
    const payload = readJson(githubAvatarCachePath);
    return payload && typeof payload.items === "object" && !Array.isArray(payload.items)
      ? payload.items
      : {};
  } catch {
    return {};
  }
}

function writeGithubAvatarCache(items) {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    githubAvatarCachePath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalItems: Object.keys(items).length,
        items,
      },
      null,
      2,
    )}\n`,
  );
}

function getGithubAvatarUrl(handle) {
  if (!handle) return null;
  return `https://github.com/${handle}.png?size=88`;
}

function mergeSkillRecords(existing, incoming) {
  const existingDescription =
    existing.description && existing.description !== "Indexed from an official skills site";
  const incomingDescription =
    incoming.description && incoming.description !== "Indexed from an official skills site";
  const existingPriority = sourcePriority.get(existing.sourceId) ?? 0;
  const incomingPriority = sourcePriority.get(incoming.sourceId) ?? 0;
  const preferred = incomingPriority > existingPriority ? incoming : existing;
  const secondary = preferred === existing ? incoming : existing;

  return {
    ...secondary,
    ...preferred,
    description:
      incomingDescription && !existingDescription
        ? incoming.description
        : existing.description,
    tags: [...new Set([...existing.tags, ...incoming.tags])].sort(),
    personas: [...new Set([...(existing.personas ?? []), ...(incoming.personas ?? [])])].sort(),
    jobs: [...new Set([...(existing.jobs ?? []), ...(incoming.jobs ?? [])])].sort(),
    sourceIds: [...new Set([...(existing.sourceIds ?? [existing.sourceId]), ...(incoming.sourceIds ?? [incoming.sourceId])])].sort(),
    riskFlags: [...new Set([...(existing.riskFlags ?? []), ...(incoming.riskFlags ?? [])])].sort(),
    trustLevel:
      existing.trustLevel === "official" || incoming.trustLevel === "official"
        ? "official"
        : existing.trustLevel === "curated" || incoming.trustLevel === "curated"
          ? "curated"
          : incoming.trustLevel ?? existing.trustLevel,
  };
}

async function readSourceContent(source) {
  if (source.transport === "local") {
    const sourcePath = path.resolve(projectRoot, source.path);
    return readFileSync(sourcePath, "utf8");
  }

  if (source.transport === "remote") {
    const response = await fetch(source.url, {
      headers: {
        Accept: "text/plain, text/markdown;q=0.9, */*;q=0.1",
        "User-Agent": "lionsaid-skills-web",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${source.url}: HTTP ${response.status}`);
    }

    return await response.text();
  }

  throw new Error(`Unsupported source transport: ${source.transport}`);
}

async function collectSkills() {
  const allEntries = [];
  const failures = [];

  for (const source of skillSources.filter((item) => item.enabled)) {
    try {
      let skills = [];

      if (source.parser === "awesome-markdown") {
        const content = await readSourceContent(source);
        skills = parseAwesomeMarkdown(content, source);
      } else if (source.parser === "remote-html") {
        const content = await readSourceContent(source);
        skills = parseRemoteHtml(content, source);
      } else if (source.parser === "marketplace-api") {
        const result = await collectMarketplaceApiItems(source);
        skills = parseMarketplaceApi(result.items, source);
        if (result.warning) {
          failures.push({
            sourceId: source.id,
            label: source.label,
            reason: result.warning,
          });
        }
      } else if (source.parser === "github-repo-expansion") {
        const entries = readGithubRepoExpansionCache();
        skills = parseGithubRepoExpansion(entries, source);
      } else {
        throw new Error(`Unsupported source parser: ${source.parser}`);
      }

      allEntries.push(...skills);
    } catch (error) {
      const fallbackSkills = readFallbackSkillsForSource(source.id);
      if (fallbackSkills.length > 0) {
        allEntries.push(...fallbackSkills);
        failures.push({
          sourceId: source.id,
          label: source.label,
          reason: `${error instanceof Error ? error.message : "Unknown error"}; using ${fallbackSkills.length} cached skills from previous generated data`,
        });
        continue;
      }

      failures.push({
        sourceId: source.id,
        label: source.label,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const deduped = new Map();

  for (const skill of allEntries) {
    const key = skill.slug;
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, skill);
      continue;
    }

    deduped.set(key, mergeSkillRecords(existing, skill));
  }

  const avatarCache = readGithubAvatarCache();
  for (const skill of deduped.values()) {
    const handle = skill.creatorHandle ?? skill.publisherSlug;
    if (handle && !avatarCache[handle]) {
      avatarCache[handle] = getGithubAvatarUrl(handle);
    }

    skill.creatorHandle = handle;
    skill.creatorAvatarUrl = avatarCache[handle] ?? skill.creatorAvatarUrl ?? null;
    skill.hasPublisherLogo = canPublisherUseLogo(skill);
  }

  writeGithubAvatarCache(avatarCache);

  return {
    skills: [...deduped.values()],
    failures,
  };
}

const { skills, failures } = await collectSkills();

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalSkills: skills.length,
      sourceCount: skillSources.filter((source) => source.enabled).length,
      failures,
      skills,
    },
    null,
    2,
  )}\n`,
);

mkdirSync(publicDataDir, { recursive: true });
rmSync(path.join(publicDataDir, "skills-index.generated.json"), { force: true });
rmSync(publicCatalogDir, { recursive: true, force: true });
mkdirSync(publicCatalogDir, { recursive: true });

const generatedAt = new Date().toISOString();
const catalogItems = skills.map((skill) => toCatalogItem(skill));
const chunkCount = Math.ceil(catalogItems.length / CATALOG_CHUNK_SIZE);
const catalogIndexItems = skills.map((skill, index) =>
  toCatalogIndexItem(skill, Math.floor(index / CATALOG_CHUNK_SIZE)),
);

writeFileSync(
  path.join(publicCatalogDir, "manifest.json"),
  `${JSON.stringify(
    {
      generatedAt,
      totalSkills: catalogItems.length,
      chunkSize: CATALOG_CHUNK_SIZE,
      chunkCount,
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  path.join(publicCatalogDir, "index.json"),
  `${JSON.stringify(
    {
      generatedAt,
      totalSkills: catalogIndexItems.length,
      chunkSize: CATALOG_CHUNK_SIZE,
      fields: ["slug", "name", "description", "publisher", "publisherSlug", "kind", "tags", "personas", "jobs", "sourceType", "trustLevel", "chunkIndex"],
      items: catalogIndexItems,
    }
  )}\n`,
);

for (let index = 0; index < chunkCount; index += 1) {
  const start = index * CATALOG_CHUNK_SIZE;
  const end = start + CATALOG_CHUNK_SIZE;
  writeFileSync(
    path.join(publicCatalogDir, `chunk-${index}.json`),
    `${JSON.stringify(
      {
        generatedAt,
        chunkIndex: index,
        totalSkills: catalogItems.length,
        skills: catalogItems.slice(start, end),
      },
      null,
      2,
    )}\n`,
  );
}

console.log(`Generated ${skills.length} skills at ${path.relative(projectRoot, outputPath)}`);
console.log(`Generated public catalog chunks at ${path.relative(projectRoot, publicCatalogDir)}`);

if (failures.length > 0) {
  console.log("Source failures:");
  for (const failure of failures) {
    console.log(`- ${failure.sourceId}: ${failure.reason}`);
  }
}
