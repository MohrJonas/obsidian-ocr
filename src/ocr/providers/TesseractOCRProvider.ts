import OCRProvider from "../OCRProvider";
import {doesProgramExist} from "../../utils/Utils";
import {Notice, Setting} from "obsidian";
import exec from "@simplyhexagonal/exec";
import SettingsManager from "../../Settings";
import ObsidianOCRPlugin from "../../Main";
import { EOL } from "os";

export default class TesseractOCRProvider implements OCRProvider {

	private static readonly DEFAULT_SETTINGS: Record<string, unknown> = {
		"lang": "osd"
	};
	settings: Record<string, unknown>;

	constructor() {
		const settings = SettingsManager.getOCRProviderSettings(this);
		if (settings)
			this.settings = settings;
		else
			this.settings = TesseractOCRProvider.DEFAULT_SETTINGS;
	}

	async getReasonIsUnusable(): Promise<undefined | string> {
		return (await doesProgramExist("tesseract")) ? undefined : "tesseract wasn't found";
	}

	async displaySettings(element: HTMLElement): Promise<void> {
		const execReturn = exec("tesseract --list-langs");
		const result = await execReturn.execPromise;
		if (result.exitCode != 0) new Notice(result.stderrOutput);
		else {
			const langs = result.stdoutOutput.split(EOL);
			langs.shift();
			langs.pop();
			new Setting(element)
				.setName("OCR Language")
				.setDesc("The language used by Tesseract for OCR detection")
				.addDropdown((dd) => {
					langs.forEach((lang) => {
						dd.addOption(lang, lang);
					});
					dd.setValue(this.settings["lang"] as string);
					dd.onChange(async (value) => {
						this.settings.lang = value;
						await SettingsManager.saveOCRProviderSettings(this, this.settings);
					});
				});
		}
	}

	getProviderName(): string {
		return "Tesseract";
	}

	isUsable(): Promise<boolean> {
		return doesProgramExist("tesseract");
	}

	async performOCRSingle(source: string): Promise<{ exitcode: number, text: string }> {
		const execReturn = exec(`tesseract "${source}" stdout -l ${this.settings.lang} hocr`);
		ObsidianOCRPlugin.children.push(execReturn.execProcess);
		const result = await execReturn.execPromise;
		if (result.exitCode != 0) {
			return {exitcode: result.exitCode, text: result.stderrOutput};
		}
		return {exitcode: result.exitCode, text: result.stdoutOutput};
	}


	async performOCR(imagePaths: Array<string>): Promise<Array<string>> {
		const results = [];
		for (const source in imagePaths) {
			const ocrResult = await this.performOCRSingle(imagePaths[source]);
			if (ocrResult.exitcode == 0) results.push(ocrResult.text);
			else {
				console.log(`🥵 Error happened during OCR of file ${imagePaths[source]}, using blank page instead: ${ocrResult.text}`);
				results.push("");
			}
		}
		return results;
	}
}
