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
import {OcrQueue} from "./utils/OcrQueue";
import {ChildProcess} from "child_process";
import InstallationProviderManager from "./utils/installation/InstallationProviderManager";
import WindowsInstallationProvider from "./utils/installation/providers/WindowsInstallationProvider";
import DebInstallationProvider from "./utils/installation/providers/DebInstallationProvider";
import Tips from "./Tips";
import DBManager from "./db/DBManager";
import {isFileInIgnoredFolder, isFileValid, shouldFileBeOCRed} from "./utils/FileUtils";
import SimpleLogger, {createSimpleFileLogger, createSimpleLogger, STANDARD_LEVELS} from "simple-node-logger";
import {join} from "path";
import SettingsModal from "./modals/SettingsModal";
import TestSuite from "./utils/TestSuite";
import ArchInstallationProvider from "./utils/installation/providers/ArchInstallationProvider";

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
		ObsidianOCRPlugin.logger.setLevel(<STANDARD_LEVELS>SettingsManager.currentSettings.logLevel);
		ObsidianOCRPlugin.plugin = this;
		OCRProviderManager.addAdditionalPaths();
		await OCRProviderManager.applyHomebrewWorkaround();
		InstallationProviderManager.registerProviders(
			new WindowsInstallationProvider(),
			new DebInstallationProvider(),
			new ArchInstallationProvider()
		);
		OCRProviderManager.registerOCRProviders(new NoOpOCRProvider(), new TesseractOCRProvider());
		await DBManager.init();
		await SettingsManager.validateSettings();
		this.registerEvent(this.app.vault.on("create", async (tFile) => {
			if (tFile instanceof TFolder) return;
			const file = File.fromFile(tFile as TFile);
			if (shouldFileBeOCRed(file, SettingsManager.currentSettings)) {
				await OcrQueue.enqueueFile(file);
			}
		}));
		this.registerEvent(this.app.vault.on("delete", async (tFile) => {
			const file = File.fromFile(tFile as TFile);
			if (!isFileValid(file, SettingsManager.currentSettings)) return;
			ObsidianOCRPlugin.logger.info(`Deleting transcript with path ${file.vaultRelativePath}`);
			const transcript = DBManager.getTranscriptByRelativePath(file.vaultRelativePath);
			if (!transcript) return;
			await DBManager.removeSettingsByRelativePath(file.vaultRelativePath);
			await DBManager.removeTranscriptByPath(transcript.relativePath);
		}));
		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			const newFile = File.fromFile(file as TFile);
			if (!shouldFileBeOCRed(newFile, SettingsManager.currentSettings)) return;
			await DBManager.updateTranscriptPath(oldPath, newFile.vaultRelativePath);
		}));
		this.app.workspace.onLayoutReady(async () => {
			if (SettingsManager.currentSettings.showTips) Tips.showRandomTip();
			if (SettingsManager.currentSettings.ocrProviderName == "NoOp")
				new Notice("Don't forget to select an OCR Provider in the settings.");
			processVault(SettingsManager.currentSettings);
		});
		this.app.workspace.on("quit", () => {
			ObsidianOCRPlugin.children.forEach((child) => {
				child.kill();
			});
			DBManager.dispose();
		});
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFolder)
					menu.addItem((item) => {
						item.setIcon("note-glyph");
						const result = DBManager.getIgnoredFolderByPath(file.path);
						if (result) {
							item.setTitle("Unignore folder for OCR")
								.onClick(async () => {
									DBManager.removeIgnoredFolderById(result.id);
									await DBManager.saveDB();
									processVault(SettingsManager.currentSettings);
								});
							if (isFileInIgnoredFolder(file))
								item.setDisabled(true);
						} else {
							item.setTitle("Ignore folder for OCR")
								.onClick(async () => {
									DBManager.addIgnoredFolder(file.path);
									await DBManager.saveDB();
									DBManager.getAllTranscripts().filter((transcript) => {
										return isFileInIgnoredFolder(File.fromVaultRelativePath(transcript.relativePath));
									}).forEach((transcript) => {
										DBManager.removeTranscriptByPath(transcript.relativePath);
									});
									await DBManager.saveDB();
								});
							if (isFileInIgnoredFolder(file))
								item.setDisabled(true);
						}
					});
				else if (isFileValid(File.fromFile(file as TFile), SettingsManager.currentSettings))
					menu.addItem((item) => {
						item.setTitle("Custom OCR settings")
							.setIcon("note-glyph")
							.onClick(() => {
								new SettingsModal(file.path).open();
							});
						if (isFileInIgnoredFolder(File.fromFile(file as TFile)))
							item.setDisabled(true);
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
				if (StatusBar.hasStatus(STATUS.INDEXING))
					new Notice("Deleting is not available while indexing");
				else {
					await removeAllJsonFiles();
					DBManager.deleteAllTranscripts();
					processVault(SettingsManager.currentSettings);
				}
			},
		});
		this.addCommand({
			id: "run-tests",
			name: "Run Obsidian-OCR unit tests",
			callback: () => {
				TestSuite.forEach((test) => {
					test.run();
				});
			}
		});
		StatusBar.setupStatusBar(this.addStatusBarItem());
	}
}
