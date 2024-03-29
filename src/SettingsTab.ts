import {App, Notice, Plugin, PluginSettingTab, Setting} from "obsidian";
import SettingsManager, {Settings} from "./Settings";
import OCRProviderManager from "./ocr/OCRProviderManager";
import {OcrQueue} from "./utils/OcrQueue";
import {delimiter} from "path";
import {areDepsMet} from "./Convert";
import ObsidianOCRPlugin from "./Main";
import SimpleLogger from "simple-node-logger";
import ReindexingModal from "./modals/ReindexingModal";
import {cloneDeep, isEqual} from "lodash";

/**
 * Settings tab
 * */
export class SettingsTab extends PluginSettingTab {

	private readonly plugin: Plugin;
	private initialSettings: Settings;

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	override hide() {
		super.hide();
		if(
			this.initialSettings.ocrProviderName != SettingsManager.currentSettings.ocrProviderName ||
			!isEqual(this.initialSettings.ocrProviderSettings, SettingsManager.currentSettings.ocrProviderSettings) ||
			this.initialSettings.ocrImage != SettingsManager.currentSettings.ocrImage ||
			this.initialSettings.ocrPDF != SettingsManager.currentSettings.ocrPDF ||
			this.initialSettings.density != SettingsManager.currentSettings.density ||
			this.initialSettings.quality != SettingsManager.currentSettings.quality ||
			this.initialSettings.additionalImagemagickArgs != SettingsManager.currentSettings.additionalImagemagickArgs
		) new ReindexingModal(app).open();
	}

	override async display() {
		this.initialSettings = cloneDeep(SettingsManager.currentSettings);
		this.containerEl.replaceChildren();
		new Setting(this.containerEl).addSlider((slider) => {
			slider.setLimits(1, 10, 1);
			slider.setValue(SettingsManager.currentSettings.concurrentIndexingProcesses);
			slider.setDynamicTooltip();
			slider.onChange(async (value) => {
				SettingsManager.currentSettings.concurrentIndexingProcesses = value;
				OcrQueue.changeMaxProcesses(value);
				await SettingsManager.saveSettings();
			});
		}).setName("Max OCR Processes").setDesc("Set the maximum number of concurrent OCR processes");
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
				if(value) {
					if(await areDepsMet()) {
						SettingsManager.currentSettings.ocrPDF = value;
						await SettingsManager.saveSettings();
					}
					else {
						new Notice("Install ImageMagick to OCR PDFs");
						tc.setValue(false);
					}
				}
				else {
					SettingsManager.currentSettings.ocrPDF = value;
					await SettingsManager.saveSettings();
				}
			});
		}).setName("OCR PDF").setDesc("Whether PDFs should be OCRed");
		new Setting(this.containerEl).addSlider((slider) => {
			slider.setLimits(50, 300, 10);
			slider.setValue(SettingsManager.currentSettings.density);
			slider.setDynamicTooltip();
			slider.onChange(async (value) => {
				SettingsManager.currentSettings.density = value;
				await SettingsManager.saveSettings();
			});
		}).setName("Image density").setDesc("Image density of converted PDFs");
		new Setting(this.containerEl).addSlider((slider) => {
			slider.setLimits(50, 100, 1);
			slider.setValue(SettingsManager.currentSettings.quality);
			slider.setDynamicTooltip();
			slider.onChange(async (value) => {
				SettingsManager.currentSettings.quality = value;
				await SettingsManager.saveSettings();
			});
		}).setName("Image quality").setDesc("Image quality of converted PDFs");
		new Setting(this.containerEl).addText((tc) => {
			tc.setValue(SettingsManager.currentSettings.additionalImagemagickArgs);
			tc.setPlaceholder("Additional imagemagick args");
			tc.onChange(async (value) => {
				SettingsManager.currentSettings.additionalImagemagickArgs = value;
				await SettingsManager.saveSettings();
			});
		}).setName("Additional imagemagick args")
			.setDesc("Additional args passed to imagemagick when converting PDF to PNGs");
		new Setting(this.containerEl).addText((tc) => {
			tc.setValue(SettingsManager.currentSettings.additionalSearchPath);
			tc.setPlaceholder("Additional paths");
			tc.onChange(async (value) => {
				SettingsManager.currentSettings.additionalSearchPath = value;
				await SettingsManager.saveSettings();
			});
		}).setName("Additional search paths (Requires restart)")
			.setDesc(`Additional paths to be searched for programs, in this format: "folder1${delimiter}folder2..."`);
		new Setting(this.containerEl).addToggle((tc) => {
			tc.setValue(SettingsManager.currentSettings.showTips);
			tc.onChange(async (value) => {
				SettingsManager.currentSettings.showTips = value;
				await SettingsManager.saveSettings();
			});
		}).setName("Show tips").setDesc("Whether to show a tip at startup");
		new Setting(this.containerEl).addDropdown((dc) => {
			dc.addOptions({
				"debug": "debug",
				"info": "info",
				"warn": "warn",
				"error": "error",
			});
			dc.setValue(SettingsManager.currentSettings.logLevel.toString());
			dc.onChange(async (value) => {
				SettingsManager.currentSettings.logLevel = <SimpleLogger.STANDARD_LEVELS>value;
				ObsidianOCRPlugin.logger.setLevel(<SimpleLogger.STANDARD_LEVELS>value);
				await SettingsManager.saveSettings();
			});
		}).setName("Log level").setDesc("Set the log level. Useful for debugging");
		new Setting(this.containerEl).addToggle((tc) => {
			tc.setValue(SettingsManager.currentSettings.logToFile);
			tc.onChange(async (value) => {
				SettingsManager.currentSettings.logToFile = value;
				await SettingsManager.saveSettings();
			});
		}).setName("Log to file").setDesc("Log to a file in your vault. Useful for debugging");
		let providerDiv: HTMLDivElement;
		new Setting(this.containerEl).addDropdown(async (dd) => {
			OCRProviderManager.ocrProviders
				.forEach((ocrProvider) => {
					dd.addOption(ocrProvider.getProviderName(), ocrProvider.getProviderName());
				});
			dd.onChange(async (name) => {
				const provider = OCRProviderManager.getByName(name);
				if (!await provider.isUsable()) {
					new Notice(`Provider "${provider.getProviderName()}" is not usable because: "${await provider.getReasonIsUnusable()}"`);
					dd.setValue(SettingsManager.currentSettings.ocrProviderName);
				} else {
					SettingsManager.currentSettings.ocrProviderName = name;
					await SettingsManager.saveSettings();
					providerDiv.replaceChildren();
					OCRProviderManager.getByName(SettingsManager.currentSettings.ocrProviderName).displaySettings(providerDiv);
				}
			});
			dd.setValue(SettingsManager.currentSettings.ocrProviderName);
			providerDiv = this.containerEl.createDiv();
		}).setName("OCR Provider").setDesc("The OCR provider to use");
		OCRProviderManager.getByName(SettingsManager.currentSettings.ocrProviderName).displaySettings(providerDiv);
	}
}
