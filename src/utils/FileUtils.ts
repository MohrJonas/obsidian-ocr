import File from "../File";
import {Settings} from "../Settings";
import {globby} from "globby";
import DBManager from "../db/DBManager";


/**
 * Check if the file is valid for OCR.
 * Being valid for OCR means it has the correct extension (png, jpg, jpeg, pdf) AND processing images / pdfs is enabled in the settings
 * @param file the file to check
 * @param settings the settings to lookup in, whether pdf and image ocr is enabled
 * @return true if the file is valid, otherwise false
 */
export function isFileValid(file: File, settings: Settings): boolean {
	if (["png", "jpg", "jpeg"].contains(file.extension))
		return settings.ocrImage;
	if (file.extension == "pdf")
		return settings.ocrPDF;
	return false;
}

export enum FILE_TYPE {
    IMAGE,
    PDF
}

/**
 * Convert the filetype to an enum for convenience
 * @param file The file whose type should be fetched
 * @return FILE_TYPE.PDF, if the file has a ".pdf" extension, FILE_TYPE.IMAGE otherwise
 * @description This method will return FILE_TYPE.IMAGE for all file-extensions, except ".pdf".
 * @description This  method won't ever return anything from a file with no extension,
 *                because an exception will be thrown in the constructor of the File
 */
export function getFileType(file: File): FILE_TYPE {
	if (file.extension == "pdf") return FILE_TYPE.PDF;
	else return FILE_TYPE.IMAGE;
}

/**
 * Find all ocr-json files in the vault
 * @param cwd The working directory to fetch the json files in
 * @return A list of all absolute file-paths of the ocr-json files
 */
export async function getAllJsonFiles(cwd: string): Promise<Array<File>> {
	return (await globby("**/.*.ocr.json", {
		absolute: false,
		onlyFiles: true,
		cwd: cwd,
		ignore: [".obsidian/**/*"],
		dot: true
	})).map((filePath) => {
		return File.fromVaultRelativePath(filePath);
	});
}

/**
 * Check whether this file should be OCRed right now
 * It checks, if the file is valid (meaning correct extension) AND if its transcript is already present in the database
 * @param file The file to check
 * @param settings The settings to pass to {@link isFileValid}
 * @return true, if the file is valid for OCR, false otherwise
 */
export function shouldFileBeOCRed(file: File, settings: Settings): boolean {
	return isFileValid(file, settings)
        && !DBManager.doesTranscriptWithPathExist(file.vaultRelativePath);
}