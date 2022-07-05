import { App, SuggestModal, TFile } from "obsidian";
import Hocr from "./hocr/hocr";
import * as fuzzy from "fuzzy";

export default class SearchModal extends SuggestModal<Hocr> {

	private hocrs: Array<Hocr>;
	private query: string;

	constructor(app: App, hocrs: Array<Hocr>) {
		super(app);
		this.hocrs = hocrs;
	}

	getSuggestions(query: string): Hocr[] | Promise<Hocr[]> {
		//return this.hocrs.filter((hocr) => { fuzzy.match(query, hocr.flattenText()).score; });
		return fuzzy.filter(query, this.hocrs, {
			extract: (hocr: Hocr) => {
				return hocr.flattenText();
			}
		}).map((score) => { return score.original; });
	}

	renderSuggestion(value: Hocr, el: HTMLElement) {
		/*const wordNumbers: Array<number> = [];
		const words = value.words.map((hocrWord) => { return hocrWord.text; });
		for (let i = 0; i < words.length; i++) {
            if(fuzzy.match(this.query, words[i]))
		}*/
		el.createEl("div", { text: value.original_file });
		el.createEl("small", { text: `${value.flattenText().slice(undefined, 80)}...` });
	}

	onChooseSuggestion(item: Hocr) {
		this.app.workspace.getMostRecentLeaf().openFile(this.app.vault.getAbstractFileByPath(item.original_file) as TFile);
	}
}