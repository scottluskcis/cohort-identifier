import { writeFileSync } from "fs";
import { LoadedData } from "./data.js";
import {
  AllAnalysisDetails,
  PackageDetail,
  CodespaceDetail,
  AnalysisDetails,
  MacOsRunnerDetail,
} from "./types.js";

// =============================================================================
// CONFIGURATION SETTINGS
// =============================================================================

// NOTES
// should we look at and consider GitHub teams as part of this analysis? Will it be useful for grouping or even useful at all?
// only ones using features not available in Proxima are hard blockers
// KNOWN COHORTS - Clean, Migration issues but no feature gap, Proxima Feature Gap Based (break feature gaps into separate cohorts),
// to indicate: some level of combinations too, some may have multi feature gaps

/**
 * Configuration for migration analysis weights and thresholds
 */
const CONFIG = {
  // Weight values for different migration blockers (higher = more complex)
  WEIGHTS: {
    APP_INSTALLATIONS: 10,
    GIT_LFS_OBJECTS: 8, // IGNORE - this is covered now and shouldn't be part of the weight
    PACKAGES: 9,
    PROJECTS: 7,
    CUSTOM_PROPERTIES: 6, // IGNORE - this is covered now and shouldn't be part of the weight
    RULESETS: 6, // IGNORE - this is covered now and shouldn't be part of the weight
    SECRETS: 5,
    ENVIRONMENTS: 4,
    SELF_HOSTED_RUNNERS: 8,
    WEBHOOKS: 3,
    DISCUSSIONS: 2,
    DEPLOY_KEYS: 3,
    PAGES_CUSTOM_DOMAIN: 2,
    RELEASES_LARGE: 7,
    CODESPACES: 6,
    MAVEN_PACKAGES: 8,
    MACOS_RUNNERS: 9,
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
  },
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface CohortResult {
  repoName: string;
  orgName: string;
  cohort: string;
  migrationWeight: number;
  reasons: string[];
  summary: string;
  isArchived: boolean;
}

interface CohortSummary {
  cohortName: string;
  repositoryCount: number;
  totalWeight: number;
  averageWeight: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a repository is archived
 */
function isArchived(repo: AllAnalysisDetails | AnalysisDetails): boolean {
  return repo.isArchived === "true" || repo.isArchived === "1";
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
 * Check if a repository has Maven packages
 */
function hasMavenPackages(
  repoName: string,
  packageDetails: PackageDetail[]
): boolean {
  return packageDetails.some(
    (pkg) =>
      pkg["Repo Name"] === repoName &&
      pkg["Package Type"]?.toLowerCase().includes("maven")
  );
}

/**
 * Check if a repository has Codespaces usage
 */
function hasCodespaces(
  repoName: string,
  codespaceDetails: CodespaceDetail[]
): boolean {
  return codespaceDetails.some((cs) => cs["Repository Name"] === repoName);
}

/**
 * Check if a repository has macOS runners usage
 */
function hasMacOsRunners(
  repoName: string,
  macOsRunnerDetails: MacOsRunnerDetail[]
): boolean {
  return macOsRunnerDetails.some((runner) => runner["Source repository"] === repoName);
}

/**
 * Calculate migration weight based on repository features
 */
function calculateMigrationWeight(
  repo: AllAnalysisDetails | AnalysisDetails
): number {
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

  // Check for large releases (only in AnalysisDetails)
  if (
    "repository-releases-gt-5gb" in repo &&
    toNumber(repo["repository-releases-gt-5gb"]) > 0
  ) {
    weight += CONFIG.WEIGHTS.RELEASES_LARGE;
  }

  return weight;
}

/**
 * Get detailed reasons for migration complexity
 */
function getMigrationReasons(
  repo: AllAnalysisDetails | AnalysisDetails
): string[] {
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

  if (
    "repository-releases-gt-5gb" in repo &&
    toNumber(repo["repository-releases-gt-5gb"]) > 0
  ) {
    reasons.push(`Large releases >5GB (${repo["repository-releases-gt-5gb"]})`);
  }

  return reasons;
}

/**
 * Determine cohort assignment based on repository characteristics
 */
function assignCohort(
  repo: AllAnalysisDetails | AnalysisDetails,
  migrationWeight: number,
  hasMaven: boolean,
  hasCodespace: boolean,
  hasMacOs: boolean
): string {
  // Archived repositories get their own cohort
  if (isArchived(repo)) {
    return "ARCHIVED";
  }

  // macOS runners get separate cohort if enabled
  if (CONFIG.FEATURES.SEPARATE_MACOS_COHORT && hasMacOs) {
    return "MACOS_RUNNERS";
  }

  // Maven packages get separate cohort if enabled
  if (CONFIG.FEATURES.SEPARATE_MAVEN_COHORT && hasMaven) {
    return "MAVEN_PACKAGES";
  }

  // Codespaces get separate cohort if enabled
  if (CONFIG.FEATURES.SEPARATE_CODESPACE_COHORT && hasCodespace) {
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
 * Analyze all repositories and assign them to cohorts
 */
export function analyzeRepositories(data: LoadedData): CohortResult[] {
  const results: CohortResult[] = [];

  // Use analysisFormatted if available, otherwise fall back to analysisDetails
  const repositories =
    data.analysisFormatted.length > 0
      ? data.analysisFormatted
      : data.analysisDetails;

  for (const repo of repositories) {
    const migrationWeight = calculateMigrationWeight(repo);
    const migrationReasons = getMigrationReasons(repo);
    const hasMaven = hasMavenPackages(repo.Repo_Name, data.packageDetails);
    const hasCodespace = hasCodespaces(repo.Repo_Name, data.codespaceDetails);
    const hasMacOs = hasMacOsRunners(repo.Repo_Name, data.macOsRunnerDetails);

    // Add Maven, Codespaces, and macOS runners to reasons if present
    const allReasons = [...migrationReasons];
    if (hasMaven) {
      allReasons.push(`Maven packages detected`);
    }
    if (hasCodespace) {
      allReasons.push(`Codespaces usage detected`);
    }
    if (hasMacOs) {
      allReasons.push(`macOS runners detected`);
    }

    const cohort = assignCohort(repo, migrationWeight, hasMaven, hasCodespace, hasMacOs);
    const summary = generateSummary(cohort, allReasons, migrationWeight);

    results.push({
      repoName: repo.Repo_Name,
      orgName: repo.Org_Name,
      cohort,
      migrationWeight,
      reasons: allReasons,
      summary,
      isArchived: isArchived(repo),
    });
  }

  return results;
}

/**
 * Generate summary statistics for each cohort
 */
export function generateCohortSummaries(
  results: CohortResult[]
): CohortSummary[] {
  const cohortMap = new Map<string, CohortResult[]>();

  // Group results by cohort
  for (const result of results) {
    if (!cohortMap.has(result.cohort)) {
      cohortMap.set(result.cohort, []);
    }
    cohortMap.get(result.cohort)!.push(result);
  }

  // Generate summaries
  const summaries: CohortSummary[] = [];
  for (const [cohortName, cohortResults] of cohortMap) {
    const totalWeight = cohortResults.reduce(
      (sum, r) => sum + r.migrationWeight,
      0
    );
    summaries.push({
      cohortName,
      repositoryCount: cohortResults.length,
      totalWeight,
      averageWeight:
        cohortResults.length > 0 ? totalWeight / cohortResults.length : 0,
    });
  }

  // Sort by average weight descending (most complex first)
  return summaries.sort((a, b) => b.averageWeight - a.averageWeight);
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
    csv += `${summary.cohortName},${summary.repositoryCount},${
      summary.totalWeight
    },${summary.averageWeight.toFixed(2)}\n`;
  }

  csv += "\n=== REPOSITORY DETAILS ===\n";
  csv +=
    "Repository Name,Organization,Cohort,Migration Weight,Migration Reasons,Summary\n";

  // Sort results by cohort, then by weight descending
  const sortedResults = results.sort((a, b) => {
    if (a.cohort !== b.cohort) {
      return a.cohort.localeCompare(b.cohort);
    }
    return b.migrationWeight - a.migrationWeight;
  });

  for (const result of sortedResults) {
    const reasons =
      result.reasons.length > 0 ? result.reasons.join("; ") : "None";
    const escapedSummary = result.summary.replace(/"/g, '""');
    csv += `"${result.repoName}","${result.orgName}","${result.cohort}",${result.migrationWeight},"${reasons}","${escapedSummary}"\n`;
  }

  return csv;
}

/**
 * Main analysis function that orchestrates the entire process
 */
export function runCohortAnalysis(data: LoadedData): void {
  console.log("Starting cohort analysis...");

  try {
    // Analyze repositories
    console.log("Analyzing repositories...");
    const results = analyzeRepositories(data);
    console.log(`Analyzed ${results.length} repositories`);

    // Generate summaries
    console.log("Generating cohort summaries...");
    const summaries = generateCohortSummaries(results);

    // Export to CSV
    console.log("Exporting results...");
    const csvContent = exportToCsv(results, summaries);

    // Write to file
    const outputPath = "output/cohort-analysis.csv";
    writeFileSync(outputPath, csvContent, "utf-8");
    console.log(`Results exported to ${outputPath}`);

    // Print summary to console
    console.log("\n=== COHORT SUMMARY ===");
    for (const summary of summaries) {
      console.log(
        `${summary.cohortName}: ${
          summary.repositoryCount
        } repos (avg weight: ${summary.averageWeight.toFixed(2)})`
      );
    }
  } catch (error) {
    console.error("Error during analysis:", error);
    throw error;
  }
}
