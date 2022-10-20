import async, { QueueObject } from "async";
import { StatusBar } from "src/StatusBar";
import TranscriptCache from "src/TranscriptCache";
import File from "../File";
import SettingsManager from "../Settings";
import { processFile } from "./FileOps";
import Transcript from "../hocr/Transcript";
import { isFileOCRable } from "./FileUtils";



export class OcrQueue {

	static ocrQueue: QueueObject<File>;

	public static getQueue() {
		this.ocrQueue = this.ocrQueue || async.queue(async function (file, callback) {
			const transcript = await processFile(file);
			if (!transcript) return;
			TranscriptCache.add(transcript);
			app.vault.create(file.jsonFile.vaultRelativePath, Transcript.encode(transcript));

			StatusBar.removeIndexingFile(file);
			callback();
		}, SettingsManager.currentSettings.concurrentProcesses);
		return this.ocrQueue;
	}

	public static async enqueueFile(file: File) {
		if (! await isFileOCRable(file)) return;
		this.getQueue().push(file);
		StatusBar.addIndexingFile(file);
	}

	public static changeMaxProcesses(processes: number) {
		this.getQueue().concurrency = processes;
	}


}