import {Modal, Setting} from "obsidian";
import {processVault, removeAllJsonFiles} from "../utils/FileOps";

export class TranscriptDeleteModal extends Modal {

	override onOpen() {
		this.contentEl.setText("Do you want to remove all previous transcripts? This will force a reindexing of all files.");
		new Setting(this.contentEl).addButton((bc) => {
			bc.setWarning().setButtonText("Yes").onClick(async () => {
				await removeAllJsonFiles();
				this.close();
				processVault();
			});
		}).addButton((bc) => {
			bc.setButtonText("No").onClick(() => {
				this.close();
			});
		});
	}
}
