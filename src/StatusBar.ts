import File from "./File";
import {OcrQueue} from "./utils/OcrQueue";
import ObsidianOCRPlugin from "./Main";

export enum STATUS {
    INDEXING,
    DELETING
}

/**
 * Statusbar item
 * */
export abstract class StatusBar {

	private static parentHTML: HTMLElement;
	private static indexingFiles: Array<File> = [];
	private static currentStatus: Set<STATUS> = new Set();
	private static maxIndexingFile = 0;

	private static paused = false;

	static setupStatusBar(parentHTML: HTMLElement) {
		StatusBar.parentHTML = parentHTML;
		StatusBar.parentHTML.onclick = () => {
			if (OcrQueue.getQueue().paused)
				OcrQueue.getQueue().resume();
			else
				OcrQueue.getQueue().pause();
			StatusBar.paused = OcrQueue.getQueue().paused;
			StatusBar.updateText();
		};
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

	static hasStatus(status: STATUS): boolean {
		return StatusBar.currentStatus.has(status);
	}

	private static updateText() {
		if(!StatusBar.parentHTML)
			ObsidianOCRPlugin.logger.warn("StatusBar parentHTML not yet defined, ignoring");
		else
			StatusBar.parentHTML.replaceChildren();
		StatusBar.currentStatus.forEach((status) => {
			StatusBar.statusToString(status);
		});
	}

	private static statusToString(status: STATUS) {
		if (status == STATUS.INDEXING) {
			StatusBar.parentHTML.createSpan({
				text: `${StatusBar.paused ? "⏸️" : ""}🔎 Indexing (${StatusBar.maxIndexingFile - StatusBar.indexingFiles.length}/${StatusBar.maxIndexingFile})`,
				cls: "bar-element"
			});
			const progress = StatusBar.parentHTML.createEl("progress", {
				cls: "bar-element"
			});
			progress.value = StatusBar.maxIndexingFile - StatusBar.indexingFiles.length;
			progress.max = StatusBar.maxIndexingFile;
		} else StatusBar.parentHTML.createSpan({
			text: "🗑️ Deleting",
			cls: "bar-element"
		});
	}
}
