import { promisify } from "util";
import { exec } from "child_process";

const execProm = promisify(exec);

export async function convertToImage(source: string, destination: string): Promise<undefined | string> {
	const result = await execProm(`pdftoppm -png -r 300 -singlefile "${source}" > "${destination}"`);
	if(result.stderr) return result.stderr;
	else return undefined;
}