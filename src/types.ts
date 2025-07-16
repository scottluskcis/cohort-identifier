/**
 * Type definitions for the cohort-identifier application
 * Refactored to work with a single repository_analysis_all.csv file
 */

/**
 * Interface for the unified repository analysis data from repository_analysis_all.csv
 */
export interface RepositoryAnalysis {
  Enterprise: string;
  Org_Name: string;
  Repo_Name: string;
  isArchived: string;
  has_external_collaborators: string;
  issues_linked_to_projects: string;
  unique_projects_linked_by_issues: string;
  projects_linked_to_repo: string;
  app_installations: string;
  "repository-custom-properties": string;
  "repository-forks": string;
  "repository-rulesets": string;
  watchers: string;
  "repository-code-scanning-analyses": string;
  "repository-webhooks": string;
  "repository-code-scanning-alerts": string;
  "repository-secret-scanning-alerts": string;
  "repository-actions-workflow-runs": string;
  "repository-code-scanning-default-setup": string;
  "repository-dependabot-alerts": string;
  "repository-packages": string;
  "repository-releases-gt-5gb": string;
  "repository-disk-usage": string;
  "repository-deployments": string;
  "repository-environments": string;
  "git-lfs-objects": string;
  "repository-actions-secrets": string;
  "repository-actions-self-hosted-runners": string;
  "repository-dependabot-secrets": string;
  "repository-actions-variables": string;
  "git-submodules": string;
  "repository-discussions": string;
  "repository-deploy-keys": string;
  "repository-pages-customdomain": string;
  "repository-pinned-issues": string;
  has_unmigratable: string;
  has_maven_packages: string;
  maven_package_count: string;
  has_codespaces: string;
  codespace_count: string;
  codespace_user_count: string;
  has_macos_runners: string;
}

/**
 * Interface for cohort analysis results
 */
export interface CohortDetail {
  repositoryName: string;
  organizationName: string;
  enterpriseName: string;
  cohort: string;
  cohortWeight: number;
  migrationWeight: number;
  migrationReasons: string;
  summary: string;
  featureGapCount: number;
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
}

/**
 * Interface for cohort analysis summary
 */
export interface CohortSummary {
  cohortName: string;
  repositoryCount: number;
  totalWeight: number;
  averageWeight: number;
}

/**
 * Interface for enterprise-specific cohort analysis summary
 */
export interface EnterpriseCohortSummary {
  enterpriseName: string;
  cohortSummaries: CohortSummary[];
  totalRepositories: number;
  totalWeight: number;
  averageWeight: number;
}

/**
 * Interface for simple cohort result (for backwards compatibility)
 */
export interface CohortResult {
  repoName: string;
  orgName: string;
  enterpriseName: string;
  cohort: string;
  migrationWeight: number;
  reasons: string[];
  summary: string;
  isArchived: boolean;
}
