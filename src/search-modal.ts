import { App, Plugin, Setting, SuggestModal, TFile } from "obsidian";
import Hocr from "./hocr/hocr";
import * as fuzzy from "fuzzy";
import { currentSettings, saveSettings } from "./settings";

export default class SearchModal extends SuggestModal<Hocr> {

	private hocrs: Array<Hocr>;
	private query: string;
	private plugin: Plugin;

	constructor(app: App, plugin: Plugin, hocrs: Array<Hocr>) {
		super(app);
		this.hocrs = hocrs;
		this.plugin = plugin;
		new Setting(this.modalEl)
			.setName("Fuzzy finding")
			.setDesc("Enable or disable fuzzy search")
			.addToggle((tc) => {
				tc.setValue(true);
				tc.onChange((value) => {
					currentSettings.fuzzy_search = value;
					saveSettings(this.plugin);
				});
			});
		new Setting(this.modalEl)
			.setName("Case Sensitive")
			.setDesc("Enable or disable case sensitivity")
			.addToggle((tc) => {
				tc.setValue(true);
				tc.onChange((value) => {
					currentSettings.case_sensitive = value;
					saveSettings(this.plugin);
				});
			});
	}

	getSuggestions(query: string): Hocr[] | Promise<Hocr[]> {
		if (currentSettings.fuzzy_search) {
			return fuzzy.filter(query, this.hocrs, {
				extract: (hocr: Hocr) => {
					return hocr.flattenText();
				}
			}).map((score) => { return score.original; });
		}
		else {
			return this.hocrs.filter((hocr) => { 
				if(currentSettings.case_sensitive)
					return hocr.flattenText().toLowerCase().includes(query.toLowerCase());
				else
					return hocr.flattenText().includes(query);
			});
		}
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