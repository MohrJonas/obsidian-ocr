import Transcript from "./hocr/Transcript";
import {StatusBar} from "./StatusBar";
import {readFile} from "fs/promises";
import {getAllJsonFiles} from "./utils/FileUtils";
import async, {QueueObject} from "async";
import Worker from "./CacheWorker.worker";
import File from "./File";
import {clearTimeout, setTimeout} from "timers";
import SettingsManager from "./Settings";

export default abstract class TranscriptCache {

	private static cacheBackend: Array<Transcript> = [];
	private static queue: QueueObject<File>;
	private static processChangeTimer: NodeJS.Timeout;

	static async populate() {
		const jsonFiles = await getAllJsonFiles();
		StatusBar.setMaxCachingFile(jsonFiles.length);
		TranscriptCache.queue = async.queue(async (file, callback) => {
			StatusBar.addCachingFile(file);
			const fileContents = await readFile(file.absPath, {
				encoding: "utf-8"
			});
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const worker = new Worker();
			worker.onmessage = (message: { data: Transcript }) => {
				worker.terminate();
				TranscriptCache.cacheBackend.push(message.data);
				StatusBar.removeCachingFile(file);
				callback();
			};
			worker.postMessage(fileContents);
		}, SettingsManager.currentSettings.concurrentCachingProcesses);
		jsonFiles.forEach((jsonFile) => {
			TranscriptCache.queue.push(jsonFile);
		});
	}

	static remove(transcript: Transcript) {
		TranscriptCache.cacheBackend.remove(transcript);
	}

	static add(transcript: Transcript) {
		TranscriptCache.cacheBackend.push(transcript);
	}

	static contains(filter: (transcript: Transcript) => boolean): boolean {
		return TranscriptCache.cacheBackend.filter((transcript) => {
			return filter(transcript);
		}).length == 0;
	}

	static filter(filter: (transcript: Transcript) => boolean): Array<Transcript> {
		return TranscriptCache.cacheBackend.filter((transcript) => {
			return filter(transcript);
		});
	}

	static getAll(): Array<Transcript> {
		return TranscriptCache.cacheBackend;
	}

	static rebuildCache() {
		TranscriptCache.cacheBackend = [];
		TranscriptCache.populate();
	}

	static _changeMaxProcesses(processes: number) {
		TranscriptCache.queue.concurrency = processes;
	}

	static changeMaxProcesses(processes: number) {
		if (this.processChangeTimer) {
			clearTimeout(this.processChangeTimer);
		}
		this.processChangeTimer = setTimeout(this._changeMaxProcesses, 5000, processes);
	}
}
