import {Modal, Setting} from "obsidian";
import {processVault} from "../utils/FileOps";
import DBManager from "../db/DBManager";
import SettingsManager from "../Settings";
import ObsidianOCRPlugin from "../Main";

export default class ReindexingModal extends Modal {

	override onOpen() {
		ObsidianOCRPlugin.logger.debug("Opening reindexing modal");
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