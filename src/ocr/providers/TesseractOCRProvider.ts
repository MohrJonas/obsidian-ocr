import OCRProvider from "../OCRProvider";
import {doesProgramExist} from "../../utils/Utils";
import {Notice, Setting} from "obsidian";
import exec from "@simplyhexagonal/exec";
import SettingsManager from "../../Settings";
import ObsidianOCRPlugin from "../../Main";
import {EOL} from "os";

/**
 * Tesseract-based implementation of {@link OCRProvider}
 * */
export default class TesseractOCRProvider implements OCRProvider {

	private static readonly DEFAULT_SETTINGS: Record<string, unknown> = {
		"lang": "osd",
		"additionalArguments": ""
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
		new Setting(element)
			.setName("Additional arguments")
			.setDesc("Additional commandline arguments passed to tesseract")
			.addText((tc) => {
				tc.setValue(this.settings.additionalArguments as string);
				tc.onChange(async (value) => {
					this.settings.additionalArguments = value;
					await SettingsManager.saveOCRProviderSettings(this, this.settings);
				});
			});
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

	async performOCRSingle(source: string): Promise<string | undefined> {
		ObsidianOCRPlugin.logger.info(`Performing OCR on ${source} with Tesseract`);
		const execReturn = exec(`tesseract ${this.settings.additionalArguments} "${source}" stdout -l ${this.settings.lang} hocr`);
		ObsidianOCRPlugin.children.push(execReturn.execProcess);
		const result = await execReturn.execPromise;
		if (result.exitCode != 0) {
			ObsidianOCRPlugin.logger.error(`🥵 Error happened during OCR of file ${source}: ${result.stderrOutput}`);
			return undefined;
		}
		return result.stdoutOutput;
	}


	async performOCR(imagePaths: Array<string>): Promise<Array<string> | undefined> {
		const results = [];
		for (const source in imagePaths) {
			const ocrResult = await this.performOCRSingle(imagePaths[source]);
			if (ocrResult) results.push(ocrResult);
			else return undefined;
		}
		return results;
	}
}
