import File from "./File";

export enum STATUS {
    CACHING,
    INDEXING,
    DELETING
}

/**
 * Statusbar item
 * */
export abstract class StatusBar {

	private static parentHTML: HTMLElement;
	private static indexingFiles: Array<File> = [];
	private static cachingFiles: Array<File> = [];
	private static currentStatus: Set<STATUS> = new Set();
	private static maxIndexingFile = 0;
	private static maxCachingFile = 0;

	static setupStatusBar(parentHTML: HTMLElement) {
		StatusBar.parentHTML = parentHTML;
	}

	static addStatusDeleting() {
		StatusBar.currentStatus.add(STATUS.DELETING);
		StatusBar.updateText();
	}

	static removeStatusDeleting() {
		StatusBar.currentStatus.delete(STATUS.DELETING);
		StatusBar.updateText();
	}

	static addIndexingFile(file: File) {
		StatusBar.indexingFiles.push(file);
		StatusBar.currentStatus.add(STATUS.INDEXING);
		StatusBar.maxIndexingFile = Math.max(StatusBar.maxIndexingFile, StatusBar.indexingFiles.length);
		StatusBar.updateText();
	}

	static removeIndexingFile(file: File) {
		StatusBar.indexingFiles.remove(file);
		if (StatusBar.indexingFiles.length == 0) {
			StatusBar.currentStatus.delete(STATUS.INDEXING);
			StatusBar.maxIndexingFile = 0;
		}
		StatusBar.updateText();
	}

	static setMaxCachingFile(max: number) {
		StatusBar.maxCachingFile = max;
	}

	static addCachingFile(file: File) {
		StatusBar.cachingFiles.push(file);
		StatusBar.currentStatus.add(STATUS.CACHING);
		StatusBar.updateText();
	}

	static removeCachingFile(file: File) {
		StatusBar.cachingFiles.remove(file);
		if (StatusBar.cachingFiles.length == 0) StatusBar.currentStatus.delete(STATUS.CACHING);
		StatusBar.updateText();
	}

	static hasStatus(status: STATUS): boolean {
		return StatusBar.currentStatus.has(status);
	}

	private static updateText() {
		StatusBar.parentHTML.replaceChildren();
		StatusBar.currentStatus.forEach((status) => {
			StatusBar.statusToString(status);
		});
	}

	private static statusToString(status: STATUS) {
		if (status == STATUS.INDEXING) {
			StatusBar.parentHTML.createSpan({
				text: `🔎 Indexing (${StatusBar.maxIndexingFile - StatusBar.indexingFiles.length}/${StatusBar.maxIndexingFile})`,
				cls: "bar-element"
			});
			const progress = StatusBar.parentHTML.createEl("progress", {
				cls: "bar-element"
			});
			progress.value = StatusBar.maxIndexingFile - StatusBar.indexingFiles.length;
			progress.max = StatusBar.maxIndexingFile;
		}
		else if (status == STATUS.CACHING) {
			StatusBar.parentHTML.createSpan({
				text: `🗃 Caching (${StatusBar.maxCachingFile - StatusBar.cachingFiles.length}/${StatusBar.maxCachingFile})`,
				cls: "bar-element"
			});
			const progress = StatusBar.parentHTML.createEl("progress", {
				cls: "bar-element"
			});
			progress.value = StatusBar.maxCachingFile - StatusBar.cachingFiles.length;
			progress.max = StatusBar.maxCachingFile;
		}
		else StatusBar.parentHTML.createSpan({
			text: "🗑️ Deleting",
			cls: "bar-element"
		});
	}
}
