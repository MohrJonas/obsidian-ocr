import HocrElement from "../hocr/HocrElement";
import Transcript from "../hocr/Transcript";
import Page from "../hocr/Page";

export function getTranscript(element: HocrElement): Transcript {
	if (element.parent == undefined) return element as Transcript;
	return getTranscript(element.parent);
}

//TODO change that ugly mess
//🚧 Do not look at this mess 🚧
export function flattenText(page: Page): string {
	return page.children.map((child) => {
		return child.children;
	}).flat()
		.map((child) => {
			return child.children;
		}).flat()
		.map((child) => {
			return child.children;
		}).flat()
		.map((child) => {
			return child.text;
		}).flat().join(" ");
}

function getChildren(element: HocrElement): Array<HocrElement> {
	return element.children;
}

export function parseTitle(title: string): Record<string, string> {
	const titleParts = title.split("; ");
	const record: Record<string, string> = {};
	titleParts.forEach((titlePart) => {
		const titleKeyPart = titlePart.split(" ");
		const key = titleKeyPart[0];
		record[key] = titleKeyPart.slice(1, undefined).join(" ");
	});
	return record;
}
