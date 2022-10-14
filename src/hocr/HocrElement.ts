import BoundingBox from "./BoundingBox";
import ContentArea from "./ContentArea";
import Paragraph from "./Paragraph";
import Word from "./Word";
import Transcript from "./Transcript";
import Page from "./Page";
import Line from "./Line";

export default interface HocrElement {

	bounds: BoundingBox | undefined;
	parent: ContentArea | Line | Page | Paragraph | Word | Transcript | undefined;
	children: Array<ContentArea | Line | Page | Paragraph | Word | Transcript> | undefined;

}
