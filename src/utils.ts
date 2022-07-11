import { readFileSync } from "fs";
import { globby } from "globby";
import { TFile } from "obsidian";
import { basename, dirname, join } from "path";
import { PDFDocument } from "pdf-lib";


/**
 * Convert a path relative to the vault it's in to an absolute path
 * @param vaultPath a path of a file in the vault 
 * @returns the absolute path of the file
 */
export function vaultPathToAbs(vaultPath: string): string {
	return join(this.app.vault.adapter.basePath, vaultPath);
}

/**
 * Convert a path to a file to the path of the associated json file
 * @param filePath the path of the file, can be either relative or absolute
 * @returns the json file path. Depending on whether @param filePath is relative or absolute, so is the return value
 */
export function filePathToJsonPath(filePath: string): string {
	return join(dirname(filePath), `.${basename(filePath)}.json`);
}

/**
 * Get the file ending of the given TFile or path
 * @param file A TFile or path to get the ending of
 * @returns The file-ending of the file or path, without the dot, f.e. png or undefined if the file has no extension
 */
export function getFileEnding(file: TFile | string): string | undefined {
	if(typeof file == "string") return file.split(".").pop();
	else return file.path.split(".").pop();
}

/**
 * Check if the file is valid for OCR
 * @param file the file to check
 * @returns true if the file is valid, otherwise false
 */
export async function isFileValid(file: TFile): Promise<boolean> {
	const fileEnding = getFileEnding(file);
	if (!fileEnding || !["pdf", "png", "jpg", "jpeg"].contains(fileEnding)) return false;
	if(fileEnding == "pdf") {
		const document = await PDFDocument.load(readFileSync(vaultPathToAbs(file.path)), {
			ignoreEncryption: true
		});
		if (document.isEncrypted || document.getPageCount() == 0) return false;
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
export function getFileType(file: TFile): FILE_TYPE {
	if(getFileEnding(file) == "pdf") return FILE_TYPE.PDF;
	else return FILE_TYPE.IMAGE;
}

/**
 * Find all ocr-json files in the vault
 * @returns A list of all absolute filepaths of the ocr-json files
 */
export async function getAllJsonFiles(): Promise<Array<string>> {
	return (await globby([`${this.app.vault.adapter.basePath}/**/*.json`], { dot: true, ignore: [`${this.app.vault.adapter.basePath}/.obsidian/**/*`] }))
		.filter((path) => { return getFileEnding(path) == "json" && "ocr_version" in JSON.parse(readFileSync(path).toString()); });
}