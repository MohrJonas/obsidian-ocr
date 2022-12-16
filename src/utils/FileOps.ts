import File from "../File";
import Transcript from "../hocr/Transcript";
import {FILE_TYPE, getAllJsonFiles, getFileType, shouldFileBeOCRed} from "./FileUtils";
import {StatusBar} from "../StatusBar";
import {convertPdfToPng} from "../Convert";
import OCRProviderManager from "../ocr/OCRProviderManager";
import SettingsManager, {Settings} from "../Settings";
import ObsidianOCRPlugin from "../Main";
import {unlink} from "fs/promises";
import {OcrQueue} from "./OcrQueue";
import {FileSystemAdapter} from "obsidian";
import DBManager from "../db/DBManager";

/**
 * Remove all json-files from the vault
 */
export async function removeAllJsonFiles() {
	StatusBar.addStatusDeleting();
	for (const jsonFile of (await getAllJsonFiles((app.vault.adapter as FileSystemAdapter).getBasePath()))) {
		await unlink(jsonFile.absPath);
	}
	StatusBar.removeStatusDeleting();
}

/**
 * Process a File
 * @param file The file to process
 */
export async function processFile(file: File): Promise<Transcript | undefined> {
	const sqlSettings = DBManager.getSettingsByRelativePath(file.vaultRelativePath);
	switch (getFileType(file)) {
	case FILE_TYPE.PDF: {
		const imagePaths = await convertPdfToPng(
			file,
			sqlSettings ? sqlSettings.imageDensity : SettingsManager.currentSettings.density,
			sqlSettings ? sqlSettings.imageQuality : SettingsManager.currentSettings.quality,
			sqlSettings ? sqlSettings.imagemagickArgs : SettingsManager.currentSettings.additionalImagemagickArgs,
		);
		if (!imagePaths) return undefined;
		const ocrResults = await OCRProviderManager.getByName(SettingsManager.currentSettings.ocrProviderName).performOCR(imagePaths);
		if (!ocrResults) return undefined;
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
		if (!ocrResults) return undefined;
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

export function processVault(settings: Settings) {
	app.vault.getFiles()
		.map((tFile) => {
			return File.fromFile(tFile);
		})
		.filter((file) => {
			return shouldFileBeOCRed(file, settings);
		})
		.forEach(async (file) => {
			await OcrQueue.enqueueFile(file);
		});
}
