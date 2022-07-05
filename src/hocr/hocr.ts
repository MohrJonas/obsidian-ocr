import HocrWord from "./hocr-word";

export default class Hocr {

	original_file: string;
	words: Array<HocrWord>;

	constructor(original_file: string, words: Array<HocrWord>) {
		this.original_file = original_file;
		this.words = words;
	}

	flattenText(): string {
		return this.words.map((hocrWord) => { return hocrWord.text; }).join(" ");
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static from_JSON(json: any): Hocr {
		return new Hocr(json.original_file, json.words);
	}

	static from_HTML(original_file: string, html: Document): Hocr {
		return new Hocr(original_file, Array.from(html.getElementsByClassName("ocrx_word")).map((span) => { return HocrWord.from_span(span as HTMLSpanElement); }));
	}
}