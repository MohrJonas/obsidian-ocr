import Word from "./Word";
import HocrElement from "./HocrElement";
import BoundingBox from "./BoundingBox";

/**
 * In-code representation of a hocr line
 * @see {@link HocrElement} for further explanation
 * */
export default class Line implements HocrElement {

	public readonly bounds: BoundingBox;
	public readonly children: Array<HocrElement>;

	constructor(lineP: HTMLSpanElement) {
		this.bounds = BoundingBox.fromTitle(lineP.title);
		this.children = Array.from(lineP.getElementsByClassName("ocrx_word"))
			.map((wordSpan) => {
				return new Word(wordSpan as HTMLSpanElement);
			});
	}
}
