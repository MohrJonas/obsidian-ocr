import InstallationProvider from "./InstallationProvider";
import {Terminal} from "xterm";
import ansiColors from "ansi-colors";
import {exec} from "sudo-prompt";
import {doesProgramExist} from "./Utils";

export default class DebInstallationProvider implements InstallationProvider {

	async installDependencies(terminal: Terminal) {
		terminal.writeln(ansiColors.green("Installing tesseract and imagemagick"));
		exec("DEBIAN_FRONTEND=noninteractive apt update -y && apt install -y tesseract imagemagick", (error, stdout, stderr) => {
			terminal.writeln(stdout.toString());
			terminal.writeln(ansiColors.yellow(stderr.toString()));
			if (error) {
				terminal.writeln(ansiColors.red(error.message));
				return;
			}
			terminal.writeln(ansiColors.green("Done. Restart obsidian for changed to take effect"));
		});
	}

	async isApplicable(): Promise<boolean> {
		return await doesProgramExist("apt");
	}
}