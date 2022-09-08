import {FileSystemAdapter, TFile} from "obsidian";
import {relative} from "path";
import {filePathToJsonPath} from "./utils/FileUtils";

export default class File {

	private constructor(
		public readonly extension: string,
		public readonly vaultRelativePath: string,
		public readonly absPath: string,
		public readonly tFile: TFile,
		public readonly jsonFile: File | undefined,
		public readonly annotatedFile: File | undefined) {
	}

	static fromVaultRelativePath(path: string): File {
		const extension = path.split(".").pop();
		if (!extension) {
			throw new TypeError(`Unable to process file ${path} because it has no extensions`);
		}
		if (extension == "json") {
			return new File(extension, path, (app.vault.adapter as FileSystemAdapter).getFullPath(path), app.vault.getAbstractFileByPath(path) as TFile, undefined, undefined);
		}
		return new File(extension, path, (app.vault.adapter as FileSystemAdapter).getFullPath(path), app.vault.getAbstractFileByPath(path) as TFile, File.fromVaultRelativePath(filePathToJsonPath(path)), undefined);
	}

	static fromAbsPath(path: string): File {
		return File.fromVaultRelativePath(relative(path, (app.vault.adapter as FileSystemAdapter).getBasePath()));
	}

	static fromFile(file: TFile): File {
		return File.fromVaultRelativePath(file.path);
	}
}
