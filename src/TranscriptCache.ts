import Transcript from "./hocr/Transcript";
import Worker from "./CacheWorker.worker";
import {StatusBar} from "./StatusBar";
import {readFile} from "fs/promises";
import {getAllJsonFiles} from "./utils/FileUtils";

export default abstract class TranscriptCache {

	private static readonly toRemove: Array<Transcript> = [];
	private static readonly toAdd: Array<Transcript> = [];
	private static cacheBackend: Array<Transcript> = [];
	private static populated = false;

	static populate() {
		StatusBar.addStatusCaching();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const worker = new Worker();
		worker.onmessage = (message: { data: Array<Transcript> }) => {
			worker.terminate();
			TranscriptCache.cacheBackend.push(...message.data);
			TranscriptCache.cacheBackend.push(...TranscriptCache.toAdd);
			TranscriptCache.toRemove.forEach((transcript) => {
				TranscriptCache.cacheBackend.remove(transcript);
			});
			TranscriptCache.populated = true;
			StatusBar.removeStatusCaching();
		};
		getAllJsonFiles().then((jsonFiles) => {
			Promise.all(jsonFiles.map((jsonFile) => {
				return readFile(jsonFile);
			})).then((jsonFileBuffers) => {
				worker.postMessage(jsonFileBuffers.map((jsonFileBuffer) => {
					return jsonFileBuffer.toString();
				}));
			});
		});
	}

	static remove(transcript: Transcript) {
		if (!TranscriptCache.populated) {
			console.log("Cache not yet populated. Saving for later");
			TranscriptCache.toRemove.push(transcript);
		} else TranscriptCache.cacheBackend.remove(transcript);
	}

	static add(transcript: Transcript) {
		if (!TranscriptCache.populated) {
			console.log("Cache not yet populated. Saving for later");
			TranscriptCache.toAdd.push(transcript);
		} else TranscriptCache.cacheBackend.push(transcript);
	}

	static contains(filter: (transcript: Transcript) => boolean): boolean {
		if (TranscriptCache.populated) return TranscriptCache.cacheBackend.filter((transcript) => {
			return filter(transcript);
		}).length == 0;
		return TranscriptCache.toAdd.filter((transcript) => {
			return filter(transcript);
		}).length == 0;
	}

	static filter(filter: (transcript: Transcript) => boolean): Array<Transcript> {
		if (TranscriptCache.populated) return TranscriptCache.cacheBackend.filter((transcript) => {
			return filter(transcript);
		});
		return TranscriptCache.toAdd.filter((transcript) => {
			return filter(transcript);
		});
	}

	static getAll(): Array<Transcript> {
		if (TranscriptCache.populated) return TranscriptCache.cacheBackend;
		return TranscriptCache.toAdd;
	}
}
