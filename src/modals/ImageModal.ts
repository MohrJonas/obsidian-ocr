import {Modal} from "obsidian";

/**
 * Modal to show an enlarged preview of a page's thumbnail
 * */
export default class ImageModal extends Modal {

	constructor(private readonly image: string) {
		super(app);
	}

	override onOpen() {
		const image = this.contentEl.createEl("img");
		image.src = `data:image/png;base64, ${this.image}`;
		image.onload = () => {
			this.modalEl.style.width = `${image.width.toString()}px`;
			this.modalEl.style.height = `${image.height.toString()}px`;
		};
	}
}