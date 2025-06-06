export interface AllAnalysisDetails {
  Org_Name: string;
  Repo_Name: string;
  Is_Empty: string;
  Last_Push: string;
  Last_Update: string;
  isFork: string;
  isArchived: string;
  Repo_Size_mb: string;
  Record_Count: string;
  Collaborator_Count: string;
  Protected_Branch_Count: string;
  PR_Review_Count: string;
  Milestone_Count: string;
  Issue_Count: string;
  PR_Count: string;
  PR_Review_Comment_Count: string;
  Commit_Comment_Count: string;
  Issue_Comment_Count: string;
  Issue_Event_Count: string;
  Release_Count: string;
  Project_Count: string;
  Branch_Count: string;
  Tag_Count: string;
  Discussion_Count: string;
  Has_Wiki: string;
  Full_URL: string;
  Migration_Issue: string;
  Created: string;
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
  "repository-releases": string;
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
}

export interface PackageDetail {
  "Package Name": string;
  "Package Type": string;
  "Repo Name": string;
  "Repo Archived": string;
  "Repo Visibility": string;
  "Downloads Count": string;
  "Last Published": string;
  "Latest Version": string;
  "Latest Version File Size (bytes)": string;
  "Latest Version File Size": string;
  "Total All Versions": string;
  "Total All Asset Count": string;
  "Total All Size (bytes)": string;
  "Total All Size": string;
}

export interface CodespaceDetail {
  "Repository Name": string;
  "Codespace Name": string;
  State: string;
  "Machine Name": string;
  "CPU Size": string;
  "Memory Size (GB)": string;
  "Storage (GB)": string;
  "Billable Owner": string;
  Owner: string;
  "Last Used At": string;
  "Created At": string;
}

export interface AnalysisDetails {
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
}

export interface MacOsRunnerDetail {
  Workflow: string;
  "Source repository": string;
  "Total minutes": string;
  "Workflow runs": string;
  Jobs: string;
  "Runner type": string;
  "Runtime OS": string;
}
