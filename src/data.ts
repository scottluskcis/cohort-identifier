import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { RepositoryAnalysis } from "./types.js";

/**
 * Generic function to read and parse CSV files
 * @param filePath - Path to the CSV file
 * @returns Array of parsed CSV rows
 */
function readCsvFile<T>(filePath: string): T[] {
  try {
    let fileContent = readFileSync(filePath, "utf-8");

    // Remove BOM if present
    if (fileContent.charCodeAt(0) === 0xfeff) {
      fileContent = fileContent.slice(1);
    }

    const records = parse(fileContent, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true,
    });

    return records as T[];
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}: ${error}`);
    throw error;
  }
}

/**
 * Reads the unified repository analysis data from CSV file
 * @param filePath - Path to the repository_analysis_all.csv file
 * @returns Array of RepositoryAnalysis objects
 */
export function readRepositoryAnalysis(
  filePath: string = "data/repository_analysis_all.csv"
): RepositoryAnalysis[] {
  console.log(`Reading repository analysis data from: ${filePath}`);
  const data = readCsvFile<RepositoryAnalysis>(filePath);
  console.log(`Loaded ${data.length} repository records`);
  return data;
}

/**
 * Interface for the loaded data (simplified for single file approach)
 */
export interface LoadedData {
  repositories: RepositoryAnalysis[];
}

/**
 * Loads all data from the single CSV file
 * @param filePath - Optional custom path to the CSV file
 * @returns Object containing loaded repository data
 */
export function loadData(filePath?: string): LoadedData {
  try {
    const repositories = readRepositoryAnalysis(filePath);

    return {
      repositories,
    };
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
}
