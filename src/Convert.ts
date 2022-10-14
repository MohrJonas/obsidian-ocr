import {readFileSync} from "fs";
import {platform, tmpdir} from "os";
import {PDFDocument} from "pdf-lib";
import {fromPath} from "pdf2pic";
import {WriteImageResponse} from "pdf2pic/dist/types/writeImageResponse";
import File from "./File";
import {doesProgramExist} from "./utils/Utils";

/**
 * Convert a file from a pdf to a png
 * @param file The file to convert
 * @returns A list of absolute paths, each representing a page of the pdf
 */
export async function convertPdfToPng(file: File): Promise<Array<string>> {
	const document = await PDFDocument.load(readFileSync(file.absPath), {
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
	const paths = [];
	for (let i = 1; i <= document.getPageCount(); i++) {
		paths.push(((await pdf(i)) as WriteImageResponse).path!);
	}
	return paths;
}

export async function areDepsMet(): Promise<boolean> {
	switch (platform()) {
	case "win32": {
		return (await doesProgramExist("gs") || await doesProgramExist("gswin64")) && await doesProgramExist("gm");
	}
	case "linux": {
		return await doesProgramExist("gs") && await doesProgramExist("gm");
	}
	case "darwin": {
		return await doesProgramExist("gs") && await doesProgramExist("gm");
	}
	default: {
		console.log(`Dependency check not implemented for platform ${platform()}. Assuming everything is okay.`);
		return true;
	}
	}
}
