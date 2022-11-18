import File from "../File";
import Transcript from "../hocr/Transcript";
import {FILE_TYPE, getAllJsonFiles, getFileType, isFileOCRable, isFileValid} from "./FileUtils";
import {StatusBar} from "../StatusBar";
import {convertPdfToPng} from "../Convert";
import OCRProviderManager from "../ocr/OCRProviderManager";
import SettingsManager from "../Settings";
import ObsidianOCRPlugin from "../Main";
import {unlink} from "fs/promises";
import {OcrQueue} from "./OcrQueue";

/**
 * Remove all json-files from the vault
 */
export async function removeAllJsonFiles() {
	StatusBar.addStatusDeleting();
	for (const jsonFile of (await getAllJsonFiles())) {
		unlink(jsonFile.absPath);
	}
	StatusBar.removeStatusDeleting();
}

/**
 * Process a File
 * @param file The file to process
 */
export async function processFile(file: File): Promise<Transcript | undefined> {
	switch (getFileType(file)) {
	case FILE_TYPE.PDF: {
		const imagePaths = await convertPdfToPng(file);
		const ocrResults = await OCRProviderManager.getByName(SettingsManager.currentSettings.ocrProviderName).performOCR(imagePaths);
		const transcript = new Transcript(
			ObsidianOCRPlugin.plugin.manifest.version,
			file.vaultRelativePath,
			ocrResults.map((result) => {
				return new DOMParser().parseFromString(result, "text/html");
			}),
			imagePaths
		);
		StatusBar.removeIndexingFile(file);
		return transcript;
	}
	case FILE_TYPE.IMAGE: {
		const ocrResults = await OCRProviderManager.getByName(SettingsManager.currentSettings.ocrProviderName).performOCR([file.absPath]);
		const transcript = new Transcript(
			ObsidianOCRPlugin.plugin.manifest.version,
			file.vaultRelativePath,
			[new DOMParser().parseFromString(ocrResults[0], "text/html")],
			[file.absPath]
		);
		StatusBar.removeIndexingFile(file);
		return transcript;
	}
	default:
		return undefined;
	}
}

export function processVault() {
	app.vault.getFiles()
		.map((tFile) => {
			return File.fromFile(tFile);
		})
		.filter(async (file) => {
			return await isFileValid(file) && await isFileOCRable(file);
		})
		.forEach(async (file) => {
			await OcrQueue.enqueueFile(file);
		});
}
