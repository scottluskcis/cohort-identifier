import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import {
  AllAnalysisDetails,
  PackageDetail,
  CodespaceDetail,
  AnalysisDetails,
  MacOsRunnerDetail,
} from "./types.js";

/**
 * Generic function to read and parse CSV files
 * @param filePath - Path to the CSV file
 * @returns Array of parsed CSV rows
 */
function readCsvFile<T>(filePath: string): T[] {
  try {
    const fileContent = readFileSync(filePath, "utf-8");
    const records = parse(fileContent, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true,
    });

    return records as T[];
  } catch (error) {
    console.error(`Error reading CSV file: ${error}`);
    throw error;
  }
}

/**
 * Reads GHEC analysis data from CSV file
 * @param filePath - Path to the ghec-analysis.csv file
 * @returns Array of AllAnalysisDetails objects
 */
export function readGhecAnalysis(
  filePath: string = "data/ghec-analysis.csv"
): AllAnalysisDetails[] {
  return readCsvFile<AllAnalysisDetails>(filePath);
}

/**
 * Reads package details from CSV file
 * @param filePath - Path to the maven-packages.csv file
 * @returns Array of PackageDetail objects
 */
export function readPackageDetail(
  filePath: string = "data/maven-packages.csv"
): PackageDetail[] {
  return readCsvFile<PackageDetail>(filePath);
}

/**
 * Reads codespaces usage data from CSV file
 * @param filePath - Path to the codespaces-usage.csv file
 * @returns Array of CodespaceDetail objects
 */
export function readCodespacesDetail(
  filePath: string = "data/codespaces-usage.csv"
): CodespaceDetail[] {
  return readCsvFile<CodespaceDetail>(filePath);
}

/**
 * Reads analysis formatted data from CSV file
 * @param filePath - Path to the combined-formatted-analysis.csv file
 * @returns Array of AnalysisDetails objects
 */
export function readAnalysisFormatted(
  filePath: string = "data/combined-formatted-analysis.csv"
): AnalysisDetails[] {
  return readCsvFile<AnalysisDetails>(filePath);
}

/**
 * Reads macOS runner details from CSV file
 * @param filePath - Path to the macos-runners.csv file
 * @returns Array of MacOsRunnerDetail objects
 */
export function readMacOsRunnerDetail(
  filePath: string = "data/macos-runners.csv"
): MacOsRunnerDetail[] {
  return readCsvFile<MacOsRunnerDetail>(filePath);
}

/**
 * Interface for the combined data object
 */
export interface LoadedData {
  analysisDetails: AllAnalysisDetails[];
  packageDetails: PackageDetail[];
  codespaceDetails: CodespaceDetail[];
  analysisFormatted: AnalysisDetails[];
  macOsRunnerDetails: MacOsRunnerDetail[];
}

/**
 * Loads all data from CSV files
 * @returns Object containing all loaded data
 */
export function loadData(): LoadedData {
  try {
    const analysisDetails = readGhecAnalysis();
    const packageDetails = readPackageDetail();
    const codespaceDetails = readCodespacesDetail();
    const analysisFormatted = readAnalysisFormatted();
    const macOsRunnerDetails = readMacOsRunnerDetail();

    return {
      analysisDetails,
      packageDetails,
      codespaceDetails,
      analysisFormatted,
      macOsRunnerDetails,
    };
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
}
