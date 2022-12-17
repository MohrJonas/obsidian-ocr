import {Plugin} from "obsidian";
import OCRProvider from "./ocr/OCRProvider";
import SimpleLogger from "simple-node-logger";
import {areDepsMet} from "./Convert";
import OCRProviderManager from "./ocr/OCRProviderManager";
import ObsidianOCRPlugin from "./Main";

export interface Settings {
	ocrProviderName: string;
	ocrProviderSettings: Record<string, Record<string, unknown>>;
	fuzzySearch: boolean;
	caseSensitive: boolean;
	ocrImage: boolean;
	ocrPDF: boolean;
	concurrentIndexingProcesses: number;
	additionalSearchPath: string;
	density: number;
	quality: number;
	additionalImagemagickArgs: string;
	showTips: boolean;
	logToFile: boolean;
	logLevel: SimpleLogger.STANDARD_LEVELS;
}

export default abstract class SettingsManager {

	public static currentSettings: Settings;
	private static plugin: Plugin;

	private static readonly DEFAULT_SETTINGS: Settings = {
		ocrProviderName: "NoOp",
		ocrProviderSettings: {},
		fuzzySearch: true,
		caseSensitive: false,
		ocrImage: false,
		ocrPDF: false,
		concurrentIndexingProcesses: 1,
		additionalSearchPath: "",
		density: 300,
		quality: 98,
		additionalImagemagickArgs: "",
		showTips: true,
		logToFile: false,
		logLevel: "warn"
	};

	static async loadSettings(plugin: Plugin) {
		SettingsManager.plugin = plugin;
		SettingsManager.currentSettings = Object.assign({}, this.DEFAULT_SETTINGS, await plugin.loadData());
	}

	static async saveSettings() {
		await SettingsManager.plugin.saveData(SettingsManager.currentSettings);
	}

	static async saveOCRProviderSettings(provider: OCRProvider, settings: Record<string, unknown>) {
		SettingsManager.currentSettings.ocrProviderSettings[provider.getProviderName()] = settings;
		await SettingsManager.plugin.saveData(SettingsManager.currentSettings);
	}

	static getOCRProviderSettings(provider: OCRProvider): Record<string, unknown> | undefined {
		return SettingsManager.currentSettings.ocrProviderSettings[provider.getProviderName()];
	}

	/**
	 * Validate the current settings, meaning checking if the selected OCR provider is still usable and ImageMagick is still installed
	 * */
	static async validateSettings() {
		if(!await areDepsMet()) {
			ObsidianOCRPlugin.logger.info(`Repairing settings ${SettingsManager.currentSettings.ocrPDF} -> false`);
			SettingsManager.currentSettings.ocrPDF = false;
		}
		if(!await OCRProviderManager.getByName(SettingsManager.currentSettings.ocrProviderName).isUsable()) {
			ObsidianOCRPlugin.logger.info(`Repairing settings ${SettingsManager.currentSettings.ocrProviderName} -> NoOp`);
			SettingsManager.currentSettings.ocrProviderName = "NoOp";
		}
	}
}

