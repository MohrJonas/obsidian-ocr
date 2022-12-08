import {basename, dirname, join} from "path";
import File from "../File";
import SettingsManager from "../Settings";
import {globby} from "globby";
import normalizePath from "normalize-path";
import {FileSystemAdapter} from "obsidian";
import DBManager from "../db/DBManager";
import {unlink} from "fs/promises";
import Transcript from "../hocr/Transcript";
import Page from "../hocr/Page";
import ObsidianOCRPlugin from "../Main";

/**
 * Convert a path to a file to the path of the associated json file
 * @param filePath the path of the file, can be either relative or absolute
 * @return the json file path. Depending on whether @param filePath is relative or absolute, so is the return value
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
 * @return true if the file is valid, otherwise false
 */
export function isFileValid(file: File): boolean {
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
 * @return
 */
export function getFileType(file: File): FILE_TYPE {
	if (file.extension == "pdf") return FILE_TYPE.PDF;
	else return FILE_TYPE.IMAGE;
}

/**
 * Find all ocr-json files in the vault
 * @return A list of all absolute filepaths of the ocr-json files
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
 * @return boolean
 */
export function isFileOCRable(file: File): boolean {
	return isFileValid(file) && !DBManager.doesTranscriptWithPathExist(file.vaultRelativePath);
}

/**
 * Migrate a file from the old json format to the new sqlite database
 * @param file The json file to migrate
 * */
export async function migrateToDB(file: File) {
	ObsidianOCRPlugin.logger.info(`Migrating file ${file.vaultRelativePath} to DB`);
	await DBManager.insertTranscript(file.vaultRelativePath, (await Transcript.load(file.absPath)).children as Array<Page>);
	await unlink(file.absPath);
}