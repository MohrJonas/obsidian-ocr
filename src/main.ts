import { existsSync } from "fs";
import { Plugin } from "obsidian";
import { tmpdir } from "os";
import * as path from "path";

import { convertToImage } from "./convert";
import { performOCR } from "./ocr";
import { loadSettings, SettingsTab } from "./settings";
import { getFileEnding, randomString, vaultPathToAbs } from "./utils";

export default class MyPlugin extends Plugin {

	async onload() {
		await loadSettings(this);
		this.registerEvent(this.app.vault.on("create", async (file) => {
			if(existsSync(vaultPathToAbs(`${file.path}.md`))) return;
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
			const text = await performOCR(absOcrPath);
			if(!text) return;
			this.app.vault.create(`${file.path}.md`, text);
		}));
		this.addSettingTab(new SettingsTab(this.app, this));
	}
}