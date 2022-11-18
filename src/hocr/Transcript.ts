import Page from "./Page";
import HocrElement from "./HocrElement";
import {readFileSync} from "fs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as jsonComplete from "../../node_modules/json-complete/dist/json_complete.cjs.min.js";
import {readFile} from "fs/promises";

export default class Transcript implements HocrElement {

	public readonly bounds: undefined = undefined;
	public readonly capabilities: Array<string>;
	public readonly children: Array<HocrElement>;

	constructor(public readonly ocrVersion: string, public originalFilePath: string, documents: Array<Document>, imagePaths: Array<string>) {
		if (!documents) return;
		const capabilitySet = new Set<string>();
		documents.forEach((document) => {
			const capabilities = Transcript.getCapabilities(document);
			capabilities.forEach((capability) => {
				capabilitySet.add(capability);
			});
		});
		this.capabilities = [...capabilitySet];
		this.children = documents.map((document, index) => {
			return Array.from(document.getElementsByClassName("ocr_page"))
				.map((pageDiv) => {
					return new Page(pageDiv as HTMLDivElement, new Buffer(readFileSync(imagePaths[index])).toString("base64"), index);
				});
		}).flat();
	}

	static async load(path: string): Promise<Transcript> {
		return jsonComplete.decode((await readFile(path)).toString());
	}

	static encode(transcript: Transcript): string {
		return jsonComplete.encode(transcript);
	}

	private static getCapabilities(document: Document): Array<string> {
		const capabilitiesElements = document.getElementsByName("ocr-capabilities");
		if (capabilitiesElements.length == 0) console.log("😨 HOCR has no capabilities");
		return Array.from(capabilitiesElements).map((element) => {
			return element.title.split(" ");
		}).flat();
	}
}
