import Word from "./Word";
import HocrElement from "./HocrElement";
import BoundingBox from "./BoundingBox";
import Paragraph from "./Paragraph";

export default class Line implements HocrElement {

	public readonly bounds: BoundingBox;
	public readonly children: Array<Word>;

	constructor(public parent: Paragraph, lineP: HTMLSpanElement) {
		this.bounds = BoundingBox.fromTitle(lineP.title);
		this.children = Array.from(lineP.getElementsByClassName("ocrx_word"))
			.map((wordSpan) => {
				return new Word(this, wordSpan as HTMLSpanElement);
			});
	}
}
