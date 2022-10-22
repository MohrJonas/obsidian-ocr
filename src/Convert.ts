import {platform, tmpdir} from "os";
import {PDFDocument} from "pdf-lib";
import {fromPath} from "pdf2pic";
import {WriteImageResponse} from "pdf2pic/dist/types/writeImageResponse";
import File from "./File";
import {doesProgramExist} from "./utils/Utils";
import {readFile} from "fs/promises";

/**
 * Convert a file from a pdf to a png
 * @param file The file to convert
 * @returns A list of absolute paths, each representing a page of the pdf
 */
export async function convertPdfToPng(file: File): Promise<Array<string>> {
	const document = await PDFDocument.load(await readFile(file.absPath), {
		ignoreEncryption: true
	});
	const pdf = fromPath(file.absPath, {
		density: 400,
		saveFilename: file.tFile.name,
		format: "png",
		savePath: tmpdir(),
		width: document.getPage(0).getWidth(),
		height: document.getPage(0).getHeight()
	});
	return (await pdf.bulk(-1)).map((response) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return (response as WriteImageResponse).path!;
	});
}

export async function areDepsMet(): Promise<boolean> {
	switch (platform()) {
	case "win32": {
		return (await doesProgramExist("gs") || await doesProgramExist("gswin64")) && await doesProgramExist("gm");
	}
	case "linux":
	case "darwin": {
		return await doesProgramExist("gs") && await doesProgramExist("gm");
	}
	default: {
		console.log(`Dependency check not implemented for platform ${platform()}. Assuming everything is okay.`);
		return true;
	}
	}
}
