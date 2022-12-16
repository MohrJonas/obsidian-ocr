import {App, Notice, Plugin, PluginSettingTab, Setting} from "obsidian";
import SettingsManager from "./Settings";
import OCRProviderManager from "./ocr/OCRProviderManager";
import {OcrQueue} from "./utils/OcrQueue";
import {delimiter} from "path";
import {areDepsMet} from "./Convert";
import InstallationProviderManager from "./utils/installation/InstallationProviderManager";
import TerminalModal from "./modals/TerminalModal";
import ObsidianOCRPlugin from "./Main";
import SimpleLogger from "simple-node-logger";
import ReindexingModal from "./modals/ReindexingModal";

/**
 * Settings tab
 * */
export class SettingsTab extends PluginSettingTab {

	private readonly plugin: Plugin;
	private initialProviderName = SettingsManager.currentSettings.ocrProviderName;

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	override hide() {
		super.hide();
		if(this.initialProviderName != SettingsManager.currentSettings.ocrProviderName)
			new ReindexingModal(app).open();
	}

	override async display() {
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
				SettingsManager.currentSettings.ocrPDF = value;
				await SettingsManager.saveSettings();
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
		if (!await areDepsMet()) new Setting(this.containerEl).addButton((btn) => {
			btn.setButtonText("[ALPHA] Install dependencies");
			btn.onClick(async () => {
				const installationProvider = await InstallationProviderManager.getCorrectProvider();
				if (installationProvider) {
					const modal = new TerminalModal(ObsidianOCRPlugin.plugin.app);
					modal.open();
					installationProvider.installDependencies(modal.terminal);
				}
				else {
					new Notice("Automatic installation not yet implemented for this platform");
				}
			});
		});
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
