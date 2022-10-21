import {App, Notice, Plugin, PluginSettingTab, Setting} from "obsidian";
import SettingsManager from "./Settings";
import OCRProviderManager from "./ocr/OCRProviderManager";
import { OcrQueue } from "./utils/OcrQueue";

export class SettingsTab extends PluginSettingTab {

	private readonly plugin: Plugin;

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	override display() {
		this.containerEl.replaceChildren();
		const ocrProviderDropdownDiv = this.containerEl.createEl("div");
		const ocrProviderSettingsDiv = this.containerEl.createEl("div");
		new Setting(ocrProviderDropdownDiv).addToggle((tc) => {
			tc.setValue(SettingsManager.currentSettings.ocrImage);
			tc.onChange(async (value) => {
				SettingsManager.currentSettings.ocrImage = value;
				await SettingsManager.saveSettings();
			});
		}).setName("OCR Image").setDesc("Whether images should be OCRed");
		new Setting(ocrProviderDropdownDiv).addToggle((tc) => {
			tc.setValue(SettingsManager.currentSettings.ocrPDF);
			tc.onChange(async (value) => {
				SettingsManager.currentSettings.ocrPDF = value;
				await SettingsManager.saveSettings();
			});
		}).setName("OCR PDF").setDesc("Whether PDFs should be OCRed");
		new Setting(ocrProviderDropdownDiv).addSlider((slider) => {
			slider.setLimits(1,10,1);
			slider.setValue(SettingsManager.currentSettings.concurrentProcesses);
			slider.setDynamicTooltip();
			slider.onChange(async (value) => {
				SettingsManager.currentSettings.concurrentProcesses = value;
				OcrQueue.changeMaxProcesses(value);
				await SettingsManager.saveSettings();
			});
		}).setName("Max OCR Processes").setDesc("Set the maximimum number of concurrent OCR Processes");
		new Setting(ocrProviderDropdownDiv).addDropdown(async (dd) => {
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
		OCRProviderManager.getByName(SettingsManager.currentSettings.ocrProviderName).displaySettings(ocrProviderSettingsDiv);
	}
}
