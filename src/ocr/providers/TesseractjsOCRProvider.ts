import Tesseract from "tesseract.js";
import OCRProvider from "../OCRProvider";
import { readFile } from "fs/promises";
import SettingsManager from "src/Settings";
import { Setting } from "obsidian";

export default class TesseractJsOCRProvider extends OCRProvider {

	private static readonly DEFAULT_SETTINGS: Record<string, unknown> = {
		"lang": "osd"
	};

	settings: Record<string, unknown>;

	constructor() {
		super();
		const settings = SettingsManager.getOCRProviderSettings(this);
		if (settings)
			this.settings = settings;
		else
			this.settings = TesseractJsOCRProvider.DEFAULT_SETTINGS;
	}

	override getProviderName(): string {
		return "TesseractJs (Experimental)";
	}

	override async isUsable(): Promise<boolean> {
		return true;
	}

	override async getReasonIsUnusable(): Promise<string> {
		return "";
	}

	override displaySettings(element: HTMLElement): void {
		new Setting(element)
			.setName("OCR Language")
			.setDesc("The language used by Tesseract for OCR detection")
			.addDropdown((dd) => {
				TesseractJsOCRProvider.LANGUAGES.forEach((lang) => {
					dd.addOption(lang, lang);
				});
				dd.setValue(this.settings["lang"] as string);
				dd.onChange(async (value) => {
					this.settings.lang = value;
					await SettingsManager.saveOCRProviderSettings(this, this.settings);
				});
			});
	}

	private async performOCRSingle(path: string, worker: Tesseract.Worker) {
		const buffer = await readFile(path);
		return (await worker.recognize(buffer, {}, {
			hocr: true
		})).data.hocr;
	}

	//TODO error handling + proper implementation
	override async performOCR(imagePaths: string[]): Promise<string[]> {
		Tesseract.setLogging(true);
		const worker = await Tesseract.createWorker();
		await worker.loadLanguage(this.settings["lang"] as string);
		await worker.initialize(this.settings["lang"] as string);
		const results = [];
		for (const source in imagePaths) {
			const ocrResult = await this.performOCRSingle(imagePaths[source], worker);
			if (ocrResult) results.push(ocrResult);
			else return undefined;
		}
		return results;
	}

	private static readonly LANGUAGES = [
		"afr",
		"amh",
		"ara",
		"asm",
		"aze",
		"aze_cyrl",
		"bel",
		"ben",
		"bod",
		"bos",
		"bre",
		"bul",
		"cat",
		"ceb",
		"ces",
		"chi_sim",
		"chi_sim_vert",
		"chi_tra",
		"chi_tra_vert",
		"chr",
		"cos",
		"cym",
		"dan",
		"deu",
		"div",
		"dzo",
		"ell",
		"eng",
		"enm",
		"epo",
		"est",
		"eus",
		"fao",
		"fas",
		"fil",
		"fin",
		"fra",
		"frk",
		"frm",
		"fry",
		"gla",
		"gle",
		"glg",
		"grc",
		"guj",
		"hat",
		"heb",
		"hin",
		"hrv",
		"hun",
		"hye",
		"iku",
		"ind",
		"isl",
		"ita",
		"ita_old",
		"jav",
		"jpn",
		"jpn_vert",
		"kan",
		"kat",
		"kat_old",
		"kaz",
		"khm",
		"kir",
		"kmr",
		"kor",
		"kor_vert",
		"lao",
		"lat",
		"lav",
		"lit",
		"ltz",
		"mal",
		"mar",
		"mkd",
		"mlt",
		"mon",
		"mri",
		"msa",
		"mya",
		"nep",
		"nld",
		"nor",
		"oci",
		"ori",
		"osd",
		"pan",
		"pol",
		"por",
		"pus",
		"que",
		"ron",
		"rus",
		"san",
		"sin",
		"slk",
		"slv",
		"snd",
		"spa",
		"spa_old",
		"sqi",
		"srp",
		"srp_latn",
		"sun",
		"swa",
		"swe",
		"syr",
		"tam",
		"tat",
		"tel",
		"tgk",
		"tha",
		"tir",
		"ton",
		"tur",
		"uig",
		"ukr",
		"urd",
		"uzb",
		"uzb_cyrl",
		"vie",
		"yid",
		"yor",
	];
}