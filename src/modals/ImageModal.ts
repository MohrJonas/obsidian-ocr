import {Modal} from "obsidian";
import ObsidianOCRPlugin from "../Main";

/**
 * Modal to show an enlarged preview of a page's thumbnail
 * */
export default class ImageModal extends Modal {

	constructor(private readonly image: string) {
		super(app);
	}

	override onOpen() {
		ObsidianOCRPlugin.logger.debug(`Opening image modal with image ${this.image}`);
		const image = this.contentEl.createEl("img");
		image.src = `data:image/png;base64, ${this.image}`;
		image.onload = () => {
			this.modalEl.style.width = `${image.width.toString()}px`;
			this.modalEl.style.height = `${image.height.toString()}px`;
		};
	}
}