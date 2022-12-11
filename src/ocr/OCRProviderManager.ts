import OCRProvider from "./OCRProvider";
import {existsSync} from "fs";
import SettingsManager from "../Settings";
import { delimiter } from "path";
import {platform} from "os";
import ObsidianOCRPlugin from "../Main";

export default abstract class OCRProviderManager {

	public static ocrProviders: Array<OCRProvider> = [];

	static registerOCRProvider(provider: OCRProvider) {
		OCRProviderManager.ocrProviders.push(provider);
	}

	static registerOCRProviders(...providers: Array<OCRProvider>) {
		OCRProviderManager.ocrProviders.push(...providers);
	}

	static deregisterOCRProvider(): Array<OCRProvider> {
		return OCRProviderManager.ocrProviders;
	}

	static getByName(name: string): OCRProvider {
		return OCRProviderManager.ocrProviders.filter((ocrProvider) => {
			return ocrProvider.getProviderName() == name;
		})[0];
	}

	static async applyHomebrewWorkaround() {
		if(existsSync("/opt/homebrew/bin")) {
			process.env.PATH = `${process.env.PATH}:/opt/homebrew/bin`;
			ObsidianOCRPlugin.logger.info(`Applying homebrew workaround. $PATH is now ${process.env.PATH}`);
		}
	}

	static addAdditionalPaths() {
		if(SettingsManager.currentSettings.additionalSearchPath.length == 0) return;
		switch (platform()) {
		case "win32":
			process.env.PATH = `${process.env.PATH}${SettingsManager.currentSettings.additionalSearchPath}${delimiter}`;
			break;
		case "darwin":
		case "linux":
			process.env.PATH = `${process.env.PATH}${delimiter}${SettingsManager.currentSettings.additionalSearchPath}`;
			break;
		default:
			ObsidianOCRPlugin.logger.warn(`Additional paths not implemented for platform ${platform()}. Doing nothing.`);
		}
		ObsidianOCRPlugin.logger.info(`Adding additional paths. $PATH is now ${process.env.PATH}`);
	}
}
