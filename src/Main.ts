import {existsSync} from "fs";
import {Notice, Plugin, TFile, TFolder} from "obsidian";
import {STATUS, StatusBar} from "./StatusBar";
import {SettingsTab} from "./SettingsTab";
import SettingsManager from "./Settings";
import OCRProviderManager from "./ocr/OCRProviderManager";
import NoOpOCRProvider from "./ocr/providers/NoOpOCRProvider";
import TesseractOCRProvider from "./ocr/providers/TesseractOCRProvider";
import TranscriptCache from "./TranscriptCache";
import {rename, unlink, writeFile} from "fs/promises";
import File from "./File";
import Transcript from "./hocr/Transcript";
import {processVault, removeAllJsonFiles} from "./utils/FileOps";
import SearchModal from "./modals/SearchModal";
import {areDepsMet} from "./Convert";
import {OcrQueue} from "./utils/OcrQueue";
import {ChildProcess} from "child_process";
import InstallationProviderManager from "./utils/installation/InstallationProviderManager";
import WindowsInstallationProvider from "./utils/installation/WindowsInstallationProvider";
import DebInstallationProvider from "./utils/installation/DebInstallationProvider";
import Tips from "./Tips";

export default class ObsidianOCRPlugin extends Plugin {

	public static plugin: Plugin;
	public static children: Array<ChildProcess> = [];

	/*
    * Main entrypoint of the plugin
    */
	override async onload() {
		await SettingsManager.loadSettings(this);
		ObsidianOCRPlugin.plugin = this;
		OCRProviderManager.addAdditionalPaths();
		await OCRProviderManager.applyHomebrewWorkaround();
		InstallationProviderManager.registerProviders(new WindowsInstallationProvider(), new DebInstallationProvider());
		OCRProviderManager.registerOCRProviders(new NoOpOCRProvider(), new TesseractOCRProvider());
		this.registerEvent(this.app.vault.on("create", async (tFile) => {
			if (tFile instanceof TFolder) return;
			const file = File.fromFile(tFile as TFile);
			OcrQueue.enqueueFile(file);
		}));
		this.registerEvent(this.app.vault.on("delete", async (tFile) => {
			if (tFile instanceof TFolder) {
				TranscriptCache.rebuildCache();
				return;
			}
			const file = File.fromFile(tFile as TFile);
			if (file.jsonFile && existsSync(file.jsonFile.absPath)) {
				TranscriptCache.remove(await Transcript.load(file.jsonFile.absPath));
				unlink(file.jsonFile.absPath);
			}
		}));
		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			const oldFile = File.fromVaultRelativePath(oldPath);
			const newFile = File.fromFile(file as TFile);
			if (!oldFile.jsonFile) return;
			const transcript = TranscriptCache.filter((transcript) => {
				return transcript.originalFilePath == oldFile.vaultRelativePath;
			})[0];
			transcript.originalFilePath = newFile.vaultRelativePath;
			await rename(oldFile.jsonFile.absPath, newFile.jsonFile.absPath);
			writeFile(newFile.jsonFile.absPath, Transcript.encode(transcript));
		}));
		this.app.workspace.onLayoutReady(async () => {
			if(SettingsManager.currentSettings.showTips) Tips.showRandomTip();
			if (!await areDepsMet()) new Notice("Dependecies aren't met");
			if (SettingsManager.currentSettings.ocrProviderName == "NoOp") new Notice("Don't forget to select an OCR Provider in the settings.");
			TranscriptCache.populate();
			processVault();
		});
		this.app.workspace.on("quit", () => {
			ObsidianOCRPlugin.children.forEach((child) => {
				child.kill();
			});
		});
		this.addSettingTab(new SettingsTab(this.app, this));
		this.addRibbonIcon("magnifying-glass", "Search OCR", () => {
			SearchModal.open();
		});
		this.addCommand({
			id: "search-ocr", name: "Search OCR", callback: () => {
				SearchModal.open();
			}
		});
		this.addCommand({
			id: "delete-json",
			name: "Delete all transcripts",
			callback: async () => {
				if (StatusBar.hasStatus(STATUS.CACHING))
					new Notice("Deleting is not available while caching");
				else if (StatusBar.hasStatus(STATUS.INDEXING))
					new Notice("Deleting is not available while indexing");
				else {
					await removeAllJsonFiles();
					processVault();
				}
			},
		});
		StatusBar.setupStatusBar(this.addStatusBarItem());
	}
}
