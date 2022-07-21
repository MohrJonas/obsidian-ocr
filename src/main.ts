import { readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { Plugin, TFile, TFolder } from "obsidian";
import { loadSettings, SettingsTab } from "./settings";
import { doesProgramExist, filePathToJsonPath, openSearchModal, processFile, processVault, removeAllJsonFiles, vaultPathToAbs } from "./utils";
import { StatusBar } from "./status-bar";
import { DependencyModal } from "./modals/dependency-modal";
export default class ObsidianOCRPlugin extends Plugin {

	override async onload() {
		new DependencyModal(this.app, await doesProgramExist("tesseract"), await doesProgramExist("gm"), await doesProgramExist("gs")).open();
		await loadSettings(this);
		this.registerEvent(this.app.vault.on("create", async (file) => {
			if (file instanceof TFolder) return;
			await processFile(this, file as TFile, this.app.vault);
		}));
		this.registerEvent(this.app.vault.on("delete", async (file) => {
			const jsonFile = this.app.vault.getAbstractFileByPath(filePathToJsonPath(file.path));
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			//@ts-ignore
			if(jsonFile) unlinkSync(this.app.vault.adapter.getFullPath(file.path));
		}));
		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
			const oldJsonFile = this.app.vault.getAbstractFileByPath(oldPath);
			if(!oldJsonFile) return;
			const futureJsonFilePath = vaultPathToAbs(this.app.vault, filePathToJsonPath(file.path));
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			//@ts-ignore
			renameSync(this.app.vault.adapter.getFullPath(oldJsonFile.path), futureJsonFilePath);
			const jsonObject = JSON.parse(readFileSync(futureJsonFilePath).toString());
			jsonObject.originalFile = filePathToJsonPath(file.path);
			writeFileSync(futureJsonFilePath, JSON.stringify(jsonObject, undefined, 2));
		}));
		this.app.workspace.onLayoutReady(async () => {
			processVault(this, this.app.vault);
		});
		this.addSettingTab(new SettingsTab(this.app, this));
		this.addRibbonIcon("magnifying-glass", "Search OCR", () => { openSearchModal(this.app.vault, this.app, this); });
		this.addCommand({ id: "search-ocr", name: "Search OCR", callback: () => { openSearchModal(this.app.vault, this.app, this); } });
		this.addCommand({ id: "delete-json", name: "Delete all transcripts", callback: async () => {
			StatusBar.setStatusBarDeleting();
			await removeAllJsonFiles(this.app.vault);
			processVault(this, this.app.vault);
		} });
		StatusBar.setupStatusBar(this.addStatusBarItem());
	}
}