import {platform, tmpdir} from "os";
import File from "./File";
import {doesProgramExist} from "./utils/Utils";
import {mkdir} from "fs/promises";
import {generate} from "randomstring";
import {join} from "path";
import exec from "@simplyhexagonal/exec";
import ObsidianOCRPlugin from "./Main";
import {globby} from "globby";
import moment from "moment/moment";
import sanitize from "sanitize-filename";

/**
 * Convert a file from a pdf to a png
 * @param file The file to convert
 * @param density The density setting
 * @param quality The quality setting
 * @param additionalImagemagickArgs The additional Imagemagick args
 * @returns A list of absolute png-file paths, each representing a page of the pdf
 */
export async function convertPdfToPng(file: File, density: number, quality: number, additionalImagemagickArgs: string): Promise<Array<string> | undefined> {
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
	const randomPiece = generate({
		length: 4,
		charset: "alphanumeric"
	});
	const folderName = sanitize(`${moment().format("YYYY-M-D-H.m")}-${randomPiece}-${file.tFile.basename}`);
	const randomFolderPath = join(tmpdir(), folderName);
	await mkdir(randomFolderPath);
	ObsidianOCRPlugin.logger.info(`Converting pdf ${file.absPath} to png(s) in ${randomFolderPath}`);
	const command = `${platformSpecific} -density ${density} -quality ${quality} -background white -alpha remove -alpha off ${additionalImagemagickArgs} "${file.absPath}" "${join(randomFolderPath, "out.png")}"`;
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
