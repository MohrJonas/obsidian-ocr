import File from "../File";
import {Settings} from "../Settings";
import {globby} from "globby";
import DBManager from "../db/DBManager";
import {TFolder} from "obsidian";
import ObsidianOCRPlugin from "../Main";


/**
 * Check if the file is valid for OCR.
 * Being valid for OCR means it has the correct extension (png, jpg, jpeg, pdf) AND processing images / pdfs is enabled in the settings
 * @param file the file to check
 * @param settings the settings to lookup in, whether pdf and image ocr is enabled
 * @return true if the file is valid, otherwise false
 */
export function isFileValid(file: File, settings: Settings): boolean {
	ObsidianOCRPlugin.logger.info(`Checking if file ${file.vaultRelativePath} with settings ${JSON.stringify(settings)} is valid`);
	switch (getFileType(file)) {
	case FILE_TYPE.IMAGE: {
		ObsidianOCRPlugin.logger.info(`File ${file.vaultRelativePath} is an image`);
		ObsidianOCRPlugin.logger.info(`File ${file.vaultRelativePath} ${settings.ocrImage ? "is" : "isn't"} valid`);
		return settings.ocrImage;
	}
	case FILE_TYPE.PDF: {
		ObsidianOCRPlugin.logger.info(`File ${file.vaultRelativePath} is a pdf`);
		ObsidianOCRPlugin.logger.info(`File ${file.vaultRelativePath} ${settings.ocrPDF ? "is" : "isn't"} valid`);
		return settings.ocrPDF;
	}
	default: {
		ObsidianOCRPlugin.logger.info(`File ${file.vaultRelativePath} is neither an image nor a pdf, file isn't valid`);
		return false;
	}
	}
}

export enum FILE_TYPE {
    IMAGE,
    PDF,
	OTHER
}

/**
 * Convert the filetype to an enum for convenience
 * @param file The file whose type should be fetched
 * @return FILE_TYPE.PDF, if the file has a ".pdf" extension, FILE_TYPE.IMAGE if the file has an image extensions, FILE_TYPE.OTHER otherwise
 * @description This method will return FILE_TYPE.IMAGE for all file-extensions, except ".pdf".
 * @description This  method won't ever return anything from a file with no extension,
 *                because an exception will be thrown in the constructor of the File argument
 */
export function getFileType(file: File): FILE_TYPE {
	ObsidianOCRPlugin.logger.info(`Getting type of file ${file.vaultRelativePath}`);
	if (file.extension == "pdf") {
		ObsidianOCRPlugin.logger.info(`File ${file.vaultRelativePath} is a pdf`);
		return FILE_TYPE.PDF;
	}
	if(["bmp", "pnm", "png", "jfif", "jpg", "jpeg", "tiff"].contains(file.extension)) {
		ObsidianOCRPlugin.logger.info(`File ${file.vaultRelativePath} is an image`);
		return FILE_TYPE.IMAGE;
	}
	ObsidianOCRPlugin.logger.info(`File ${file.vaultRelativePath} is other`);
	return FILE_TYPE.OTHER;
}

/**
 * Find all ocr-json files in the vault
 * @param cwd The working directory to fetch the json files in
 * @return A list of all absolute file-paths of the ocr-json files
 */
export async function getAllJsonFiles(cwd: string): Promise<Array<File>> {
	ObsidianOCRPlugin.logger.info(`Getting all json files in ${cwd}`);
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
 * Check if the file is in an ignored folder
 * @param file The file to check
 * @return true, if the file is in an ignored folder, false otherwise
 * */
export function isFileInIgnoredFolder(file: File | TFolder): boolean {
	const path = (file instanceof File) ? file.vaultRelativePath : file.path;
	ObsidianOCRPlugin.logger.info(`Checking if file ${path} is in an ignored folder`);
	return DBManager.getAllIgnoredFolders().filter((result) => {
		return path.contains(result.path) && path != result.path;
	}).length != 0;
}

/**
 * Check whether this file should be OCRed right now
 * It checks, if the file is valid (meaning correct extension) AND if its transcript is already present in the database
 * @param file The file to check
 * @param settings The settings to pass to {@link isFileValid}
 * @return true, if the file is valid for OCR, false otherwise
 */
export function shouldFileBeOCRed(file: File, settings: Settings): boolean {
	ObsidianOCRPlugin.logger.info(`Checking if file ${file.vaultRelativePath} with settings ${settings} should be OCRed`);
	return isFileValid(file, settings)
        && !DBManager.doesTranscriptWithPathExist(file.vaultRelativePath)
		&& !isFileInIgnoredFolder(file);
}