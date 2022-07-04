import { join } from "path";

export function vaultPathToAbs(vaultPath: string): string {
	return join(this.app.vault.adapter.basePath, vaultPath);
}

export function getFileEnding(filePath: string): string | undefined {
	return filePath.split(".").pop();
}

export function randomString(length: number): string {
	let result = "";
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
	}
	return result;
}