import skillsData from "@/data/skills.generated.json";

export type Skill = {
  slug: string;
  name: string;
  url: string;
  description: string;
  publisher: string;
  publisherSlug: string;
  sectionTitle: string;
  sectionSlug: string;
  kind: "official" | "community";
  tags: string[];
};

export type PublisherSummary = {
  name: string;
  slug: string;
  count: number;
  kind: "official" | "community";
};

export type RelatedSkill = {
  skill: Skill;
  reason: string;
};

export type SkillSort = "featured" | "name" | "publisher";
export type SkillFilterKind = Skill["kind"] | "all";

type SkillsPayload = {
  generatedAt: string;
  totalSkills: number;
  skills: Skill[];
};

const payload = skillsData as SkillsPayload;
const allSkills = payload.skills;
const hiddenRecommendationTags = new Set(["namespaced", "publisher-namespaced"]);

function getRecommendationTags(skill: Skill) {
  return skill.tags.filter(
    (tag) =>
      tag !== skill.publisherSlug &&
      tag !== skill.sectionSlug &&
      !hiddenRecommendationTags.has(tag),
  );
}

function formatRelatedReason(target: Skill, skill: Skill, sharedTags: string[]) {
  const reasons: string[] = [];

  if (skill.publisherSlug === target.publisherSlug) {
    reasons.push("same publisher");
  }

  if (skill.sectionSlug === target.sectionSlug) {
    reasons.push("same section");
  }

  if (sharedTags.length > 0) {
    reasons.push(`shared tags: ${sharedTags.join(", ")}`);
  }

  return reasons.join("; ");
}

export function getAllSkills() {
  return allSkills;
}

export function getGeneratedAt() {
  return payload.generatedAt;
}

export function getFeaturedSkills() {
  return allSkills.slice(0, 8);
}

export function getSkillBySlug(slug: string) {
  return allSkills.find((skill) => skill.slug === slug);
}

export function getRelatedSkills(slug: string, limit = 6): RelatedSkill[] {
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
        reason: formatRelatedReason(target, skill, sharedTags),
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
      continue;
    }

    map.set(skill.publisherSlug, {
      name: skill.publisher,
      slug: skill.publisherSlug,
      count: 1,
      kind: skill.kind,
    });
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
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
