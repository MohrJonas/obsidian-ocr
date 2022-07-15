import { currentSettings } from "./settings";
import exec from "@simplyhexagonal/exec";

/**
 * Perform OCR on a single file
 * @param source The absolute path of the file to ocr
 * @returns A hocr-string if hocr was successful, undefined otherwise
 */
async function performOCRSingle(source: string): Promise<{ exitcode: number, text: string }> {
	const execReturn = exec(`tesseract "${source}" stdout -l ${currentSettings.ocrLang} hocr`);
	const result = await execReturn.execPromise;
	if (result.exitCode != 0) {
		return { exitcode: result.exitCode, text: result.stderrOutput };
	}
	return { exitcode: result.exitCode, text: result.stdoutOutput };
}

/**
 * Perform OCR on a list of files in series, returning a list of hocr-files
 * @param sources A list of absolute paths to files to ocr
 * @returns A list of hocr-strings
 */
export async function performOCR(sources: Array<string>): Promise<Array<string>> {
	const results = [];
	for (const source in sources) {
		const ocrResult = await performOCRSingle(sources[source]);
		if (ocrResult.exitcode == 0) results.push(ocrResult.text);
		else {
			console.log(`🥵 Error happened during OCR of file ${sources[source]}, using blank page instead: ${ocrResult.text}`);
			results.push("");
		}
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