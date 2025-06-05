/**
 * Main entry point for the cohort-identifier application
 */

import { loadData } from "./data.js";

/**
 * Main entry point for the cohort-identifier application
 */

export function main(): void {
  // console.log("Welcome to cohort-identifier!");
  // console.log("This is a TypeScript ESM project.");

  // Load all CSV data
  try {
    const data = loadData();
    console.log("Data loaded successfully:");
    console.log(`- Analysis Details: ${data.analysisDetails.length} records`);
    console.log(`- Package Details: ${data.packageDetails.length} records`);
    console.log(`- Codespace Details: ${data.codespaceDetails.length} records`);
    console.log(
      `- Analysis Formatted: ${data.analysisFormatted.length} records`
    );
  } catch (error) {
    console.error("Failed to load data:", error);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
