import {App, Notice, Plugin, PluginSettingTab, Setting} from "obsidian";
import SettingsManager from "./Settings";
import OCRProviderManager from "./ocr/OCRProviderManager";
import { OcrQueue } from "./utils/OcrQueue";
import TranscriptCache from "./TranscriptCache";

export class SettingsTab extends PluginSettingTab {

	private readonly plugin: Plugin;

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	override display() {
		this.containerEl.replaceChildren();
		new Setting(this.containerEl).addSlider((slider) => {
			slider.setLimits(1,10,1);
			slider.setValue(SettingsManager.currentSettings.concurrentIndexingProcesses);
			slider.setDynamicTooltip();
			slider.onChange(async (value) => {
				SettingsManager.currentSettings.concurrentIndexingProcesses = value;
				OcrQueue.changeMaxProcesses(value);
				await SettingsManager.saveSettings();
			});
		}).setName("Max Caching Processes").setDesc("Set the maximimum number of concurrent caching processes");
		new Setting(this.containerEl).addSlider((slider) => {
			slider.setLimits(1,100,1);
			slider.setValue(SettingsManager.currentSettings.concurrentCachingProcesses);
			slider.setDynamicTooltip();
			slider.onChange(async (value) => {
				SettingsManager.currentSettings.concurrentCachingProcesses = value;
				TranscriptCache.changeMaxProcesses(value);
				await SettingsManager.saveSettings();
			});
		}).setName("Max OCR Processes").setDesc("Set the maximimum number of concurrent OCR processes");
		new Setting(this.containerEl).addToggle((tc) => {
			tc.setValue(SettingsManager.currentSettings.ocrImage);
			tc.onChange(async (value) => {
				SettingsManager.currentSettings.ocrImage = value;
				await SettingsManager.saveSettings();
			});
		}).setName("OCR Image").setDesc("Whether images should be OCRed");
		new Setting(this.containerEl).addToggle((tc) => {
			tc.setValue(SettingsManager.currentSettings.ocrPDF);
			tc.onChange(async (value) => {
				SettingsManager.currentSettings.ocrPDF = value;
				await SettingsManager.saveSettings();
			});
		}).setName("OCR PDF").setDesc("Whether PDFs should be OCRed");
		new Setting(this.containerEl).addDropdown(async (dd) => {
			OCRProviderManager.ocrProviders
				.forEach((ocrProvider) => {
					dd.addOption(ocrProvider.getProviderName(), ocrProvider.getProviderName());
				});
			dd.onChange(async (name) => {
				const provider = OCRProviderManager.getByName(name);
				if(!await provider.isUsable()) {
					new Notice(`Provider "${provider.getProviderName()}" is not usable because: "${await provider.getReasonIsUnusable()}"`);
					dd.setValue(SettingsManager.currentSettings.ocrProviderName);
				} else {
					SettingsManager.currentSettings.ocrProviderName = name;
					await SettingsManager.saveSettings();
					this.hide();
					this.display();
				}
			});
			dd.setValue(SettingsManager.currentSettings.ocrProviderName);
		}).setName("OCR Provider").setDesc("The OCR provider to use");
		OCRProviderManager.getByName(SettingsManager.currentSettings.ocrProviderName).displaySettings(this.containerEl);
	}
}
