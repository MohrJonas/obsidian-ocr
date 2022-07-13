import { App, Modal, Plugin, Setting } from "obsidian";
import { listAllFiles, processFile, removeAllJsonFiles } from "./utils";

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
				await removeAllJsonFiles(this.app.vault);
				this.close();
				(await listAllFiles(this.app.vault)).forEach(async (file) => { await processFile(this.plugin, file, this.app.vault); });
			});
		}).addButton((bc) => {
			bc.setButtonText("No").onClick(() => {
				this.close();
			});
		});
	}
}