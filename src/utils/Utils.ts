import which from "which";

/**
 * Check if the given executable exists on the PATH
 * @param name the name of the executable to check
 * @returns true if it exists, false otherwise
 */
export async function doesProgramExist(name: string): Promise<boolean> {
	// @types/which not up-to-date, have to ignore this
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return await which(name, { nothrow: true  }) != null;
}

