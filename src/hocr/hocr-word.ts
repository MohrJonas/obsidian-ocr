import HocrBounds from "./hocr-bounds";

export default class HocrWord {

	text: string;
	bounds: HocrBounds;

	constructor(text: string, bounds: HocrBounds) {
		this.text = text;
		this.bounds = bounds;
	}

	static from_span(span: HTMLSpanElement): HocrWord {
		const titleParts: Array<string> = span.title.split(" ");
		titleParts.shift();
		const boundParts: Array<number> = titleParts.map((part) => { return parseInt(part); });
		return new HocrWord(span.innerText, new HocrBounds(boundParts[0], boundParts[1], boundParts[2], boundParts[3]));
	}

}