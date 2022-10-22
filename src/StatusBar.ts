import File from "./File";

export enum STATUS {
    CACHING,
    INDEXING,
    DELETING
}

export abstract class StatusBar {

	private static parentHTML: HTMLElement;
	private static indexingFiles: Array<File> = [];
	private static currentStatus: Set<STATUS> = new Set();
	private static max = 0;

	static setupStatusBar(parentHTML: HTMLElement) {
		StatusBar.parentHTML = parentHTML;
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
		StatusBar.max = Math.max(StatusBar.max, StatusBar.indexingFiles.length);
		StatusBar.updateText();
	}

	static removeIndexingFile(file: File) {
		StatusBar.indexingFiles.remove(file);
		if (StatusBar.indexingFiles.length == 0) {
			StatusBar.removeStatusIndexing();
			StatusBar.max = 0;
		}
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
		StatusBar.parentHTML.replaceChildren();
		StatusBar.currentStatus.forEach((status) => {
			StatusBar.statusToString(status);
		});
	}

	private static statusToString(status: STATUS) {
		if (status == STATUS.INDEXING) {
			StatusBar.parentHTML.createSpan({
				text: `🔎 Indexing (${StatusBar.max - StatusBar.indexingFiles.length}/${StatusBar.max})`,
				cls: "bar-element"
			});
			const progress = StatusBar.parentHTML.createEl("progress", {
				cls: "bar-element"
			});
			progress.value = StatusBar.max - StatusBar.indexingFiles.length;
			progress.max = StatusBar.max;
		} else {
			StatusBar.parentHTML.createSpan({
				text: (() => {
					switch (status) {
					case STATUS.CACHING:
						return "🗃️️ Caching";
					case STATUS.DELETING:
						return "🗑️ Deleting";
					}
				})(),
				cls: "bar-element"
			});
		}
	}
}
