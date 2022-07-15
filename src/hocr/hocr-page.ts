import Hocr from "./hocr";
import HocrWord from "./hocr-word";

export default class HocrPage {

	words: Array<HocrWord>;
	parent: Hocr;
	pageNumber: number;

	constructor(words: Array<HocrWord>) {
		this.words = words;
	}

	static fromHTML(html: Document): HocrPage {
		return new HocrPage(Array.from(html.getElementsByClassName("ocrx_word")).map((span) => { return HocrWord.fromSpan(span as HTMLSpanElement); }));
	}

}