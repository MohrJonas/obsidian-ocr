import { existsSync, readFileSync } from "fs";
import { Notice, Plugin } from "obsidian";
import { tmpdir } from "os";
import Hocr from "./hocr/hocr";
import parseHocr from "./hocr/hocr-parser";
import { performOCR } from "./ocr";
import SearchModal from "./search-modal";
import { loadSettings, SettingsTab } from "./settings";
import { getFileEnding, vaultPathToAbs } from "./utils";
import { fromPath } from "pdf2pic";
import { WriteImageResponse } from "pdf2pic/dist/types/writeImageResponse";
import { PDFDocument } from "pdf-lib";
import { basename, dirname, join } from "path";
import { glob } from "glob";

export default class MyPlugin extends Plugin {

	override async onload() {
		await loadSettings(this);
		this.registerEvent(this.app.vault.on("create", async (file) => {
			if (existsSync(vaultPathToAbs(`${join(basename(dirname(file.path)), "." + file.name)}.json`))) return;
			const fileEnding = getFileEnding(file.name);
			if (!fileEnding || !["pdf", "png", "jpg", "jpeg"].contains(fileEnding)) return;
			const notice = new Notice(`Working on ${file.name}`, Number.MAX_VALUE);
			const absFilePath = vaultPathToAbs(file.path);
			const hocr = new Hocr(file.path, []);
			if (fileEnding == "pdf") {
				const document = await PDFDocument.load(readFileSync(absFilePath));
				const pdf = fromPath(absFilePath, {
					density: 400,
					saveFilename: file.name,
					format: "png",
					savePath: tmpdir(),
					width: document.getPage(0).getWidth(),
					height: document.getPage(0).getHeight()
				});
				const promises = [];
				for (let i = 1; i <= document.getPageCount(); i++) {
					promises.push(pdf(i));
				}
				const results = await Promise.all(promises);
				const ocrResults = await Promise.all(results.map((result) => performOCR((result as WriteImageResponse).path as string)));
				ocrResults.forEach((result) => {
					hocr.pages.push(parseHocr(result as string));
				});
			}
			else {
				hocr.pages.push(parseHocr(await performOCR(absFilePath) as string));
			}
			this.app.vault.create(`${join(basename(dirname(file.path)), "." + file.name)}.json`, JSON.stringify(hocr, null, 2));
			notice.hide();
		}));
		this.addSettingTab(new SettingsTab(this.app, this));
		this.addCommand({
			id: "search-ocr",
			name: "Search OCR",
			callback: () => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				//@ts-ignore
				glob(`${this.app.vault.adapter.basePath}/**/*.json`, {
					dot: true,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					//@ts-ignore
					ignore: [`${this.app.vault.adapter.basePath}/.obsidian/**/*`]
				}, (err, matches) => {
					if (err) new Notice(err.message);
					const hocrs: Array<Hocr> = matches.map((jsonFile) => { return Hocr.from_JSON(JSON.parse(readFileSync(jsonFile).toString())); });
					new SearchModal(this.app, this, hocrs).open();
				});
			}
		});
	}
}