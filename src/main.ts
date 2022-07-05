import { existsSync, readdirSync, readFileSync } from "fs";
import { Notice, Plugin } from "obsidian";
import { tmpdir } from "os";
import * as path from "path";

import { convertToImage } from "./convert";
import Hocr from "./hocr/hocr";
import parseHocr from "./hocr/hocr-parser";
import { performOCR } from "./ocr";
import SearchModal from "./search-modal";
import { loadSettings, SettingsTab } from "./settings";
import { getFileEnding, randomString, vaultPathToAbs } from "./utils";

export default class MyPlugin extends Plugin {

	override async onload() {
		await loadSettings(this);
		this.registerEvent(this.app.vault.on("create", async (file) => {
			if(existsSync(vaultPathToAbs(`.${file.path}.json`))) return;
			const absFilePath = vaultPathToAbs(file.path);
			const fileEnding = getFileEnding(file.name);
			let absOcrPath: string;
			if(!fileEnding) return;
			if (fileEnding == "pdf") {
				const tmpPath = path.join(tmpdir(), randomString(32) + ".png");
				await convertToImage(absFilePath, tmpPath);
				absOcrPath = tmpPath;
			}
			else if(["png", "jpg", "jpeg"].contains(fileEnding)) {
				absOcrPath = absFilePath;
			}
			else return;
			const indexingNotice = new Notice(`Indexing ${file.name}...`, undefined);
			const hocr = await performOCR(absOcrPath);
			if(!hocr) return;
			const hocrObj = parseHocr(file.path, hocr);
			this.app.vault.create(`.${file.path}.json`, JSON.stringify(hocrObj, null, 2));
			indexingNotice.hide();
		}));
		this.addSettingTab(new SettingsTab(this.app, this));
		this.addCommand({
			id: "search-ocr",
			name: "Search OCR",
			callback: () => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				//@ts-ignore
				const jsonFiles: Array<string> = readdirSync(this.app.vault.adapter.basePath).filter((path) => { return getFileEnding(path) == "json"; });
				const hocrs: Array<Hocr> = jsonFiles.map((jsonFile) => { return Hocr.from_JSON(JSON.parse(readFileSync(vaultPathToAbs(jsonFile)).toString())); });
				new SearchModal(this.app, this, hocrs).open();
			}
		});
	}
}