import { currentSettings } from "./settings";
import { recognize } from "tesseractocr";

/**
 * Perform OCR on a single file
 * @param source The absolute path of the file to ocr
 * @returns A hocr-string if hocr was successful, undefined otherwise
 */
async function performOCRSingle(source: string): Promise<string | undefined> {
	return await recognize(source, {
		language: currentSettings.ocr_lang,
		output: "hocr" 
	});
}

/**
 * Perform OCR on a list of files in series, returning a list of hocr-files
 * @param sources A list of absolute paths to files to ocr
 * @returns A list of hocr-strings
 */
export async function performOCR(sources: Array<string>): Promise<Array<string>> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	const results = [];
	for(const source in sources) {
		const ocrResult = await performOCRSingle(sources[source]);
		if(ocrResult) results.push(ocrResult);
		else results.push("");
	}
	return results;
}

/**
 * Convert a string to an HTML-Document
 * @param text the text to convert
 * @returns A HTML-Document
 */
export function stringToDoc(text: string): Document {
	return new DOMParser().parseFromString(text, "text/html");
}