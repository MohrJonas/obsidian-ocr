import async, {QueueObject} from "async";
import {StatusBar} from "../StatusBar";
import TranscriptCache from "../TranscriptCache";
import File from "../File";
import SettingsManager from "../Settings";
import {processFile} from "./FileOps";
import Transcript from "../hocr/Transcript";
import {isFileOCRable} from "./FileUtils";
import { clearTimeout, setTimeout } from "timers";


export class OcrQueue {

	static ocrQueue: QueueObject<File>;
	static processChangeTimer: NodeJS.Timeout;

	public static getQueue() {
		this.ocrQueue = this.ocrQueue || async.queue(async function (file, callback) {
			const transcript = await processFile(file);
			if (!transcript) return;
			TranscriptCache.add(transcript);
			app.vault.create(file.jsonFile.vaultRelativePath, Transcript.encode(transcript));
			StatusBar.removeIndexingFile(file);
			callback();
		}, SettingsManager.currentSettings.concurrentIndexingProcesses);
		return this.ocrQueue;
	}

	public static async enqueueFile(file: File) {
		if (!await isFileOCRable(file)) return;
		this.getQueue().push(file);
		StatusBar.addIndexingFile(file);
	}

	public static _changeMaxProcesses(processes: number) {
		OcrQueue.getQueue().concurrency = processes;
	}

	public static changeMaxProcesses(processes: number) {
		if (this.processChangeTimer) {
			clearTimeout(this.processChangeTimer);
		}
		this.processChangeTimer = setTimeout(this._changeMaxProcesses, 5000, processes);
	}


}
