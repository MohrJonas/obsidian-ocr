import { existsSync, readFileSync, unlinkSync } from "fs";
import { globby } from "globby";
import { App, Plugin, TFile, Vault } from "obsidian";
import { basename, dirname, join } from "path";
import { PDFDocument } from "pdf-lib";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import which from "which";
import { convertPdfToPng } from "./convert";
import Hocr from "./hocr/hocr";
import HocrPage from "./hocr/hocr-page";
import { performOCR, stringToDoc } from "./ocr";
import SearchModal from "./search-modal";
import { StatusBar } from "./status-bar";

/**
 * Convert a path relative to the vault it's in to an absolute path
 * @param vaultPath a path of a file in the vault 
 * @returns the absolute path of the file
 */
export function vaultPathToAbs(vault: Vault, vaultPath: string): string {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	return join(vault.adapter.basePath, vaultPath);
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
	if (typeof file == "string") return file.split(".").pop();
	else return file.path.split(".").pop();
}

/**
 * Check if the file is valid for OCR
 * @param file the file to check
 * @returns true if the file is valid, otherwise false
 */
export async function isFileValid(vault: Vault, file: TFile): Promise<boolean> {
	const fileEnding = getFileEnding(file);
	if (!fileEnding || !["pdf", "png", "jpg", "jpeg"].contains(fileEnding)) return false;
	if (fileEnding == "pdf") {
		const document = await PDFDocument.load(readFileSync(vaultPathToAbs(vault, file.path)), {
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
	if (getFileEnding(file) == "pdf") return FILE_TYPE.PDF;
	else return FILE_TYPE.IMAGE;
}

/**
 * Find all ocr-json files in the vault
 * @returns A list of all absolute filepaths of the ocr-json files
 */
export async function getAllJsonFiles(vault: Vault): Promise<Array<string>> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	return (await globby([`${vault.adapter.basePath}/**/*.json`], { dot: true, ignore: [`${vault.adapter.basePath}/.obsidian/**/*`] }))
		.filter((path) => { return getFileEnding(path) == "json" && "ocr_version" in JSON.parse(readFileSync(path).toString()); });
}

/**
 * Remove all json-files from the vault
 */
export async function removeAllJsonFiles(vault: Vault) {
	(await getAllJsonFiles(vault)).forEach((jsonFile) => { unlinkSync(jsonFile); });
}

/**
 * Check if the given executable exists on the PATH
 * @param name the name of the executable to check
 * @returns true if it exists, false otherwise
 */
export async function doesProgramExist(name: string): Promise<boolean> {
	try {
		await which(name);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Open the search modal
 */
export function openSearchModal(vault: Vault, app: App, plugin: Plugin) {
	getAllJsonFiles(vault).then((jsonFiles) => {
		const hocrs = jsonFiles.map((jsonFile) => { return Hocr.from_JSON(JSON.parse(readFileSync(jsonFile).toString())); });
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		new SearchModal(app, plugin, hocrs).open();
	});
}

/**
 * List all files in the vault
 * @returns A list of TFiles from the vault
 */
export async function listAllFiles(vault: Vault): Promise<Array<TFile>> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	return (await globby("**/*", { cwd: vault.adapter.basePath, absolute: false, dot: false }))
		.map((filePath) => { return vault.getAbstractFileByPath(filePath) as TFile; });
}

/**
 * Process a File 
 * @param file The file to process
 */
export async function processFile(plugin: Plugin, file: TFile, vault: Vault) {
	if (existsSync(vaultPathToAbs(vault, filePathToJsonPath(file.path))) || !(await isFileValid(vault, file as TFile))) return;
	StatusBar.addIndexingFile(file);
	switch (getFileType(file as TFile)) {
	case FILE_TYPE.PDF: {
		const imagePaths = await convertPdfToPng(vault, file as TFile);
		performOCR(imagePaths).then((ocrResults) => {
			const hocr = new Hocr(
				file.path,
				plugin.manifest.version,
				ocrResults.map((ocrResult) => { return HocrPage.from_HTML(stringToDoc(ocrResult)); })
			);
			vault.create(filePathToJsonPath(file.path), JSON.stringify(hocr, null, 2));
			StatusBar.removeIndexingFile(file);
		});
		break;
	}
	case FILE_TYPE.IMAGE: {
		performOCR([vaultPathToAbs(vault, file.path)]).then((ocrResults) => {
			const hocr = new Hocr(file.path, plugin.manifest.version, [HocrPage.from_HTML(stringToDoc(ocrResults[0]))]);
			vault.create(filePathToJsonPath(file.path), JSON.stringify(hocr, null, 2));
			StatusBar.removeIndexingFile(file);
		});
		break;
	}
	}
}