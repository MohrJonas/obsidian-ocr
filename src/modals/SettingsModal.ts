import {Modal, Setting} from "obsidian";
import FileSpecificSettings from "../db/FileSpecificSettings";
import DBManager from "../db/DBManager";
import {FILE_TYPE, getFileType} from "../utils/FileUtils";
import File from "../File";
import {OcrQueue} from "../utils/OcrQueue";

/**
 * Modal used to display and change transcript-specific settings
 * */
export default class SettingsModal extends Modal {

	private readonly settings: FileSpecificSettings;

	constructor(private readonly filePath: string) {
		super(app);
		if (!DBManager.getSettingsByRelativePath(filePath)) this.settings = FileSpecificSettings.DEFAULT();
		else this.settings = DBManager.getSettingsByRelativePath(filePath);
	}

	override onOpen() {
		this.contentEl.replaceChildren();
		new Setting(this.contentEl).addSlider((sc) => {
			sc.setLimits(50, 300, 10);
			sc.setValue(this.settings.imageDensity);
			sc.setDynamicTooltip();
			sc.onChange((value) => {
				this.settings.imageDensity = value;
			});
		}).setName("Image density").setDesc("Image density of converted PDFs");
		new Setting(this.contentEl).addSlider((sc) => {
			sc.setLimits(50, 100, 1);
			sc.setValue(this.settings.imageQuality);
			sc.setDynamicTooltip();
			sc.onChange((value) => {
				this.settings.imageDensity = value;
			});
		}).setName("Image quality").setDesc("Image quality of converted PDFs");
		if(getFileType(File.fromVaultRelativePath(this.filePath)) == FILE_TYPE.PDF)
			new Setting(this.contentEl).addText((tc) => {
				tc.setValue(this.settings.imagemagickArgs);
				tc.setPlaceholder("Additional imagemagick args");
				tc.onChange((value) => {
					this.settings.imagemagickArgs = value;
				});
			}).setName("Additional imagemagick args")
				.setDesc("Additional args passed to imagemagick when converting PDF to PNGs");
		new Setting(this.contentEl).addButton(bc => {
			bc.setButtonText("Cancel");
			bc.setWarning();
			bc.onClick(() => {
				this.close();
			});
		}).addButton((bc) => {
			bc.setButtonText("Remove");
			bc.setWarning();
			bc.onClick(async () => {
				DBManager.removeSettingsByRelativePath(this.filePath);
				await DBManager.saveDB();
				this.close();
			});
		}).addButton((bc) => {
			bc.setButtonText("Save");
			bc.onClick(async () => {
				DBManager.setSettingsByRelativePath(this.filePath, this.settings);
				await DBManager.saveDB();
				this.close();
			});
		}).addButton((bc) => {
			bc.setButtonText("Save and reindex");
			bc.onClick(async () => {
				DBManager.setSettingsByRelativePath(this.filePath, this.settings);
				await DBManager.saveDB();
				DBManager.removeSettingsByRelativePath(this.filePath);
				await OcrQueue.enqueueFile(File.fromVaultRelativePath(this.filePath));
				this.close();
			});
		});
	}
}