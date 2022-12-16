import InstallationProvider from "../InstallationProvider";
import {doesProgramExist} from "../../Utils";
import ansiColors from "ansi-colors";
import {exec} from "sudo-prompt";
import {Terminal} from "xterm";

export default class ArchInstallationProvider implements InstallationProvider {

	installDependencies(terminal: Terminal): void {
		terminal.writeln(ansiColors.green("Installing tesseract and imagemagick"));
		exec("pacman -Syy && pacman -S tesseract imagemagick ", (error, stdout, stderr) => {
			terminal.writeln(stdout.toString());
			terminal.writeln(ansiColors.yellow(stderr.toString()));
			if (error) {
				terminal.writeln(ansiColors.red(error.message));
				return;
			}
			terminal.writeln(ansiColors.green("Done. Restart obsidian for changes to take effect"));
		});
	}

	async isApplicable(): Promise<boolean> {
		return await doesProgramExist("pacman");
	}

}