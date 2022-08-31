import BoundingBox from "./BoundingBox";
import HocrElement from "./HocrElement";
import Line from "./Line";

export default class Word implements HocrElement {

	public readonly bounds: BoundingBox | undefined;
	public readonly children: undefined;
	public readonly text: string;

	constructor(public parent: Line, wordS: HTMLSpanElement) {
		this.bounds = BoundingBox.fromTitle(wordS.title);
		this.text = wordS.innerText;
	}
}
