import Hocr from "./hocr";
import HocrWord from "./hocr-word";

export default class HocrPage {

	words: Array<HocrWord>;
	parent: Hocr;
	page_number: number;

	constructor(words: Array<HocrWord>) {
		this.words = words;
	}

	static from_HTML(html: Document): HocrPage {
		return new HocrPage(Array.from(html.getElementsByClassName("ocrx_word")).map((span) => { return HocrWord.from_span(span as HTMLSpanElement); }));
	}

}