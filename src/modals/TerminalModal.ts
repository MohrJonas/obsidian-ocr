import {Modal} from "obsidian";
import {Terminal} from "xterm";
import {FitAddon} from "xterm-addon-fit";

/**
 * Modal used to display a terminal for shell-based automatic dependency installations
 * */
export default class TerminalModal extends Modal {

	terminal = new Terminal({
		theme: {
			background: "#222222",
			foreground: "#c4c4c4"
		}
	});
    
	override onOpen() {
		this.contentEl.replaceChildren();
		const terminalDiv = this.contentEl.createEl("div");
		const fitAddon = new FitAddon();
		this.terminal.loadAddon(fitAddon);
		this.terminal.open(terminalDiv);
		terminalDiv.style.paddingTop = "15px";
		fitAddon.fit();
	}
}