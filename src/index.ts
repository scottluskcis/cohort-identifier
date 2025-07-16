/**
 * Main entry point for the cohort-identifier application
 * Refactored to work with a single repository_analysis_all.csv file
 */

import { loadData } from "./data.js";
import { runCohortAnalysis } from "./analysis.js";

/**
 * Main entry point for the cohort-identifier application
 */
export function main(csvFilePath?: string): void {
  console.log("Welcome to cohort-identifier!");
  console.log(
    "This tool analyzes GitHub repositories and assigns them to migration cohorts.\n"
  );

  // Load and display data summary
  try {
    const data = loadData(csvFilePath);
    console.log("Data loaded successfully:");
    console.log(`- Repository Analysis: ${data.repositories.length} records`);
    console.log("");

    // Display sample of data for verification
    if (data.repositories.length > 0) {
      const sampleRepo = data.repositories[0];
      if (sampleRepo) {
        console.log("Sample repository data:");
        console.log(`- Enterprise: ${sampleRepo.Enterprise}`);
        console.log(`- Organization: ${sampleRepo.Org_Name}`);
        console.log(`- Repository: ${sampleRepo.Repo_Name}`);
        console.log(`- Has Maven Packages: ${sampleRepo.has_maven_packages}`);
        console.log(`- Has Codespaces: ${sampleRepo.has_codespaces}`);
        console.log(`- Has macOS Runners: ${sampleRepo.has_macos_runners}`);
        console.log(`- Is Archived: ${sampleRepo.isArchived}`);
        console.log("");
      }
    }

    // Run the cohort analysis
    runCohortAnalysis(data);
  } catch (error) {
    console.error("Failed to run analysis:", error);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check if a custom CSV file path was provided as a command line argument
  const customFilePath = process.argv[2];
  main(customFilePath);
}
