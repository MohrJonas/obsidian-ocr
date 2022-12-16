import {Modal, Setting} from "obsidian";
import {processVault} from "../utils/FileOps";
import DBManager from "../db/DBManager";
import SettingsManager from "../Settings";

export default class ReindexingModal extends Modal {

	override onOpen() {
		this.contentEl.setText("Do you want to reindex your files?");
		new Setting(this.contentEl).addButton((bc) => {
			bc.setWarning().setButtonText("Yes").onClick(async () => {
				DBManager.deleteAllTranscripts();
				processVault(SettingsManager.currentSettings);
				this.close();
			});
		}).addButton((bc) => {
			bc.setButtonText("No").onClick(() => {
				this.close();
			});
		});
	}

}