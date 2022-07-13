import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { Plugin, TFile, TFolder } from "obsidian";
import { loadSettings, SettingsTab } from "./settings";
import { doesProgramExist, filePathToJsonPath, listAllFiles, openSearchModal, processFile, removeAllJsonFiles, vaultPathToAbs } from "./utils";
import { StatusBar } from "./status-bar";
import { DependencyModal } from "./dependency-modal";
export default class MyPlugin extends Plugin {

	override async onload() {
		new DependencyModal(this.app, await doesProgramExist("tesseract"), await doesProgramExist("gmasd"), await doesProgramExist("gs")).open();
		await loadSettings(this);
		(await listAllFiles(this.app.vault)).forEach(async (file) => { await processFile(this, file, this.app.vault); });
		this.registerEvent(this.app.vault.on("create", async (file) => {
			if (file instanceof TFolder) return;
			await processFile(this, file as TFile, this.app.vault);
		}));
		this.registerEvent(this.app.vault.on("delete", async (file) => {
			const absJsonFilePath = vaultPathToAbs(this.app.vault, filePathToJsonPath(file.path));
			if (!existsSync((absJsonFilePath))) return;
			unlinkSync(absJsonFilePath);
		}));
		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
			const oldAbsJsonFilePath = vaultPathToAbs(this.app.vault, filePathToJsonPath(oldPath));
			if (!existsSync(oldAbsJsonFilePath)) return;
			const newJsonFilePath = vaultPathToAbs(this.app.vault, filePathToJsonPath(file.path));
			renameSync(oldAbsJsonFilePath, newJsonFilePath);
			const jsonObject = JSON.parse(readFileSync(newJsonFilePath).toString());
			jsonObject.original_file = filePathToJsonPath(file.path);
			writeFileSync(newJsonFilePath, JSON.stringify(jsonObject, undefined, 2));
		}));
		this.addSettingTab(new SettingsTab(this.app, this));
		this.addRibbonIcon("magnifying-glass", "Search OCR", () => { openSearchModal(this.app.vault, this.app, this); });
		this.addCommand({ id: "search-ocr", name: "Search OCR", callback: () => { openSearchModal(this.app.vault, this.app, this); } });
		this.addCommand({ id: "delete-json", name: "Delete all transcripts", callback: async () => { 
			await removeAllJsonFiles(this.app.vault); 
			(await listAllFiles(this.app.vault)).forEach(async (file) => { await processFile(this, file, this.app.vault); });
		} });
		StatusBar.setupStatusBar(this.addStatusBarItem());
	}
}