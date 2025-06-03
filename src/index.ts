/**
 * Main entry point for the cohort-identifier application
 */

export function main(): void {
  console.log("Welcome to cohort-identifier!");
  console.log("This is a TypeScript ESM project.");
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
