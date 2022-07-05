import { currentSettings } from "./settings";
import { recognize } from "tesseractocr";

export async function performOCR(source: string): Promise<string | undefined> {
	return await recognize(source, {
		language: currentSettings.ocr_lang,
		output: "hocr" 
	});
}