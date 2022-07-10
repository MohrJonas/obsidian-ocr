import HocrPage from "./hocr-page";

export default class Hocr {

	original_file: string;
	pages: Array<HocrPage>;

	constructor(original_file: string, pages: Array<HocrPage>) {
		this.original_file = original_file;
		this.pages = pages;
	}

	flattenText(): string {
		return this.pages.map((hocrPage) => { return hocrPage.words; }).flat().map((word) => { return word.text; }).join(" ");
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static from_JSON(json: any): Hocr {
		const hocr = new Hocr(json.original_file, []);
		hocr.pages = json.pages.map((page: HocrPage, index: number) => { page.parent = hocr; page.page_number = index + 1; return page; });
		return hocr;
	}
}