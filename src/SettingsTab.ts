import {App, Plugin, PluginSettingTab, Setting} from "obsidian";
import SettingsManager from "./Settings";
import OCRProviderManager from "./ocr/OCRProviderManager";

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
		new Setting(ocrProviderDropdownDiv).addDropdown(async (dd) => {
			OCRProviderManager.ocrProviders
				.filter(async (ocrProvider) => {
					return await ocrProvider.isUsable();
				})
				.forEach((ocrProvider) => {
					dd.addOption(ocrProvider.getProviderName(), ocrProvider.getProviderName());
				});
			dd.onChange(async (name) => {
				SettingsManager.currentSettings.ocrProviderName = name;
				await SettingsManager.saveSettings();
				this.hide();
				this.display();
			});
			dd.setValue(SettingsManager.currentSettings.ocrProviderName);
		}).setName("OCR Provider").setDesc("The OCR provider to use");
		OCRProviderManager.getByName(SettingsManager.currentSettings.ocrProviderName).displaySettings(ocrProviderSettingsDiv);
	}
}
