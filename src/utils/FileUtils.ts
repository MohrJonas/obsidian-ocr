import {basename, dirname, join} from "path";
import File from "../File";
import SettingsManager from "../Settings";
import {existsSync} from "fs";
import {globby} from "globby";
import normalizePath from "normalize-path";
import {FileSystemAdapter} from "obsidian";

/**
 * Convert a path to a file to the path of the associated json file
 * @param filePath the path of the file, can be either relative or absolute
 * @returns the json file path. Depending on whether @param filePath is relative or absolute, so is the return value
 */
export function filePathToJsonPath(filePath: string): string {
	return join(dirname(filePath), `.${basename(filePath)}.ocr.json`);
}

export function filePathToAnnotationPath(filePath: string): string {
	return join(dirname(filePath), `.${basename(filePath)}.ocr`);
}

/**
 * Check if the file is valid for OCR
 * @param file the file to check
 * @returns true if the file is valid, otherwise false
 */
export async function isFileValid(file: File): Promise<boolean> {
	if (["png", "jpg", "jpeg"].contains(file.extension))
		return SettingsManager.currentSettings.ocrImage;
	if (file.extension == "pdf")
		return SettingsManager.currentSettings.ocrPDF;
	return false;
}

export enum FILE_TYPE {
    IMAGE,
    PDF
}

/**
 * Convert the filetype to an enum for convenience
 * @param file
 * @returns
 */
export function getFileType(file: File): FILE_TYPE {
	if (file.extension == "pdf") return FILE_TYPE.PDF;
	else return FILE_TYPE.IMAGE;
}

/**
 * Find all ocr-json files in the vault
 * @returns A list of all absolute filepaths of the ocr-json files
 */
export async function getAllJsonFiles(): Promise<Array<File>> {
	return (await globby("**/.*.ocr.json", {
		absolute: false,
		onlyFiles: true,
		cwd: normalizePath((app.vault.adapter as FileSystemAdapter).getBasePath()),
		ignore: [".obsidian/**/*"],
		dot: true
	})).map((filePath) => {
		return File.fromVaultRelativePath(filePath);
	});
}

/**
 * Check whether this is a file to process via OCR
 * @param file
 * @returns boolean
 */
export async function isFileOCRable(file: File): Promise<boolean> {
	return (file.jsonFile != undefined && !existsSync(file.jsonFile.absPath) && (await isFileValid(file)));
}