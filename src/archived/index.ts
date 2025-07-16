/**
 * Main entry point for the cohort-identifier application
 */

import { loadData } from "./data.js";
import { runCohortAnalysis } from "./analysis.js";

/**
 * Main entry point for the cohort-identifier application
 */
export function main(): void {
  console.log("Welcome to cohort-identifier!");
  console.log(
    "This tool analyzes GitHub repositories and assigns them to migration cohorts.\n"
  );

  // Load and display data summary
  try {
    const data = loadData();
    console.log("Data loaded successfully:");
    console.log(`- Analysis Details: ${data.analysisDetails.length} records`);
    console.log(`- Package Details: ${data.packageDetails.length} records`);
    console.log(`- Codespace Details: ${data.codespaceDetails.length} records`);
    console.log(
      `- Analysis Formatted: ${data.analysisFormatted.length} records`
    );
    console.log(
      `- macOS Runner Details: ${data.macOsRunnerDetails.length} records`
    );
    console.log("");

    // Run the cohort analysis
    runCohortAnalysis(data);
  } catch (error) {
    console.error("Failed to run analysis:", error);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
