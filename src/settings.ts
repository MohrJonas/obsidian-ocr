import { exec } from "child_process";
import { App, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";

interface Settings {
	ocr_lang: string;
	fuzzy_search: boolean;
	case_sensitive: boolean;
}

const DEFAULT_SETTINGS: Settings = {
	ocr_lang: "osd",
	fuzzy_search: true,
	case_sensitive: false
};

export let currentSettings: Settings;

export async function loadSettings(plugin: Plugin) {
	currentSettings = Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
}

export async function saveSettings(plugin: Plugin) {
	await plugin.saveData(currentSettings);
}


export class SettingsTab extends PluginSettingTab {

	private plugin: Plugin;

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	override display() {
		exec("tesseract --list-langs", (error, stdout, stderr) => {
			if (error) {
				new Notice(error.message);
			}
			if (stderr) {
				new Notice(stderr);
			}
			const langs = stdout.split("\n");
			langs.shift();
			new Setting(this.containerEl)
				.setName("OCR Language")
				.setDesc("The language used by Tesseract for OCR detection")
				.addDropdown((dd) => {
					langs.forEach((lang) => {
						dd.addOption(lang, lang);
					});
					dd.setValue(currentSettings.ocr_lang);
					dd.onChange(async (value) => {
						console.log(value);
						currentSettings.ocr_lang = value;
						saveSettings(this.plugin);
					});
				});
		});
	}

}