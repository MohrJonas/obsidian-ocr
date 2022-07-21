import { App, Modal, Plugin, Setting } from "obsidian";
import { StatusBar } from "../status-bar";
import { processVault, removeAllJsonFiles } from "../utils";

export enum EXIT_CODE {
	CHANGE_SETTING,
	DO_NOT_CHANGE_SETTING
}

export class ConfirmModal extends Modal {

	private plugin: Plugin;

	constructor(app: App, plugin: Plugin) {
		super(app);
		this.plugin = plugin;
	}

	override onOpen() {
		this.contentEl.setText("Do you want to remove all previous transcripts? This will force a reindexing of all files.");
		new Setting(this.contentEl).addButton((bc) => {
			bc.setWarning().setButtonText("Yes").onClick(async () => {
				StatusBar.setStatusBarDeleting();
				await removeAllJsonFiles(this.app.vault);
				this.close();
				processVault(this.plugin, this.app.vault);
			});
		}).addButton((bc) => {
			bc.setButtonText("No").onClick(() => {
				this.close();
			});
		});
	}
}