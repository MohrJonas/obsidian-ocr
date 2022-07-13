import { TAbstractFile } from "obsidian";

export abstract class StatusBar {

	private static parentHTML: HTMLElement;
	private static indexingFiles: Array<TAbstractFile> = [];

	static setupStatusBar(parentHTML: HTMLElement) {
		StatusBar.parentHTML = parentHTML;
		StatusBar.setStatusBarIdle();
	}

	static setStatusBarIdle() {
		StatusBar.parentHTML.innerText = "💤 Idling";
	}

	static setStatusBarIndexing() {
		StatusBar.parentHTML.innerText = `🔎 Indexing ${StatusBar.filesToString(StatusBar.indexingFiles)}`;
	}

	private static filesToString(files: Array<TAbstractFile>): string {
		if (files.length <= 2) {
			return files.map((file) => { return file.name; }).join(", ");
		}
		return `${files.slice(undefined, 3).map((file) => { return file.name; }).join(", ")} (+${files.length - 2} more)`;
	}

	static addIndexingFile(file: TAbstractFile) {
		StatusBar.indexingFiles.push(file);
		StatusBar.setStatusBarIndexing();
	}

	static removeIndexingFile(file: TAbstractFile) {
		StatusBar.indexingFiles.remove(file);
		if (StatusBar.indexingFiles.length == 0)
			StatusBar.setStatusBarIdle();
		else
			StatusBar.setStatusBarIndexing();
	}
}