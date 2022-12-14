import HocrElement from "./HocrElement";
import BoundingBox from "./BoundingBox";
import Line from "./Line";

/**
 * In-code representation of a hocr paragraph
 * @see {@link HocrElement} for further explanation
 * */
export default class Paragraph implements HocrElement {

	public readonly bounds: BoundingBox;
	public readonly children: Array<HocrElement>;

	constructor(parP: HTMLParagraphElement) {
		this.bounds = BoundingBox.fromTitle(parP.title);
		this.children = Array.from(parP.getElementsByClassName("ocr_line"))
			.map((ocrLine) => {
				return new Line(ocrLine as HTMLSpanElement);
			});
	}
}
