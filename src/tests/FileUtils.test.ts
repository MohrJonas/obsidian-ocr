import {FILE_TYPE, getFileType, isFileValid} from "../utils/FileUtils";
import {expect} from "chai";
import {describe, test} from "../utils/Test";
import File from "../File";
import {Settings} from "../Settings";

const settings: Settings = {
	ocrProviderName: "NoOp",
	ocrProviderSettings: {},
	fuzzySearch: true,
	caseSensitive: false,
	ocrImage: true,
	ocrPDF: true,
	concurrentIndexingProcesses: 1,
	concurrentCachingProcesses: 10,
	additionalSearchPath: "",
	density: 300,
	quality: 98,
	additionalImagemagickArgs: "",
	showTips: true,
	logToFile: false,
	logLevel: "all"
};

export default [
	describe("Check if `isFileValid` returns the correct value",
		test("check !png && !img", () => {
			const file = File.fromVaultRelativePath("some/path.md");
			expect(isFileValid(file, settings)).to.be.false;
		}),
		test("check png && ocrImage", () => {
			const file = File.fromVaultRelativePath("some/image.png");
			expect(isFileValid(file, settings)).to.be.true;
		}),
		test("check png && !ocrImage", () => {
			const file = File.fromVaultRelativePath("some/image.png");
			const notOcrImgSettings = Object.assign(settings, {ocrImage: false});
			expect(isFileValid(file, notOcrImgSettings)).to.be.false;
		}),
		test("check pdf && ocrPdf", () => {
			const file = File.fromVaultRelativePath("some/document.pdf");
			expect(isFileValid(file, settings)).to.be.true;
		}),
		test("check pdf && !ocrPdf", () => {
			const file = File.fromVaultRelativePath("some/document.pdf");
			const notOcrPdfSettings = Object.assign(settings, {ocrPDF: false});
			expect(isFileValid(file, notOcrPdfSettings)).to.be.false;
		}),
	),
	describe("Check if `getFileType returns the correct file type`",
		test("check pdf", () => {
			const file = File.fromVaultRelativePath("some/image.png");
			expect(getFileType(file)).to.eq(FILE_TYPE.IMAGE);
		}),
		test("check pdf", () => {
			const file = File.fromVaultRelativePath("some/document.pdf");
			expect(getFileType(file)).to.eq(FILE_TYPE.PDF);
		}),
		test("check other", () => {
			const file = File.fromVaultRelativePath("some/path.md");
			expect(getFileType(file)).to.eq(FILE_TYPE.IMAGE);
		})
	)
];