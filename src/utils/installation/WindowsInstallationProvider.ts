import InstallationProvider from "./InstallationProvider";
import {Terminal} from "xterm";
import {exec} from "sudo-prompt";
import ansiColors from "ansi-colors";
import {platform} from "os";

/**
 * Automated dependency installation on Windows using chocolatey
 * */
export default class WindowsInstallationProvider implements InstallationProvider {

	async installDependencies(terminal: Terminal) {
		terminal.writeln(ansiColors.green("Installing chocolatey"));
		exec("powershell.exe -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command \"[System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))\" && SET \"PATH=%PATH%;%ALLUSERSPROFILE%\\chocolatey\\bin\"", (error, stdout, stderr) => {
			terminal.writeln(stdout.toString());
			terminal.writeln(ansiColors.yellow(stderr.toString()));
			if(error) {
				terminal.writeln(ansiColors.red(error.message));
				return;
			}
			terminal.writeln(ansiColors.green("Installing tesseract and imagemagick"));
			exec("cinst -y tesseract imagemagick", (error, stdout, stderr) => {
				terminal.writeln(stdout.toString());
				terminal.writeln(ansiColors.yellow(stderr.toString()));
				if(error) {
					terminal.writeln(ansiColors.red(error.message));
					return;
				}
				terminal.writeln(ansiColors.green("Done. Restart obsidian for changed to take effect"));
			});
		});
	}

	async isApplicable(): Promise<boolean> {
		return platform() == "win32";
	}
}