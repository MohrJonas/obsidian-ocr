import HocrElement from "./HocrElement";
import ContentArea from "./ContentArea";
import BoundingBox from "./BoundingBox";
import {parseTitle} from "../utils/HocrUtils";

export default class Page implements HocrElement {

	public readonly children: Array<HocrElement>;
	public readonly bounds: BoundingBox;
	public readonly titleProperties: Record<string, string>;

	constructor(pageDiv: HTMLDivElement, public thumbnail: string, public pageNumber: number) {
		this.titleProperties = parseTitle(pageDiv.title);
		this.bounds = BoundingBox.fromTitle(this.titleProperties["bbox"]);
		this.children = Array.from(pageDiv.getElementsByClassName("ocr_carea"))
			.map((careaDiv) => {
				return new ContentArea(careaDiv as HTMLDivElement);
			});
	}

}
