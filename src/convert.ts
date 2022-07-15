import { readFileSync } from "fs";
import { TFile, Vault } from "obsidian";
import { tmpdir } from "os";
import { PDFDocument } from "pdf-lib";
import { fromPath } from "pdf2pic";
import { WriteImageResponse } from "pdf2pic/dist/types/writeImageResponse";

/**
 * Convert an file from a pdf to a png
 * @param file The file to convert
 * @returns A list of absolute paths, each representing a page of the pdf
 */
export async function convertPdfToPng(vault: Vault, file: TFile): Promise<Array<string>> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	const absFilePath = vault.adapter.getFullPath(file.path);
	const document = await PDFDocument.load(readFileSync(absFilePath));
	const pdf = fromPath(absFilePath, {
		density: 400,
		saveFilename: file.name,
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