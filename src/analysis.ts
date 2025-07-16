import { writeFileSync } from "fs";
import { LoadedData } from "./data.js";
import {
  RepositoryAnalysis,
  CohortDetail,
  CohortResult,
  CohortSummary,
  EnterpriseCohortSummary,
} from "./types.js";

// =============================================================================
// CONFIGURATION SETTINGS
// =============================================================================

/**
 * Configuration for migration analysis weights and thresholds
 */
const CONFIG = {
  // Weight values for different migration blockers (higher = more complex)
  WEIGHTS: {
    APP_INSTALLATIONS: 15, // High concern - Users, teams, repository access
    GIT_LFS_OBJECTS: 2, // Reduced - Migration support added
    PACKAGES: 3, // Reduced - Migration support added
    PROJECTS: 3, // Reduced - Partial migration support added
    CUSTOM_PROPERTIES: 2, // Reduced - Migration support added
    RULESETS: 3, // Reduced - Migration support added (with limitations)
    SECRETS: 12, // High concern - Critical for teams, migration support covers names only
    ENVIRONMENTS: 3, // Reduced - Migration support added
    SELF_HOSTED_RUNNERS: 12, // High concern - Actions resources critical for teams
    WEBHOOKS: 10, // High concern - Secrets type, critical for teams
    DISCUSSIONS: 2, // Low concern - Not mentioned as high priority
    DEPLOY_KEYS: 8, // Medium-high concern - Repository access related
    PAGES_CUSTOM_DOMAIN: 2, // Low concern - Not mentioned as high priority
    RELEASES_LARGE: 7, // Medium concern - Not mentioned but still significant
    CODESPACES: 25, // Highest weight - Critical migration blocker
    MAVEN_PACKAGES: 25, // Highest weight - Critical migration blocker
    MACOS_RUNNERS: 25, // Highest weight - Critical migration blocker
    IS_ARCHIVED: 1, // Low weight - Only basic migration for archived repos
    EXTERNAL_COLLABORATORS: 12, // High concern - Users, teams, repository access
    UNMIGRATABLE: 30, // Highest weight for unmigratable repos
  },

  // Thresholds for cohort assignment
  THRESHOLDS: {
    CLEAN_REPO_MAX_WEIGHT: 0,
    LOW_COMPLEXITY_MAX_WEIGHT: 10,
    MEDIUM_COMPLEXITY_MAX_WEIGHT: 25,
  },

  // Enable/disable specific analysis features
  FEATURES: {
    INCLUDE_ARCHIVED_IN_MAIN_ANALYSIS: false,
    SEPARATE_MAVEN_COHORT: true,
    SEPARATE_CODESPACE_COHORT: true,
    SEPARATE_MACOS_COHORT: true,
    SEPARATE_UNMIGRATABLE_COHORT: false, // Temporarily disabled to see other cohorts
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a repository is archived
 */
function isArchived(repo: RepositoryAnalysis): boolean {
  return (
    repo.isArchived === "true" ||
    repo.isArchived === "TRUE" ||
    repo.isArchived === "1"
  );
}

/**
 * Convert string values to numbers (handle empty strings and non-numeric values)
 */
function toNumber(value: string): number {
  if (
    !value ||
    value.trim() === "" ||
    value === "null" ||
    value === "undefined"
  ) {
    return 0;
  }
  const num = parseInt(value, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert string boolean values to boolean
 */
function toBoolean(value: string): boolean {
  return (
    value === "true" ||
    value === "TRUE" ||
    value === "1" ||
    value === "yes" ||
    value === "YES"
  );
}

/**
 * Calculate migration weight based on repository features
 */
function calculateMigrationWeight(repo: RepositoryAnalysis): number {
  let weight = 0;

  // Check each migration blocker and add appropriate weight
  if (toNumber(repo.app_installations) > 0) {
    weight += CONFIG.WEIGHTS.APP_INSTALLATIONS;
  }

  if (toNumber(repo["git-lfs-objects"]) > 0) {
    weight += CONFIG.WEIGHTS.GIT_LFS_OBJECTS;
  }

  if (toNumber(repo["repository-packages"]) > 0) {
    weight += CONFIG.WEIGHTS.PACKAGES;
  }

  if (
    toNumber(repo.projects_linked_to_repo) > 0 ||
    toNumber(repo.issues_linked_to_projects) > 0
  ) {
    weight += CONFIG.WEIGHTS.PROJECTS;
  }

  if (toNumber(repo["repository-custom-properties"]) > 0) {
    weight += CONFIG.WEIGHTS.CUSTOM_PROPERTIES;
  }

  if (toNumber(repo["repository-rulesets"]) > 0) {
    weight += CONFIG.WEIGHTS.RULESETS;
  }

  if (
    toNumber(repo["repository-actions-secrets"]) > 0 ||
    toNumber(repo["repository-dependabot-secrets"]) > 0
  ) {
    weight += CONFIG.WEIGHTS.SECRETS;
  }

  if (toNumber(repo["repository-environments"]) > 0) {
    weight += CONFIG.WEIGHTS.ENVIRONMENTS;
  }

  if (toNumber(repo["repository-actions-self-hosted-runners"]) > 0) {
    weight += CONFIG.WEIGHTS.SELF_HOSTED_RUNNERS;
  }

  if (toNumber(repo["repository-webhooks"]) > 0) {
    weight += CONFIG.WEIGHTS.WEBHOOKS;
  }

  if (toNumber(repo["repository-discussions"]) > 0) {
    weight += CONFIG.WEIGHTS.DISCUSSIONS;
  }

  if (toNumber(repo["repository-deploy-keys"]) > 0) {
    weight += CONFIG.WEIGHTS.DEPLOY_KEYS;
  }

  if (toNumber(repo["repository-pages-customdomain"]) > 0) {
    weight += CONFIG.WEIGHTS.PAGES_CUSTOM_DOMAIN;
  }

  if (toNumber(repo["repository-releases-gt-5gb"]) > 0) {
    weight += CONFIG.WEIGHTS.RELEASES_LARGE;
  }

  // Check if repository is archived
  if (isArchived(repo)) {
    weight += CONFIG.WEIGHTS.IS_ARCHIVED;
  }

  // Check for external collaborators
  if (toBoolean(repo.has_external_collaborators)) {
    weight += CONFIG.WEIGHTS.EXTERNAL_COLLABORATORS;
  }

  // Check for unmigratable features
  if (toBoolean(repo.has_unmigratable)) {
    weight += CONFIG.WEIGHTS.UNMIGRATABLE;
  }

  return weight;
}

/**
 * Get detailed reasons for migration complexity
 */
function getMigrationReasons(repo: RepositoryAnalysis): string[] {
  const reasons: string[] = [];

  if (toNumber(repo.app_installations) > 0) {
    reasons.push(`App installations (${repo.app_installations})`);
  }

  if (toNumber(repo["git-lfs-objects"]) > 0) {
    reasons.push(`Git LFS objects (${repo["git-lfs-objects"]})`);
  }

  if (toNumber(repo["repository-packages"]) > 0) {
    reasons.push(`Repository packages (${repo["repository-packages"]})`);
  }

  if (
    toNumber(repo.projects_linked_to_repo) > 0 ||
    toNumber(repo.issues_linked_to_projects) > 0
  ) {
    reasons.push(
      `Projects linked (repo: ${repo.projects_linked_to_repo}, issues: ${repo.issues_linked_to_projects})`
    );
  }

  if (toNumber(repo["repository-custom-properties"]) > 0) {
    reasons.push(`Custom properties (${repo["repository-custom-properties"]})`);
  }

  if (toNumber(repo["repository-rulesets"]) > 0) {
    reasons.push(`Rulesets (${repo["repository-rulesets"]})`);
  }

  if (
    toNumber(repo["repository-actions-secrets"]) > 0 ||
    toNumber(repo["repository-dependabot-secrets"]) > 0
  ) {
    reasons.push(
      `Secrets (Actions: ${repo["repository-actions-secrets"]}, Dependabot: ${repo["repository-dependabot-secrets"]})`
    );
  }

  if (toNumber(repo["repository-environments"]) > 0) {
    reasons.push(`Environments (${repo["repository-environments"]})`);
  }

  if (toNumber(repo["repository-actions-self-hosted-runners"]) > 0) {
    reasons.push(
      `Self-hosted runners (${repo["repository-actions-self-hosted-runners"]})`
    );
  }

  if (toNumber(repo["repository-webhooks"]) > 0) {
    reasons.push(`Webhooks (${repo["repository-webhooks"]})`);
  }

  if (toNumber(repo["repository-discussions"]) > 0) {
    reasons.push(`Discussions (${repo["repository-discussions"]})`);
  }

  if (toNumber(repo["repository-deploy-keys"]) > 0) {
    reasons.push(`Deploy keys (${repo["repository-deploy-keys"]})`);
  }

  if (toNumber(repo["repository-pages-customdomain"]) > 0) {
    reasons.push(
      `Pages custom domain (${repo["repository-pages-customdomain"]})`
    );
  }

  if (toNumber(repo["repository-releases-gt-5gb"]) > 0) {
    reasons.push(`Large releases (${repo["repository-releases-gt-5gb"]})`);
  }

  if (toBoolean(repo.has_maven_packages)) {
    reasons.push(`Maven packages (${repo.maven_package_count})`);
  }

  if (toBoolean(repo.has_codespaces)) {
    reasons.push(
      `Codespaces (${repo.codespace_count} codespaces, ${repo.codespace_user_count} users)`
    );
  }

  if (toBoolean(repo.has_macos_runners)) {
    reasons.push("macOS runners");
  }

  if (toBoolean(repo.has_external_collaborators)) {
    reasons.push("External collaborators");
  }

  if (toBoolean(repo.has_unmigratable)) {
    reasons.push("Unmigratable features");
  }

  if (isArchived(repo)) {
    reasons.push("Archived repository");
  }

  return reasons;
}

/**
 * Determine cohort assignment based on repository characteristics
 */
function assignCohort(
  repo: RepositoryAnalysis,
  migrationWeight: number
): string {
  // Unmigratable repositories get their own cohort
  if (
    CONFIG.FEATURES.SEPARATE_UNMIGRATABLE_COHORT &&
    toBoolean(repo.has_unmigratable)
  ) {
    return "UNMIGRATABLE";
  }

  // Archived repositories get their own cohort
  if (isArchived(repo)) {
    return "ARCHIVED";
  }

  // macOS runners get separate cohort if enabled
  if (
    CONFIG.FEATURES.SEPARATE_MACOS_COHORT &&
    toBoolean(repo.has_macos_runners)
  ) {
    return "MACOS_RUNNERS";
  }

  // Maven packages get separate cohort if enabled
  if (
    CONFIG.FEATURES.SEPARATE_MAVEN_COHORT &&
    toBoolean(repo.has_maven_packages)
  ) {
    return "MAVEN_PACKAGES";
  }

  // Codespaces get separate cohort if enabled
  if (
    CONFIG.FEATURES.SEPARATE_CODESPACE_COHORT &&
    toBoolean(repo.has_codespaces)
  ) {
    return "CODESPACES";
  }

  // Clean repositories (no migration issues)
  if (migrationWeight <= CONFIG.THRESHOLDS.CLEAN_REPO_MAX_WEIGHT) {
    return "CLEAN";
  }

  // Low complexity migration
  if (migrationWeight <= CONFIG.THRESHOLDS.LOW_COMPLEXITY_MAX_WEIGHT) {
    return "LOW_COMPLEXITY";
  }

  // Medium complexity migration
  if (migrationWeight <= CONFIG.THRESHOLDS.MEDIUM_COMPLEXITY_MAX_WEIGHT) {
    return "MEDIUM_COMPLEXITY";
  }

  // High complexity migration
  return "HIGH_COMPLEXITY";
}

/**
 * Generate summary description for cohort assignment
 */
function generateSummary(
  cohort: string,
  reasons: string[],
  weight: number
): string {
  switch (cohort) {
    case "UNMIGRATABLE":
      return "Repository has features that cannot be migrated - requires special handling";
    case "ARCHIVED":
      return "Archived repository - lower migration priority";
    case "CLEAN":
      return "Clean repository with no migration blockers - can migrate easily";
    case "MACOS_RUNNERS":
      return "Repository with macOS runners - requires runner migration planning";
    case "MAVEN_PACKAGES":
      return "Repository with Maven packages - requires package migration planning";
    case "CODESPACES":
      return "Repository with Codespaces usage - requires Codespaces migration planning";
    case "LOW_COMPLEXITY":
      return `Low complexity migration (weight: ${weight}) - ${reasons.length} minor issues`;
    case "MEDIUM_COMPLEXITY":
      return `Medium complexity migration (weight: ${weight}) - ${reasons.length} moderate issues`;
    case "HIGH_COMPLEXITY":
      return `High complexity migration (weight: ${weight}) - ${reasons.length} major issues`;
    default:
      return `Migration weight: ${weight}`;
  }
}

// =============================================================================
// MAIN ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Check if repository has specific feature categories (for boolean flags)
 */
function hasFeatureFlags(repo: RepositoryAnalysis): {
  HAS_APP_INSTALLATIONS: boolean;
  HAS_GIT_LFS_OBJECTS: boolean;
  HAS_PACKAGES: boolean;
  HAS_PROJECTS: boolean;
  HAS_CUSTOM_PROPERTIES: boolean;
  HAS_RULESETS: boolean;
  HAS_SECRETS: boolean;
  HAS_ENVIRONMENTS: boolean;
  HAS_SELF_HOSTED_RUNNERS: boolean;
  HAS_WEBHOOKS: boolean;
  HAS_DISCUSSIONS: boolean;
  HAS_DEPLOY_KEYS: boolean;
  HAS_PAGES_CUSTOM_DOMAIN: boolean;
  HAS_RELEASES_LARGE: boolean;
  HAS_CODESPACES: boolean;
  HAS_MAVEN_PACKAGES: boolean;
  HAS_MACOS_RUNNERS: boolean;
  HAS_IS_ARCHIVED: boolean;
  HAS_EXTERNAL_COLLABORATORS: boolean;
  HAS_UNMIGRATABLE: boolean;
} {
  return {
    HAS_APP_INSTALLATIONS: toNumber(repo.app_installations) > 0,
    HAS_GIT_LFS_OBJECTS: toNumber(repo["git-lfs-objects"]) > 0,
    HAS_PACKAGES: toNumber(repo["repository-packages"]) > 0,
    HAS_PROJECTS:
      toNumber(repo.projects_linked_to_repo) > 0 ||
      toNumber(repo.issues_linked_to_projects) > 0,
    HAS_CUSTOM_PROPERTIES: toNumber(repo["repository-custom-properties"]) > 0,
    HAS_RULESETS: toNumber(repo["repository-rulesets"]) > 0,
    HAS_SECRETS:
      toNumber(repo["repository-actions-secrets"]) > 0 ||
      toNumber(repo["repository-dependabot-secrets"]) > 0,
    HAS_ENVIRONMENTS: toNumber(repo["repository-environments"]) > 0,
    HAS_SELF_HOSTED_RUNNERS:
      toNumber(repo["repository-actions-self-hosted-runners"]) > 0,
    HAS_WEBHOOKS: toNumber(repo["repository-webhooks"]) > 0,
    HAS_DISCUSSIONS: toNumber(repo["repository-discussions"]) > 0,
    HAS_DEPLOY_KEYS: toNumber(repo["repository-deploy-keys"]) > 0,
    HAS_PAGES_CUSTOM_DOMAIN:
      toNumber(repo["repository-pages-customdomain"]) > 0,
    HAS_RELEASES_LARGE: toNumber(repo["repository-releases-gt-5gb"]) > 0,
    HAS_CODESPACES: toBoolean(repo.has_codespaces),
    HAS_MAVEN_PACKAGES: toBoolean(repo.has_maven_packages),
    HAS_MACOS_RUNNERS: toBoolean(repo.has_macos_runners),
    HAS_IS_ARCHIVED: isArchived(repo),
    HAS_EXTERNAL_COLLABORATORS: toBoolean(repo.has_external_collaborators),
    HAS_UNMIGRATABLE: toBoolean(repo.has_unmigratable),
  };
}

/**
 * Count feature gaps (MAVEN_PACKAGES, CODESPACES, MACOS_RUNNERS)
 */
function countFeatureGaps(repo: RepositoryAnalysis): number {
  let count = 0;
  if (toBoolean(repo.has_maven_packages)) count++;
  if (toBoolean(repo.has_codespaces)) count++;
  if (toBoolean(repo.has_macos_runners)) count++;
  return count;
}

/**
 * Analyze repositories and generate detailed cohort data
 */
export function analyzeRepositoriesDetailed(data: LoadedData): CohortDetail[] {
  const results: CohortDetail[] = [];

  for (const repo of data.repositories) {
    const migrationWeight = calculateMigrationWeight(repo);
    const migrationReasons = getMigrationReasons(repo);
    const cohort = assignCohort(repo, migrationWeight);
    const summary = generateSummary(cohort, migrationReasons, migrationWeight);
    const featureFlags = hasFeatureFlags(repo);
    const featureGapCount = countFeatureGaps(repo);

    const result: CohortDetail = {
      repositoryName: repo.Repo_Name,
      organizationName: repo.Org_Name,
      enterpriseName: repo.Enterprise,
      cohort,
      cohortWeight: migrationWeight, // For backwards compatibility
      migrationWeight,
      migrationReasons: migrationReasons.join("; "),
      summary,
      featureGapCount,
      ...featureFlags,
    };

    results.push(result);
  }

  return results;
}

/**
 * Analyze repositories and return simplified cohort results
 */
export function analyzeRepositories(data: LoadedData): CohortResult[] {
  const results: CohortResult[] = [];

  for (const repo of data.repositories) {
    const migrationWeight = calculateMigrationWeight(repo);
    const migrationReasons = getMigrationReasons(repo);
    const cohort = assignCohort(repo, migrationWeight);
    const summary = generateSummary(cohort, migrationReasons, migrationWeight);

    const result: CohortResult = {
      repoName: repo.Repo_Name,
      orgName: repo.Org_Name,
      enterpriseName: repo.Enterprise,
      cohort,
      migrationWeight,
      reasons: migrationReasons,
      summary,
      isArchived: isArchived(repo),
    };

    results.push(result);
  }

  return results;
}

/**
 * Generate summary statistics for each cohort
 */
export function generateCohortSummaries(
  results: CohortResult[]
): CohortSummary[] {
  const summaries: CohortSummary[] = [];
  const cohortMap = new Map<string, CohortResult[]>();

  // Group results by cohort
  for (const result of results) {
    if (!cohortMap.has(result.cohort)) {
      cohortMap.set(result.cohort, []);
    }
    cohortMap.get(result.cohort)!.push(result);
  }

  // Calculate summaries
  for (const [cohortName, cohortResults] of cohortMap) {
    const repositoryCount = cohortResults.length;
    const totalWeight = cohortResults.reduce(
      (sum, result) => sum + result.migrationWeight,
      0
    );
    const averageWeight =
      repositoryCount > 0 ? totalWeight / repositoryCount : 0;

    summaries.push({
      cohortName,
      repositoryCount,
      totalWeight,
      averageWeight,
    });
  }

  // Sort by average weight descending (most complex first)
  return summaries.sort((a, b) => b.averageWeight - a.averageWeight);
}

/**
 * Generate enterprise-specific cohort summaries
 */
export function generateEnterpriseCohortSummaries(
  results: CohortResult[]
): EnterpriseCohortSummary[] {
  const enterpriseSummaries: EnterpriseCohortSummary[] = [];
  const enterpriseMap = new Map<string, CohortResult[]>();

  // Group results by enterprise
  for (const result of results) {
    const enterprise = result.enterpriseName || "Unknown";
    if (!enterpriseMap.has(enterprise)) {
      enterpriseMap.set(enterprise, []);
    }
    enterpriseMap.get(enterprise)!.push(result);
  }

  // Generate summaries for each enterprise
  for (const [enterpriseName, enterpriseResults] of enterpriseMap) {
    const cohortSummaries = generateCohortSummaries(enterpriseResults);
    const totalRepositories = enterpriseResults.length;
    const totalWeight = enterpriseResults.reduce(
      (sum, result) => sum + result.migrationWeight,
      0
    );
    const averageWeight =
      totalRepositories > 0 ? totalWeight / totalRepositories : 0;

    enterpriseSummaries.push({
      enterpriseName,
      cohortSummaries,
      totalRepositories,
      totalWeight,
      averageWeight,
    });
  }

  // Sort by enterprise name
  return enterpriseSummaries.sort((a, b) =>
    a.enterpriseName.localeCompare(b.enterpriseName)
  );
}

/**
 * Export detailed results to CSV format
 */
export function exportDetailedToCsv(results: CohortDetail[]): string {
  const headers = [
    "Repository Name",
    "Organization",
    "Enterprise",
    "Cohort",
    "Migration Weight",
    "Migration Reasons",
    "Summary",
    "Feature Gap Count",
    "HAS_APP_INSTALLATIONS",
    "HAS_GIT_LFS_OBJECTS",
    "HAS_PACKAGES",
    "HAS_PROJECTS",
    "HAS_CUSTOM_PROPERTIES",
    "HAS_RULESETS",
    "HAS_SECRETS",
    "HAS_ENVIRONMENTS",
    "HAS_SELF_HOSTED_RUNNERS",
    "HAS_WEBHOOKS",
    "HAS_DISCUSSIONS",
    "HAS_DEPLOY_KEYS",
    "HAS_PAGES_CUSTOM_DOMAIN",
    "HAS_RELEASES_LARGE",
    "HAS_CODESPACES",
    "HAS_MAVEN_PACKAGES",
    "HAS_MACOS_RUNNERS",
    "HAS_IS_ARCHIVED",
    "HAS_EXTERNAL_COLLABORATORS",
    "HAS_UNMIGRATABLE",
  ];

  let csv = headers.join(",") + "\n";

  // Sort results by cohort, then by weight descending
  const sortedResults = results.sort((a, b) => {
    if (a.cohort !== b.cohort) {
      return a.cohort.localeCompare(b.cohort);
    }
    return b.migrationWeight - a.migrationWeight;
  });

  for (const result of sortedResults) {
    const row = [
      `"${result.repositoryName}"`,
      `"${result.organizationName}"`,
      `"${result.enterpriseName}"`,
      `"${result.cohort}"`,
      result.migrationWeight,
      `"${result.migrationReasons.replace(/"/g, '""')}"`,
      `"${result.summary.replace(/"/g, '""')}"`,
      result.featureGapCount,
      result.HAS_APP_INSTALLATIONS,
      result.HAS_GIT_LFS_OBJECTS,
      result.HAS_PACKAGES,
      result.HAS_PROJECTS,
      result.HAS_CUSTOM_PROPERTIES,
      result.HAS_RULESETS,
      result.HAS_SECRETS,
      result.HAS_ENVIRONMENTS,
      result.HAS_SELF_HOSTED_RUNNERS,
      result.HAS_WEBHOOKS,
      result.HAS_DISCUSSIONS,
      result.HAS_DEPLOY_KEYS,
      result.HAS_PAGES_CUSTOM_DOMAIN,
      result.HAS_RELEASES_LARGE,
      result.HAS_CODESPACES,
      result.HAS_MAVEN_PACKAGES,
      result.HAS_MACOS_RUNNERS,
      result.HAS_IS_ARCHIVED,
      result.HAS_EXTERNAL_COLLABORATORS,
      result.HAS_UNMIGRATABLE,
    ];

    csv += row.join(",") + "\n";
  }

  return csv;
}

/**
 * Export results to CSV format
 */
export function exportToCsv(
  results: CohortResult[],
  summaries: CohortSummary[]
): string {
  let csv = "";

  // Add summary section
  csv += "=== COHORT SUMMARY ===\n";
  csv += "Cohort,Repository Count,Total Weight,Average Weight\n";
  for (const summary of summaries) {
    csv += `"${summary.cohortName}",${summary.repositoryCount},${
      summary.totalWeight
    },${summary.averageWeight.toFixed(2)}\n`;
  }

  csv += "\n=== REPOSITORY DETAILS ===\n";
  csv +=
    "Repository Name,Organization,Enterprise,Cohort,Migration Weight,Migration Reasons,Summary\n";

  // Sort results by cohort, then by weight descending
  const sortedResults = results.sort((a, b) => {
    if (a.cohort !== b.cohort) {
      return a.cohort.localeCompare(b.cohort);
    }
    return b.migrationWeight - a.migrationWeight;
  });

  for (const result of sortedResults) {
    const reasonsStr = result.reasons.join("; ");
    csv += `"${result.repoName}","${result.orgName}","${
      result.enterpriseName
    }","${result.cohort}",${result.migrationWeight},"${reasonsStr.replace(
      /"/g,
      '""'
    )}","${result.summary.replace(/"/g, '""')}"\n`;
  }

  return csv;
}

/**
 * Export enterprise-specific results to CSV format
 */
export function exportEnterpriseSpecificToCsv(
  enterpriseSummaries: EnterpriseCohortSummary[],
  allResults: CohortResult[]
): string {
  let csv = "";

  // Add overall summary section
  csv += "=== ENTERPRISE OVERVIEW ===\n";
  csv += "Enterprise,Total Repositories,Total Weight,Average Weight\n";
  for (const enterprise of enterpriseSummaries) {
    csv += `"${enterprise.enterpriseName}",${enterprise.totalRepositories},${
      enterprise.totalWeight
    },${enterprise.averageWeight.toFixed(2)}\n`;
  }

  // Add detailed summaries for each enterprise
  for (const enterprise of enterpriseSummaries) {
    csv += `\n=== ${enterprise.enterpriseName} COHORT SUMMARY ===\n`;
    csv += "Cohort,Repository Count,Total Weight,Average Weight\n";
    for (const summary of enterprise.cohortSummaries) {
      csv += `"${summary.cohortName}",${summary.repositoryCount},${
        summary.totalWeight
      },${summary.averageWeight.toFixed(2)}\n`;
    }
  }

  // Add repository details section organized by enterprise
  csv += "\n=== REPOSITORY DETAILS BY ENTERPRISE ===\n";
  csv +=
    "Repository Name,Organization,Enterprise,Cohort,Migration Weight,Migration Reasons,Summary\n";

  // Sort results by enterprise, then by cohort, then by weight descending
  const sortedResults = allResults.sort((a, b) => {
    const enterpriseA = a.enterpriseName || "Unknown";
    const enterpriseB = b.enterpriseName || "Unknown";

    if (enterpriseA !== enterpriseB) {
      return enterpriseA.localeCompare(enterpriseB);
    }
    if (a.cohort !== b.cohort) {
      return a.cohort.localeCompare(b.cohort);
    }
    return b.migrationWeight - a.migrationWeight;
  });

  for (const result of sortedResults) {
    const reasonsStr = result.reasons.join("; ");
    csv += `"${result.repoName}","${result.orgName}","${
      result.enterpriseName || "Unknown"
    }","${result.cohort}",${result.migrationWeight},"${reasonsStr.replace(
      /"/g,
      '""'
    )}","${result.summary.replace(/"/g, '""')}"\n`;
  }

  return csv;
}

/**
 * Main analysis function that orchestrates the entire process
 */
export function runCohortAnalysis(data: LoadedData): void {
  console.log("Starting cohort analysis...");

  try {
    // Generate detailed analysis
    const detailedResults = analyzeRepositoriesDetailed(data);
    const detailedCsvContent = exportDetailedToCsv(detailedResults);

    // Write detailed results to file
    const detailedOutputPath = "output/cohort-analysis-detailed.csv";
    writeFileSync(detailedOutputPath, detailedCsvContent, "utf-8");
    console.log(`Detailed results exported to ${detailedOutputPath}`);

    // Generate summary analysis
    const simpleResults = analyzeRepositories(data);
    const summaries = generateCohortSummaries(simpleResults);
    const simpleCsvContent = exportToCsv(simpleResults, summaries);

    // Write summary results to file
    const summaryOutputPath = "output/cohort-analysis.csv";
    writeFileSync(summaryOutputPath, simpleCsvContent, "utf-8");
    console.log(`Summary results exported to ${summaryOutputPath}`);

    // Generate enterprise-specific analysis
    const enterpriseSummaries =
      generateEnterpriseCohortSummaries(simpleResults);
    const enterpriseCsvContent = exportEnterpriseSpecificToCsv(
      enterpriseSummaries,
      simpleResults
    );

    // Write enterprise-specific results to file
    const enterpriseOutputPath = "output/cohort-analysis-enterprise.csv";
    writeFileSync(enterpriseOutputPath, enterpriseCsvContent, "utf-8");
    console.log(
      `Enterprise-specific results exported to ${enterpriseOutputPath}`
    );

    // Print summary to console
    console.log("\n=== OVERALL COHORT SUMMARY ===");
    for (const summary of summaries) {
      console.log(
        `${summary.cohortName.padEnd(20)} | ${summary.repositoryCount
          .toString()
          .padStart(5)} repos | Avg Weight: ${summary.averageWeight.toFixed(2)}`
      );
    }

    // Print enterprise-specific summaries to console
    console.log("\n=== ENTERPRISE-SPECIFIC SUMMARIES ===");
    for (const enterprise of enterpriseSummaries) {
      console.log(`\n--- ${enterprise.enterpriseName} ---`);
      console.log(`Total Repositories: ${enterprise.totalRepositories}`);
      console.log(`Average Weight: ${enterprise.averageWeight.toFixed(2)}`);
      console.log("Cohort Breakdown:");
      for (const cohort of enterprise.cohortSummaries) {
        console.log(
          `  ${cohort.cohortName.padEnd(18)} | ${cohort.repositoryCount
            .toString()
            .padStart(5)} repos | Avg Weight: ${cohort.averageWeight.toFixed(
            2
          )}`
        );
      }
    }
  } catch (error) {
    console.error("Error during analysis:", error);
    throw error;
  }
}
