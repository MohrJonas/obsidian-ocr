import { App, Notice, Plugin, Setting, SuggestModal, TFile } from "obsidian";
import Hocr from "./hocr/hocr";
import * as fuzzy from "fuzzy";
import { currentSettings, saveSettings } from "./settings";
import HocrPage from "./hocr/hocr-page";

export default class SearchModal extends SuggestModal<HocrPage> {

	private pages: Array<HocrPage>;
	private plugin: Plugin;

	constructor(app: App, plugin: Plugin, hocrs: Array<Hocr>) {
		super(app);
		this.pages = hocrs.map((hocr) => { return hocr.pages.flat(); }).flat();
		this.plugin = plugin;
		new Setting(this.modalEl)
			.setName("Fuzzy search")
			.setDesc("Enable or disable fuzzy search")
			.addToggle((tc) => {
				tc.setValue(true);
				tc.onChange((value) => {
					currentSettings.fuzzy_search = value;
					saveSettings(this.plugin);
				});
			});
		new Setting(this.modalEl)
			.setName("Case sensitive")
			.setDesc("Enable or disable case sensitivity")
			.addToggle((tc) => {
				tc.setValue(true);
				tc.onChange((value) => {
					currentSettings.case_sensitive = value;
					saveSettings(this.plugin);
				});
			});
	}

	getSuggestions(query: string): HocrPage[] | Promise<HocrPage[]> {
		if (currentSettings.fuzzy_search) {
			return fuzzy.filter(query, this.pages, {
				extract: (page: HocrPage) => {
					return page.words.map((word) => { return word.text; }).join(" ");
				}
			}).map((score) => { return score.original; });
		}
		else {
			return this.pages.filter((page) => {
				if (currentSettings.case_sensitive)
					return page.words.map((word) => { return word.text; }).join(" ").toLowerCase().includes(query.toLowerCase());
				else
					return page.words.map((word) => { return word.text; }).join(" ").includes(query);
			});
		}
	}

	renderSuggestion(page: HocrPage, el: HTMLElement) {
		el.createEl("div", { text: `${page.parent.original_file}, Page ${page.page_number}` });
		el.createEl("small", { text: `${page.words.map((word) => { return word.text; }).join(" ").slice(undefined, 80)}...` });
	}

	onChooseSuggestion(page: HocrPage) {
		const file = this.app.vault.getAbstractFileByPath(page.parent.original_file);
		if (!file) {
			new Notice(`Unable to open file ${page.parent.original_file}. Does it exist?`);
			return;
		}
		this.app.workspace.getMostRecentLeaf().openFile(this.app.vault.getAbstractFileByPath(page.parent.original_file) as TFile, {
			eState: {
				subpath: `#page=${page.page_number}`
			}
		});
	}
}