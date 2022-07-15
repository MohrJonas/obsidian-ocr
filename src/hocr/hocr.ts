import HocrPage from "./hocr-page";

export default class Hocr {

	ocrVersion: string;
	originalFile: string;
	pages: Array<HocrPage>;

	constructor(originalFile: string, version: string, pages: Array<HocrPage>) {
		this.originalFile = originalFile;
		this.ocrVersion = version;
		this.pages = pages;
	}

	flattenText(): string {
		return this.pages.map((hocrPage) => { return hocrPage.words; }).flat().map((word) => { return word.text; }).join(" ");
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static fromJSON(json: any): Hocr {
		const hocr = new Hocr(json.originalFile, json.version, []);
		hocr.pages = json.pages.map((page: HocrPage, index: number) => { page.parent = hocr; page.pageNumber = index + 1; return page; });
		return hocr;
	}
}