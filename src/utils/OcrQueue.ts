import async, {QueueObject} from "async";
import {StatusBar} from "../StatusBar";
import File from "../File";
import SettingsManager from "../Settings";
import {processFile} from "./FileOps";
import {clearTimeout, setTimeout} from "timers";
import DBManager from "../DBManager";
import Page from "../hocr/Page";


export class OcrQueue {

	static ocrQueue: QueueObject<File>;
	static processChangeTimer: NodeJS.Timeout;

	public static getQueue() {
		this.ocrQueue = this.ocrQueue || async.queue(async function (file, callback) {
			const transcript = await processFile(file);
			if (!transcript) return;
			DBManager.insertTranscript(file.vaultRelativePath, transcript.children as Array<Page>);
			//TranscriptCache.add(transcript);
			//app.vault.create(file.jsonFile.vaultRelativePath, Transcript.encode(transcript));
			StatusBar.removeIndexingFile(file);
			callback();
		}, SettingsManager.currentSettings.concurrentIndexingProcesses);
		return this.ocrQueue;
	}

	public static async enqueueFile(file: File) {
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
