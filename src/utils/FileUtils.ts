import {basename, dirname, join} from "path";
import File from "../File";
import SettingsManager from "../Settings";
import {PDFDocument} from "pdf-lib";
import {readFileSync} from "fs";
import {globby} from "globby";
import normalizePath from "normalize-path";
import ObsidianOCRPlugin from "../Main";

/**
 * Convert a path to a file to the path of the associated json file
 * @param filePath the path of the file, can be either relative or absolute
 * @returns the json file path. Depending on whether @param filePath is relative or absolute, so is the return value
 */
export function filePathToJsonPath(filePath: string): string {
	return join(dirname(filePath), `.${basename(filePath)}.json`);
}

export function filePathToAnnotationPath(filePath: string): string {
	return join(dirname(filePath), `.${basename(filePath)}`);
}

/**
 * Check if the file is valid for OCR
 * @param file the file to check
 * @returns true if the file is valid, otherwise false
 */
export async function isFileValid(file: File): Promise<boolean> {
	if (["png", "jpg", "jpeg"].contains(file.extension) && !SettingsManager.currentSettings.ocrImage) return false;
	if (file.extension == "pdf") {
		if (!SettingsManager.currentSettings.ocrPDF) return false;
		const document = await PDFDocument.load(readFileSync(file.absPath), {
			ignoreEncryption: true
		});
		if (/*document.isEncrypted || */document.getPageCount() == 0) return false;
	}
	return true;
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
export async function getAllJsonFiles(): Promise<Array<string>> {
	return (await globby("**/.*.json", {
		absolute: true,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		cwd: normalizePath(app.vault.adapter.basePath),
		ignore: [".obsidian/**/*"],
		dot: true
	}));
}
