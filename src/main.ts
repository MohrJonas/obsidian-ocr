import { existsSync, readFileSync } from "fs";
import { Notice, Plugin, TFile } from "obsidian";
import Hocr from "./hocr/hocr";
import { performOCR, stringToDoc } from "./ocr";
import SearchModal from "./search-modal";
import { loadSettings, SettingsTab } from "./settings";
import { filePathToJsonPath, FILE_TYPE, getAllJsonFiles, getFileType, isFileValid, vaultPathToAbs } from "./utils";
import { convertPdfToPng } from "./convert";
import HocrPage from "./hocr/hocr-page";
export default class MyPlugin extends Plugin {

	override async onload() {
		await loadSettings(this);
		this.registerEvent(this.app.vault.on("create", async (file) => {
			if (existsSync(vaultPathToAbs(filePathToJsonPath(file.path))) || !(await isFileValid(file as TFile))) return;
			const processingNotice = new Notice(`Processing file ${file.name}`);
			switch (getFileType(file as TFile)) {
			case FILE_TYPE.PDF: {
				const imagePaths = await convertPdfToPng(file as TFile);
				performOCR(imagePaths).then((ocrResults) => {
					const hocr = new Hocr(
						file.path,
						this.manifest.version,
						ocrResults.map((ocrResult) => { return HocrPage.from_HTML(stringToDoc(ocrResult)); })
					);
					this.app.vault.create(filePathToJsonPath(file.path), JSON.stringify(hocr, null, 2));
					processingNotice.hide();
					const doneNotice = new Notice(`Done processing ${file.name}`);
					setTimeout(() => { doneNotice.hide; }, 2000);
				});
				break;
			}
			case FILE_TYPE.IMAGE: {
				performOCR([vaultPathToAbs(file.path)]).then((ocrResults) => {
					const hocr = new Hocr(file.path, this.manifest.version, [HocrPage.from_HTML(stringToDoc(ocrResults[0]))]);
					this.app.vault.create(filePathToJsonPath(file.path), JSON.stringify(hocr, null, 2));
					processingNotice.setMessage("Done");
					setTimeout(() => { processingNotice.hide(); }, 2000);
				});
				break;
			}
			}
		}));
		this.registerEvent(this.app.vault.on("delete", async (file) => {
			console.log("delete called");
			const jsonFilePath = filePathToJsonPath(file.path);
			console.log(jsonFilePath);
			console.log(existsSync(vaultPathToAbs(jsonFilePath)));
			console.log(await isFileValid(file as TFile));
			if(!existsSync(vaultPathToAbs(jsonFilePath)) || !await isFileValid(file as TFile)) return;
			this.app.vault.delete(this.app.vault.getAbstractFileByPath(jsonFilePath) as TFile);
		}));
		this.addSettingTab(new SettingsTab(this.app, this));
		this.addRibbonIcon("magnifying-glass", "Search OCR", () => { this.openSearchModal(); });
		this.addCommand({ id: "search-ocr", name: "Search OCR", callback: () => { this.openSearchModal(); } });
	}

	openSearchModal() {
		getAllJsonFiles().then((jsonFiles) => {
			const hocrs = jsonFiles.map((jsonFile) => { return Hocr.from_JSON(JSON.parse(readFileSync(jsonFile).toString())); });
			new SearchModal(this.app, this, hocrs).open();
		});
	}
}