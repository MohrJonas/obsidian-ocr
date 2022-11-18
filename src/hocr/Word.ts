import BoundingBox from "./BoundingBox";
import HocrElement from "./HocrElement";

export default class Word implements HocrElement {

	public readonly bounds: BoundingBox;
	public readonly children: undefined;
	public readonly text: string;

	constructor(wordS: HTMLSpanElement) {
		this.bounds = BoundingBox.fromTitle(wordS.title);
		this.text = wordS.innerText;
	}
}
