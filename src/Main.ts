import {existsSync} from "fs";
import {Notice, Plugin, TFile, TFolder} from "obsidian";
import {StatusBar} from "./StatusBar";
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
import { OcrQueue } from "./utils/OcrQueue";

export default class ObsidianOCRPlugin extends Plugin {

	public static plugin: Plugin;

	/*
	* Main entrypoint of the plugin
	*/
	override async onload() {
		ObsidianOCRPlugin.plugin = this;
		await SettingsManager.loadSettings(this);
		OCRProviderManager.registerOCRProviders(new NoOpOCRProvider(), new TesseractOCRProvider());
		this.registerEvent(this.app.vault.on("create", async (tFile) => {
			if (tFile instanceof TFolder) return;
			const file = File.fromFile(tFile as TFile);
			OcrQueue.enqueueFile(file);
		}));
		this.registerEvent(this.app.vault.on("delete", async (tFile) => {
			if (tFile instanceof TFolder) return;
			const file = File.fromFile(tFile as TFile);
			if (file.jsonFile && existsSync(file.jsonFile.absPath)) {
				TranscriptCache.remove(await Transcript.load(file.jsonFile.absPath));
				await unlink(file.jsonFile.absPath);
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
			await writeFile(newFile.jsonFile.absPath, Transcript.encode(transcript));
		}));
		this.app.workspace.onLayoutReady(async () => {
			if (!await areDepsMet()) new Notice("Dependecies aren't met");
			if (SettingsManager.currentSettings.ocrProviderName == "NoOp") new Notice("Don't forget to select an OCR Provider in the settings.");
			TranscriptCache.populate();
			processVault();
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
			id: "delete-json", name: "Delete all transcripts", callback: async () => {
				await removeAllJsonFiles();
				processVault();
			}
		});
		StatusBar.setupStatusBar(this.addStatusBarItem());
	}

	 async onLayoutReady() {
	}
}
