import { exec } from "child_process";
import { App, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import { ConfirmModal } from "./modals/confirm-modal";

interface Settings {
	ocrLang: string;
	fuzzySearch: boolean;
	caseSensitive: boolean;
}

const DEFAULT_SETTINGS: Settings = {
	ocrLang: "osd",
	fuzzySearch: true,
	caseSensitive: false
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
		this.containerEl.replaceChildren();
		exec("tesseract --list-langs", (error, stdout, stderr) => {
			if (error) {
				new Notice(error.message);
			}
			if (stderr) {
				new Notice(stderr);
			}
			const langs = stdout.split("\n");
			langs.shift();
			langs.pop();
			new Setting(this.containerEl)
				.setName("OCR Language")
				.setDesc("The language used by Tesseract for OCR detection")
				.addDropdown((dd) => {
					langs.forEach((lang) => {
						dd.addOption(lang, lang);
					});
					dd.setValue(currentSettings.ocrLang);
					dd.onChange(async (value) => {
						currentSettings.ocrLang = value;
						saveSettings(this.plugin);
						new ConfirmModal(this.app, this.plugin).open();
					});
				});
		});
	}

}