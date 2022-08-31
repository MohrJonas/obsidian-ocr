import HocrElement from "./HocrElement";
import Paragraph from "./Paragraph";
import Page from "./Page";
import BoundingBox from "./BoundingBox";

export default class ContentArea implements HocrElement {

	public readonly children: Array<Paragraph>;
	public readonly bounds: BoundingBox;

	constructor(public parent: Page, careaDiv: HTMLDivElement) {
		this.bounds = BoundingBox.fromTitle(careaDiv.title);
		this.children = Array.from(careaDiv.getElementsByClassName("ocr_par"))
			.map((parP) => {
				return new Paragraph(this, parP as HTMLParagraphElement);
			});
	}

}
