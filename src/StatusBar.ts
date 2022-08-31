import {clampFileName} from "./utils/Utils";
import File from "./File";

export enum STATUS {
	CACHING,
	IDLING,
	INDEXING,
	DELETING
}

export abstract class StatusBar {

	private static parentHTML: HTMLElement;
	private static indexingFiles: Array<File> = [];
	private static currentStatus: Set<STATUS> = new Set();

	static setupStatusBar(parentHTML: HTMLElement) {
		StatusBar.parentHTML = parentHTML;
	}

	static addStatusIndexing() {
		StatusBar.currentStatus.add(STATUS.INDEXING);
		StatusBar.updateText();
	}

	static addStatusDeleting() {
		StatusBar.currentStatus.add(STATUS.DELETING);
		StatusBar.updateText();
	}

	static addStatusCaching() {
		StatusBar.currentStatus.add(STATUS.CACHING);
		StatusBar.updateText();
	}

	static addIndexingFile(file: File) {
		StatusBar.indexingFiles.push(file);
		StatusBar.currentStatus.add(STATUS.INDEXING);
		StatusBar.updateText();
	}

	static removeIndexingFile(file: File) {
		StatusBar.indexingFiles.remove(file);
		if (StatusBar.indexingFiles.length == 0)
			StatusBar.removeStatusIndexing();
		StatusBar.updateText();
	}

	static removeStatusIndexing() {
		StatusBar.currentStatus.delete(STATUS.INDEXING);
		StatusBar.updateText();
	}

	static removeStatusDeleting() {
		StatusBar.currentStatus.delete(STATUS.DELETING);
		StatusBar.updateText();
	}

	static removeStatusCaching() {
		StatusBar.currentStatus.delete(STATUS.CACHING);
		StatusBar.updateText();
	}

	static hasStatus(status: STATUS): boolean {
		return StatusBar.currentStatus.has(status);
	}

	private static updateText() {
		if (StatusBar.currentStatus.size == 0) StatusBar.parentHTML.innerText = StatusBar.statusToString(STATUS.IDLING);
		else StatusBar.parentHTML.innerText = Array.from(StatusBar.currentStatus.values()).map((status) => {
			return StatusBar.statusToString(status);
		}).join(", ");
	}

	private static statusToString(status: STATUS): string {
		switch (status) {
		case STATUS.CACHING:
			return "🗃️️ Caching";
		case STATUS.IDLING:
			return "💤 Idling";
		case STATUS.INDEXING:
			return `🔎 Indexing ${StatusBar.filesToString(StatusBar.indexingFiles)}`;
		case STATUS.DELETING:
			return "🗑️ Deleting";
		}
	}

	private static filesToString(files: Array<File>): string {
		if (files.length <= 2) {
			return files.map((file) => {
				return clampFileName(20, file.tFile.name);
			}).join(", ");
		}
		return `${files.slice(undefined, 2).map((file) => {
			return clampFileName(20, file.tFile.name);
		}).join(", ")} (+${files.length - 2} more)`;
	}
}
