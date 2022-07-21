import { TFile } from "obsidian";
import { clampFileName } from "./utils";

export abstract class StatusBar {

	private static parentHTML: HTMLElement;
	private static indexingFiles: Array<TFile> = [];

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

	static setStatusBarDeleting() {
		StatusBar.parentHTML.innerText = "🗑️ Deleting";
	}

	private static filesToString(files: Array<TFile>): string {
		if (files.length <= 2) {
			return files.map((file) => { return clampFileName(20, file.name); }).join(", ");
		}
		return `${files.slice(undefined, 2).map((file) => { return clampFileName(20, file.name); }).join(", ")} (+${files.length - 2} more)`;
	}

	static addIndexingFile(file: TFile) {
		StatusBar.indexingFiles.push(file);
		StatusBar.setStatusBarIndexing();
	}

	static removeIndexingFile(file: TFile) {
		StatusBar.indexingFiles.remove(file);
		if (StatusBar.indexingFiles.length == 0)
			StatusBar.setStatusBarIdle();
		else
			StatusBar.setStatusBarIndexing();
	}
}