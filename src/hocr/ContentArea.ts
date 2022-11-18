import HocrElement from "./HocrElement";
import Paragraph from "./Paragraph";
import BoundingBox from "./BoundingBox";

export default class ContentArea implements HocrElement {

	public readonly children: Array<HocrElement>;
	public readonly bounds: BoundingBox;

	constructor(careaDiv: HTMLDivElement) {
		this.bounds = BoundingBox.fromTitle(careaDiv.title);
		this.children = Array.from(careaDiv.getElementsByClassName("ocr_par"))
			.map((parP) => {
				return new Paragraph(parP as HTMLParagraphElement);
			});
	}

}
