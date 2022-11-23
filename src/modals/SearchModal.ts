import {Setting, SuggestModal, TFile} from "obsidian";
import * as fuzzy from "fuzzy";
import SettingsManager from "../Settings";
import {STATUS, StatusBar} from "../StatusBar";
import ImageModal from "./ImageModal";
import DBManager from "../db/DBManager";
import {SQLResultPage} from "../db/SQLResultPage";

export default class SearchModal extends SuggestModal<SQLResultPage> {

	private query: string;
	private pages: Array<SQLResultPage>;

	constructor() {
		super(app);
		if (StatusBar.hasStatus(STATUS.CACHING)) {
			this.modalEl.createEl("strong", {text: "Search results are incomplete while caching"}).id = "suggestion-indexing-warning";
		}
		new Setting(this.modalEl)
			.setName("Fuzzy search")
			.setDesc("Enable or disable fuzzy search")
			.addToggle((tc) => {
				tc.setValue(SettingsManager.currentSettings.fuzzySearch);
				tc.onChange(async (value) => {
					SettingsManager.currentSettings.fuzzySearch = value;
					await SettingsManager.saveSettings();
					this.inputEl.dispatchEvent(new Event("input", {}));
				});
			});
		new Setting(this.modalEl)
			.setName("Case sensitive")
			.setDesc("Enable or disable case sensitivity")
			.addToggle((tc) => {
				tc.setValue(SettingsManager.currentSettings.caseSensitive);
				tc.onChange(async (value) => {
					SettingsManager.currentSettings.caseSensitive = value;
					await SettingsManager.saveSettings();
					this.inputEl.dispatchEvent(new Event("input", {}));
				});
			});
	}

	getSuggestions(query: string): SQLResultPage[] | Promise<SQLResultPage[]> {
		this.query = query;
		if (!query || query.length < 3) return [];
		if(!this.pages) this.pages = DBManager.getAllPages();
		if (SettingsManager.currentSettings.fuzzySearch) {
			return fuzzy.filter(query, this.pages, {
				extract: (page: SQLResultPage) => {
					return page.transcriptText;
				}
			}).map((score) => {
				return score.original;
			});
		} else {
			return this.pages.filter((page) => {
				if (SettingsManager.currentSettings.caseSensitive)
					return page.transcriptText.includes(query);
				else
					return page.transcriptText.toLowerCase().includes(query.toLowerCase());
			});
		}
	}

	renderSuggestion(page: SQLResultPage, el: HTMLElement) {
		el.style.display = "flex";
		el.style.maxHeight = "150px";
		const leftColDiv = el.createEl("div", {cls: "suggestion-col"});
		leftColDiv.id = "left-col";
		const rightColDiv = el.createEl("div", {cls: "suggestion-col"});
		rightColDiv.id = "right-col";
		rightColDiv.createEl("h6", {text: `${DBManager.getTranscriptById(page.transcriptId).relativePath}, Page ${page.pageNum + 1}`}).id = "suggestion-heading";
		rightColDiv.createEl("p", {text: page.transcriptText}).id = "suggestion-text-preview";
		const image = leftColDiv.createEl("img");
		image.src = `data:image/png;base64, ${page.thumbnail}`;
		image.id = "suggestion-thumbnail";
		image.onclick = (event) => {
			event.stopImmediatePropagation();
			new ImageModal(page.thumbnail).open();
		};
	}

	async onChooseSuggestion(page: SQLResultPage) {
		await this.app.workspace.getLeaf(false).openFile(this.app.vault.getAbstractFileByPath(DBManager.getTranscriptById(page.transcriptId).relativePath) as TFile, {
			eState: {
				subpath: `#page=${page.pageNum + 1}`
			}
		});
	}
}