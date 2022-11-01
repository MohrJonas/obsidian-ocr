import {Plugin} from "obsidian";
import OCRProvider from "./ocr/OCRProvider";

interface Settings {
	ocrProviderName: string;
	ocrProviderSettings: Record<string, Record<string, unknown>>;
	fuzzySearch: boolean;
	caseSensitive: boolean;
	ocrImage: boolean;
	ocrPDF: boolean;
	concurrentIndexingProcesses: number;
	concurrentCachingProcesses: number;
	additionalSearchPath: string;
}

export default abstract class SettingsManager {

	public static currentSettings: Settings;
	private static plugin: Plugin;

	private static readonly DEFAULT_SETTINGS: Settings = {
		ocrProviderName: "NoOp",
		ocrProviderSettings: {},
		fuzzySearch: true,
		caseSensitive: false,
		ocrImage: true,
		ocrPDF: true,
		concurrentIndexingProcesses: 1,
		concurrentCachingProcesses: 10,
		additionalSearchPath: ""
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
}

