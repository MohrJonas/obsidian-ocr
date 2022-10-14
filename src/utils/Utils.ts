import which from "which";

/**
 * Check if the given executable exists on the PATH
 * @param name the name of the executable to check
 * @returns true if it exists, false otherwise
 */
export async function doesProgramExist(name: string): Promise<boolean> {
	try {
		await which(name);
		return true;
	} catch (error) {
		return false;
	}
}

export function clampFileName(maxLength: number, fileName: string): string {
	if (fileName.length <= maxLength) return fileName;
	return `${fileName.slice(undefined, maxLength - 3)}...`;
}

