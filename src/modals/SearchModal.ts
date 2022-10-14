import {Notice, Setting, SuggestModal, TFile} from "obsidian";
import * as fuzzy from "fuzzy";
import Page from "../hocr/Page";
import Transcript from "../hocr/Transcript";
import SettingsManager from "../Settings";
import {STATUS, StatusBar} from "../StatusBar";
import {flattenText} from "../utils/HocrUtils";
import TranscriptCache from "../TranscriptCache";

export default class SearchModal extends SuggestModal<Page> {

	private query: string;
	private pages: Array<Page>;

	constructor(transcripts: Array<Transcript>) {
		super(app);
		this.pages = transcripts.map((transcript) => {
			return transcript.children;
		}).flat();
		if (StatusBar.hasStatus(STATUS.CACHING)) {
			this.modalEl.createEl("strong", {text: "Search results are incomplete while caching"}).id = "suggestion-indexing-warning";
		}
		new Setting(this.modalEl)
			.setName("Fuzzy search")
			.setDesc("Enable or disable fuzzy search")
			.addToggle((tc) => {
				tc.setValue(true);
				tc.onChange(async (value) => {
					SettingsManager.currentSettings.fuzzySearch = value;
					await SettingsManager.saveSettings();
				});
			});
		new Setting(this.modalEl)
			.setName("Case sensitive")
			.setDesc("Enable or disable case sensitivity")
			.addToggle((tc) => {
				tc.setValue(true);
				tc.onChange(async (value) => {
					SettingsManager.currentSettings.caseSensitive = value;
					await SettingsManager.saveSettings();
				});
			});
		console.profileEnd();
	}

	static open() {
		new SearchModal(TranscriptCache.getAll()).open();
	}

	getSuggestions(query: string): Page[] | Promise<Page[]> {
		this.query = query;
		if (SettingsManager.currentSettings.fuzzySearch) {
			return fuzzy.filter(query, this.pages, {
				extract: (page: Page) => {
					return flattenText(page);
				}
			}).map((score) => {
				return score.original;
			});
		} else {
			return this.pages.filter((page) => {
				if (SettingsManager.currentSettings.caseSensitive)
					return flattenText(page).toLowerCase().includes(query.toLowerCase());
				else
					return flattenText(page).includes(query);
			});
		}
	}

	renderSuggestion(page: Page, el: HTMLElement) {
		el.style.display = "flex";
		el.style.maxHeight = "150px";
		const leftColDiv = el.createEl("div", {cls: "suggestion-col"});
		leftColDiv.id = "left-col";
		const rightColDiv = el.createEl("div", {cls: "suggestion-col"});
		rightColDiv.id = "right-col";
		rightColDiv.createEl("h6", {text: `${page.parent.originalFilePath}, Page ${page.pageNumber + 1}`}).id = "suggestion-heading";
		rightColDiv.createEl("p", {text: flattenText(page)}).id = "suggestion-text-preview";
		const image = leftColDiv.createEl("img");
		image.src = `data:image/png;base64, ${page.thumbnail}`;
		image.id = "suggestion-thumbnail";
	}

	async onChooseSuggestion(page: Page) {
		const file = this.app.vault.getAbstractFileByPath(page.parent.originalFilePath);
		if (!file) {
			new Notice(`Unable to open file ${page.parent.originalFilePath}. Does it exist?`);
			return;
		}
		await this.app.workspace.getLeaf(false).openFile(this.app.vault.getAbstractFileByPath(page.parent.originalFilePath) as TFile, {
			eState: {
				subpath: `#page=${page.pageNumber + 1}`
			}
		});
	}
}
