import "server-only";

import skillsData from "@/data/skills.generated.json";
import jobAliasesData from "@/../config/job-aliases.json";
import publisherRulesData from "@/../config/publisher-rules.json";
import roleDefinitionsData from "@/../config/role-definitions.json";
import type { PublisherSummary, RoleDefinition, Skill } from "@/lib/skill-types";

export type { PublisherSummary, RoleDefinition, Skill } from "@/lib/skill-types";

type SkillsPayload = {
  generatedAt: string;
  totalSkills: number;
  skills: Skill[];
};

const payload = skillsData as SkillsPayload;
export const allSkills = payload.skills;
export const jobAliases = jobAliasesData as Record<string, string[]>;
export const roleDefinitions = roleDefinitionsData as RoleDefinition[];
export const publisherRules = publisherRulesData as {
  logoPriorityPublishers: string[];
  fallbackInitialsAllowedPublisherSlugs: string[];
};

export const generatedAt = payload.generatedAt;
