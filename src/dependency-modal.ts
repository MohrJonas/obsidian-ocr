import { App, Modal, Setting } from "obsidian";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import open from "open";

export class DependencyModal extends Modal {

	private static tesseractURL = "https://github.com/UB-Mannheim/tesseract/wiki";
	private static gmURL = "https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/";
	private static gsURL = "https://ghostscript.com/releases/gsdnld.html";

	constructor(app: App, private tesseractInstalled: boolean, private gmInstalled: boolean, private gsInstalled: boolean) {
		super(app);
	}

	override async onOpen() {
		if (this.tesseractInstalled && this.gmInstalled && this.gsInstalled) {
			this.close();
			return;
		}
		this.contentEl.createEl("h1", { text: "Obsidian OCR: Dependency problem detected" });
		this.contentEl.createEl("p", { text: this.asString("Tesseract", this.tesseractInstalled) });
		this.contentEl.createEl("p", { text: this.asString("Graphicsmagick", this.gmInstalled) });
		this.contentEl.createEl("p", { text: this.asString("Ghostscript", this.gsInstalled) });
		this.contentEl.createEl("p", { text: "Would you like me to open the installation instructions in your browser?" });
		new Setting(this.contentEl).addButton((bc) => {
			bc.setButtonText("Yes").onClick(() => {
				this.getURLs().forEach(async (url) => { await open(url); });
				this.close();
			});
		}).addButton((bc) => { bc.setButtonText("No").onClick(() => { this.close(); }); });
	}

	private asString(name: string, installed: boolean): string {
		const installedMark = installed ? "✔" : "❌";
		return `${installedMark} ${name}`;
	}

	private getURLs(): Array<string> {
		const arr: Array<string> = [];
		if (!this.tesseractInstalled) arr.push(DependencyModal.tesseractURL);
		if (!this.gmInstalled) arr.push(DependencyModal.gmURL);
		if (!this.gsInstalled) arr.push(DependencyModal.gsURL);
		return arr;
	}
}