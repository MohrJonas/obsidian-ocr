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
	ObsidianOCRPlugin.logger.info("Removing all Json files");
	StatusBar.addStatusDeleting();
	for (const jsonFile of (await getAllJsonFiles((app.vault.adapter as FileSystemAdapter).getBasePath()))) {
		ObsidianOCRPlugin.logger.info(`Removing JSON file ${jsonFile}`);
		await unlink(jsonFile.absPath);
	}
	StatusBar.removeStatusDeleting();
}

/**
 * Process a File
 * @param file The file to process
 */
export async function processFile(file: File): Promise<Transcript | undefined> {
	ObsidianOCRPlugin.logger.info(`Processing file ${file.vaultRelativePath}`);
	const sqlSettings = DBManager.getSettingsByRelativePath(file.vaultRelativePath);
	switch (getFileType(file)) {
	case FILE_TYPE.PDF: {
		ObsidianOCRPlugin.logger.info(`${file.vaultRelativePath} is a PDF file`);
		const imagePaths = await convertPdfToPng(
			file,
			sqlSettings ? sqlSettings.imageDensity : SettingsManager.currentSettings.density,
			sqlSettings ? sqlSettings.imageQuality : SettingsManager.currentSettings.quality,
			sqlSettings ? sqlSettings.imagemagickArgs : SettingsManager.currentSettings.additionalImagemagickArgs,
		);
		ObsidianOCRPlugin.logger.info(`Image paths are ${imagePaths}`);
		if (!imagePaths) return undefined;
		const ocrResults = await OCRProviderManager.getByName(SettingsManager.currentSettings.ocrProviderName).performOCR(imagePaths);
		ObsidianOCRPlugin.logger.info(`OCR results are ${ocrResults}`);
		if (!ocrResults) return undefined;
		const transcript = new Transcript(
			ObsidianOCRPlugin.plugin.manifest.version,
			file.vaultRelativePath,
			ocrResults.map((result) => {
				return new DOMParser().parseFromString(result, "text/html");
			}),
			imagePaths
		);
		ObsidianOCRPlugin.logger.info(`Transcript is ${transcript}`);
		StatusBar.removeIndexingFile(file);
		return transcript;
	}
	case FILE_TYPE.IMAGE: {
		ObsidianOCRPlugin.logger.info(`${file.vaultRelativePath} is an image file`);
		const ocrResults = await OCRProviderManager.getByName(SettingsManager.currentSettings.ocrProviderName).performOCR([file.absPath]);
		ObsidianOCRPlugin.logger.info(`OCR results are ${ocrResults}`);
		if (!ocrResults) return undefined;
		const transcript = new Transcript(
			ObsidianOCRPlugin.plugin.manifest.version,
			file.vaultRelativePath,
			[new DOMParser().parseFromString(ocrResults[0], "text/html")],
			[file.absPath]
		);
		ObsidianOCRPlugin.logger.info(`Transcript is ${transcript}`);
		StatusBar.removeIndexingFile(file);
		return transcript;
	}
	default: {
		ObsidianOCRPlugin.logger.warn(`${file.vaultRelativePath} can't be processed`);
		return undefined;
	}
	}
}

export function processVault(settings: Settings) {
	ObsidianOCRPlugin.logger.info(`Processing vault with settings ${JSON.stringify(settings)}`);
	app.vault.getFiles()
		.map((tFile) => {
			return File.fromFile(tFile);
		})
		.filter((file) => {
			const ocr = shouldFileBeOCRed(file, settings);
			ObsidianOCRPlugin.logger.info(`File ${file.vaultRelativePath} ${ocr ? "should" : "shouldn't"} be OCRed`);
			return ocr;
		})
		.forEach(async (file) => {
			ObsidianOCRPlugin.logger.info(`Enqueuing file ${file.vaultRelativePath}`);
			await OcrQueue.enqueueFile(file);
		});
}
