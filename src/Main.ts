import {FileSystemAdapter, Notice, Plugin, TFile, TFolder} from "obsidian";
import {STATUS, StatusBar} from "./StatusBar";
import {SettingsTab} from "./SettingsTab";
import SettingsManager from "./Settings";
import OCRProviderManager from "./ocr/OCRProviderManager";
import NoOpOCRProvider from "./ocr/providers/NoOpOCRProvider";
import TesseractOCRProvider from "./ocr/providers/TesseractOCRProvider";
import File from "./File";
import {processVault, removeAllJsonFiles} from "./utils/FileOps";
import SearchModal from "./modals/SearchModal";
import {areDepsMet} from "./Convert";
import {OcrQueue} from "./utils/OcrQueue";
import {ChildProcess} from "child_process";
import InstallationProviderManager from "./utils/installation/InstallationProviderManager";
import WindowsInstallationProvider from "./utils/installation/WindowsInstallationProvider";
import DebInstallationProvider from "./utils/installation/DebInstallationProvider";
import Tips from "./Tips";
import DBManager from "./db/DBManager";
import {isFileOCRable} from "./utils/FileUtils";
import SimpleLogger, {createSimpleFileLogger, createSimpleLogger} from "simple-node-logger";
import {join} from "path";
import SettingsModal from "./modals/SettingsModal";

export default class ObsidianOCRPlugin extends Plugin {

	public static logger: SimpleLogger.Logger;
	public static plugin: Plugin;
	public static children: Array<ChildProcess> = [];

	/*
    * Main entrypoint of the plugin
    */
	override async onload() {
		await SettingsManager.loadSettings(this);
		ObsidianOCRPlugin.logger = SettingsManager.currentSettings.logToFile
			? createSimpleFileLogger(join((app.vault.adapter as FileSystemAdapter).getBasePath(), "obsidian-ocr.log"))
			: createSimpleLogger();
		ObsidianOCRPlugin.logger.setLevel("all");
		ObsidianOCRPlugin.plugin = this;
		OCRProviderManager.addAdditionalPaths();
		await OCRProviderManager.applyHomebrewWorkaround();
		InstallationProviderManager.registerProviders(new WindowsInstallationProvider(), new DebInstallationProvider());
		OCRProviderManager.registerOCRProviders(new NoOpOCRProvider(), new TesseractOCRProvider());
		await DBManager.init();
		this.registerEvent(this.app.vault.on("create", async (tFile) => {
			if (tFile instanceof TFolder) return;
			const file = File.fromFile(tFile as TFile);
			if (!isFileOCRable(file)) return;
			OcrQueue.enqueueFile(file);
		}));
		this.registerEvent(this.app.vault.on("delete", async (tFile) => {
			const file = File.fromFile(tFile as TFile);
			await DBManager.removeTranscriptByPath(file.vaultRelativePath);
		}));
		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			const newFile = File.fromFile(file as TFile);
			await DBManager.updateTranscriptPath(oldPath, newFile.vaultRelativePath);
		}));
		this.app.workspace.onLayoutReady(async () => {
			if (SettingsManager.currentSettings.showTips) Tips.showRandomTip();
			if (!await areDepsMet()) new Notice("Dependecies aren't met");
			if (SettingsManager.currentSettings.ocrProviderName == "NoOp") new Notice("Don't forget to select an OCR Provider in the settings.");
			//TranscriptCache.populate();
			//processVault();
		});
		this.app.workspace.on("quit", () => {
			ObsidianOCRPlugin.children.forEach((child) => {
				child.kill();
				DBManager.dispose();
			});
		});
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFolder || !["png", "pdf", "jpg", "jpeg"].contains((file as TFile).extension)) return;
				menu.addItem((item) => {
					item.setTitle("Custom OCR settings")
						.setIcon("note-glyph")
						.onClick(() => {
							new SettingsModal(file.path).open();
						});
				});
			})
		);
		this.addSettingTab(new SettingsTab(this.app, this));
		this.addRibbonIcon("magnifying-glass", "Search OCR", () => {
			new SearchModal().open();
		});
		this.addCommand({
			id: "search-ocr", name: "Search OCR", callback: () => {
				new SearchModal().open();
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
