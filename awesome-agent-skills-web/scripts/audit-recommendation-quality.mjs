import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const outputDir = path.join(projectRoot, "src", "data");
const configPath = path.join(projectRoot, "config", "recommendation-quality.json");
const reviewConfigPath = path.join(projectRoot, "config", "recommendation-review.json");
const skillsPath = path.join(outputDir, "skills.generated.json");
const rolesPath = path.join(projectRoot, "config", "role-definitions.json");
const roleAuditPath = path.join(outputDir, "role-audit.generated.json");
const outputPath = path.join(outputDir, "recommendation-quality.generated.json");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function ratio(part, total) {
  return total === 0 ? 0 : Number((part / total).toFixed(4));
}

function normalizedName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const REVIEW_STATUSES = new Set(["relevant", "borderline", "not-relevant"]);

function getReviewsByRole(reviewConfig, roles, skillsBySlug) {
  const reviewsByRole = reviewConfig.reviewsByRole ?? {};
  if (typeof reviewsByRole !== "object" || Array.isArray(reviewsByRole)) {
    throw new Error("Recommendation review config must include a reviewsByRole object.");
  }

  const knownRoles = new Set(roles.map((role) => role.slug));
  const normalizedReviews = new Map();

  for (const [roleSlug, reviews] of Object.entries(reviewsByRole)) {
    if (!knownRoles.has(roleSlug)) {
      throw new Error(`Recommendation review references unknown role: ${roleSlug}`);
    }
    if (typeof reviews !== "object" || Array.isArray(reviews) || reviews === null) {
      throw new Error(`Reviews for ${roleSlug} must be an object keyed by skill slug.`);
    }

    const normalizedRoleReviews = new Map();
    for (const [skillSlug, review] of Object.entries(reviews)) {
      if (!skillsBySlug.has(skillSlug)) {
        throw new Error(`Recommendation review for ${roleSlug} references unknown skill: ${skillSlug}`);
      }
      if (typeof review !== "object" || review === null || Array.isArray(review)) {
        throw new Error(`Review for ${roleSlug}/${skillSlug} must be an object.`);
      }
      if (!REVIEW_STATUSES.has(review.status)) {
        throw new Error(
          `Review for ${roleSlug}/${skillSlug} must use one of: ${[...REVIEW_STATUSES].join(", ")}.`,
        );
      }

      normalizedRoleReviews.set(skillSlug, {
        status: review.status,
        note: typeof review.note === "string" ? review.note.trim() : undefined,
      });
    }
    normalizedReviews.set(roleSlug, normalizedRoleReviews);
  }

  return normalizedReviews;
}

function main() {
  const config = readJson(configPath);
  const reviewConfig = readJson(reviewConfigPath);
  const skills = readJson(skillsPath).skills ?? [];
  const roles = readJson(rolesPath);
  const auditedRoles = readJson(roleAuditPath).roles ?? [];
  const skillsBySlug = new Map(skills.map((skill) => [skill.slug, skill]));
  const roleAuditBySlug = new Map(auditedRoles.map((entry) => [entry.role, entry]));
  const reviewsByRole = getReviewsByRole(reviewConfig, roles, skillsBySlug);
  const descriptionMissing = skills.filter(
    (skill) => String(skill.description ?? "").trim().length < config.minimumDescriptionLength,
  );
  const duplicateGroups = new Map();

  for (const skill of skills) {
    const key = `${skill.publisherSlug}:${normalizedName(skill.name)}`;
    if (!key.endsWith(":")) {
      duplicateGroups.set(key, [...(duplicateGroups.get(key) ?? []), skill.slug]);
    }
  }

  const nearDuplicateGroups = [...duplicateGroups.entries()]
    .filter(([, slugs]) => slugs.length > 1)
    .map(([key, slugs]) => ({ key, slugs }));
  const nearDuplicateSkills = nearDuplicateGroups.reduce((count, group) => count + group.slugs.length, 0);
  const warnings = [];
  const roleChecks = roles.map((role) => {
    const topSkills = roleAuditBySlug.get(role.slug)?.topSkills ?? [];
    const resolvedSkills = topSkills
      .map((item) => skillsBySlug.get(item.slug))
      .filter(Boolean);
    const firstFivePublishers = new Set(resolvedSkills.slice(0, 5).map((skill) => skill.publisherSlug));
    const trustedSkills = resolvedSkills.filter((skill) => skill.trustLevel !== "untrusted");
    const riskFlaggedSkills = resolvedSkills.filter((skill) => (skill.riskFlags ?? []).length > 0);
    const roleReviews = reviewsByRole.get(role.slug) ?? new Map();
    const reviewQueue = resolvedSkills.slice(0, config.reviewQueueSizePerRole).map((skill) => {
      const review = roleReviews.get(skill.slug);
      return {
        slug: skill.slug,
        name: skill.name,
        publisher: skill.publisher,
        trustLevel: skill.trustLevel,
        status: review?.status ?? "unreviewed",
        ...(review?.note ? { note: review.note } : {}),
        rubric: "relevant | borderline | not-relevant",
      };
    });
    const reviewedInQueue = reviewQueue.filter((skill) => skill.status !== "unreviewed");
    const checks = {
      enoughTopSkills: resolvedSkills.length >= config.minimumTopSkillsPerRole,
      publisherDiversity: firstFivePublishers.size >= config.minimumPublishersInFirstFive,
      trustedShare: ratio(trustedSkills.length, resolvedSkills.length) >= config.minimumTrustedShareInTopTen,
      riskShare: ratio(riskFlaggedSkills.length, resolvedSkills.length) <= config.maximumRiskFlagShareInTopTen,
    };

    for (const [check, passed] of Object.entries(checks)) {
      if (!passed) warnings.push(`${role.slug}: ${check} needs review`);
    }

    return {
      role: role.slug,
      topSkillCount: resolvedSkills.length,
      distinctPublishersInFirstFive: firstFivePublishers.size,
      trustedShare: ratio(trustedSkills.length, resolvedSkills.length),
      riskFlagShare: ratio(riskFlaggedSkills.length, resolvedSkills.length),
      checks,
      reviewSummary: {
        reviewedCount: reviewedInQueue.length,
        queueSize: reviewQueue.length,
        relevantCount: reviewedInQueue.filter((skill) => skill.status === "relevant").length,
        borderlineCount: reviewedInQueue.filter((skill) => skill.status === "borderline").length,
        notRelevantCount: reviewedInQueue.filter((skill) => skill.status === "not-relevant").length,
      },
      reviewQueue,
    };
  });

  const catalogChecks = {
    missingDescriptionShare: ratio(descriptionMissing.length, skills.length),
    nearDuplicateShare: ratio(nearDuplicateSkills, skills.length),
  };

  if (catalogChecks.missingDescriptionShare > config.maximumMissingDescriptionShare) {
    warnings.push("catalog: missingDescriptionShare exceeds threshold");
  }
  if (catalogChecks.nearDuplicateShare > config.maximumNearDuplicateShare) {
    warnings.push("catalog: nearDuplicateShare exceeds threshold");
  }

  const result = {
    generatedAt: new Date().toISOString(),
    thresholds: config,
    catalog: {
      totalSkills: skills.length,
      missingDescriptionCount: descriptionMissing.length,
      nearDuplicateGroupCount: nearDuplicateGroups.length,
      nearDuplicateSkillCount: nearDuplicateSkills,
      checks: catalogChecks,
      sampleNearDuplicates: nearDuplicateGroups.slice(0, 20),
    },
    roles: roleChecks,
    reviews: {
      configuredCount: [...reviewsByRole.values()].reduce((count, reviews) => count + reviews.size, 0),
      topRecommendationReviewedCount: roleChecks.reduce(
        (count, role) => count + role.reviewSummary.reviewedCount,
        0,
      ),
      topRecommendationQueueSize: roleChecks.reduce(
        (count, role) => count + role.reviewSummary.queueSize,
        0,
      ),
    },
    warnings,
    summary: {
      roleChecksPassing: roleChecks.filter((role) => Object.values(role.checks).every(Boolean)).length,
      totalRoles: roleChecks.length,
      warningCount: warnings.length,
      reviewCoverage: ratio(
        roleChecks.reduce((count, role) => count + role.reviewSummary.reviewedCount, 0),
        roleChecks.reduce((count, role) => count + role.reviewSummary.queueSize, 0),
      ),
      warningRoleReviewCoverage: ratio(
        roleChecks
          .filter((role) => !Object.values(role.checks).every(Boolean))
          .reduce((count, role) => count + role.reviewSummary.reviewedCount, 0),
        roleChecks
          .filter((role) => !Object.values(role.checks).every(Boolean))
          .reduce((count, role) => count + role.reviewSummary.queueSize, 0),
      ),
    },
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Wrote recommendation quality audit to ${path.relative(projectRoot, outputPath)}`);
  console.log(`Quality summary: ${result.summary.roleChecksPassing}/${result.summary.totalRoles} roles clear, ${warnings.length} warnings.`);
}

main();
