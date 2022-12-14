import Page from "../hocr/Page";
import Word from "../hocr/Word";

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
			return (child as Word).text;
		}).flat().join(" ");
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
