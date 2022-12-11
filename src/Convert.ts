import {platform, tmpdir} from "os";
import File from "./File";
import {doesProgramExist} from "./utils/Utils";
import {mkdir} from "fs/promises";
import {generate} from "randomstring";
import {join} from "path";
import exec from "@simplyhexagonal/exec";
import ObsidianOCRPlugin from "./Main";
import {globby} from "globby";
import SettingsManager from "./Settings";

/**
 * Convert a file from a pdf to a png
 * @param file The file to convert
 * @returns A list of absolute png-file paths, each representing a page of the pdf
 */
export async function convertPdfToPng(file: File): Promise<Array<string> | undefined> {
	let platformSpecific: string;
	switch (platform()) {
	case "win32":
		platformSpecific = "magick convert";
		break;
	case "darwin":
	case "linux":
		platformSpecific = "convert";
		break;
	}
	const randomFolderName = generate({
		length: 32,
		charset: "alphanumeric"
	});
	const randomFolderPath = join(tmpdir(), randomFolderName);
	await mkdir(randomFolderPath);
	const command = `${platformSpecific} -density ${SettingsManager.currentSettings.density} -quality ${SettingsManager.currentSettings.quality} -background white -alpha remove -alpha off ${SettingsManager.currentSettings.additionalImagemagickArgs} "${file.absPath}" "${join(randomFolderPath, "out.png")}"`;
	const execPromise = exec(command);
	ObsidianOCRPlugin.children.push(execPromise.execProcess);
	const execResult = await execPromise.execPromise;
	if (execResult.exitCode != 0) {
		ObsidianOCRPlugin.logger.error(`Error converting ${file.vaultRelativePath}: ${execResult.stderrOutput}`);
		return undefined;
	}
	return await globby("*.png", {
		cwd: randomFolderPath,
		absolute: true
	});
}

export async function areDepsMet(): Promise<boolean> {
	switch (platform()) {
	case "win32":
		return await doesProgramExist("magick");
	case "linux":
	case "darwin":
		return await doesProgramExist("convert");
	default:
		ObsidianOCRPlugin.logger.warn(`Dependency check not implemented for platform ${platform()}. Assuming everything is okay.`);
		return true;
	}
}
