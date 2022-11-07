import {Notice} from "obsidian";
import {randomInt} from "crypto";

export default class Tips {

	private static readonly tips = [
		"You can use the \"Delete all transcripts\" command to remove all transcript",
		"You can open the search modal by either using the ribbon icon or the \"Search OCR\" command",
		"You can set the number of background processes in the settings to fit your computer's performance",
		"You can change whether images are searched for text in the settings",
		"You can change whether PDFs are searched for text in the settings",
		"You can increase the image quality to improve recognition accuracy",
		"You can increase the image density to improve recognition accuracy",
		"Know what you're doing? Add your own imagemagick arguments in the settings",
		"Don't like adding things to your path? Add additional folders to be searched in the settings",
		"Set your language when using tesseract in the settings",
		"Know what you're doing? Add your own tesseract arguments in the settings",
		"Don't like an aspect of the plugin? Create an issue or fork it!",
		"Found a problem? Create an issue on GitHub",
		"Have an idea on how to improve the plugin? Create an issue on GitHub",
		"You can enable or disable fuzzy searching in the search modal",
		"You can enable or disable case sensitive searching in the search modal",
		"The search modal only starts searching after entering at least 3 characters",
		"You can click on a page preview in the search modal in enlarge it"
	];

	static showRandomTip() {
		new Notice(`Did you know? ${Tips.tips[randomInt(0, Tips.tips.length)]}`);
	}
}