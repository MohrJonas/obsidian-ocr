import HocrElement from "./HocrElement";
import ContentArea from "./ContentArea";
import BoundingBox from "./BoundingBox";
import Line from "./Line";

export default class Paragraph implements HocrElement {

	public readonly bounds: BoundingBox;
	public readonly children: Array<Line>;

	constructor(public parent: ContentArea, parP: HTMLParagraphElement) {
		this.bounds = BoundingBox.fromTitle(parP.title);
		this.children = Array.from(parP.getElementsByClassName("ocr_line"))
			.map((ocrLine) => {
				return new Line(this, ocrLine as HTMLSpanElement);
			});
	}
}