import OCRProvider from "./OCRProvider";
import {existsSync} from "fs";
import SettingsManager from "../Settings";
import { delimiter } from "path";
import {platform} from "os";
import ObsidianOCRPlugin from "../Main";
import {find} from "lodash";

/**
 * Manager for all {@link OCRProvider}
 * */
export default abstract class OCRProviderManager {

	public static ocrProviders: Array<OCRProvider> = [];

	/**
	 * Register new OCRProvider(s)
	 * @param providers provider(s) to register
	 * */
	static registerOCRProviders(...providers: Array<OCRProvider>) {
		ObsidianOCRPlugin.logger.info(`Registering provider(s) ${providers.map((provider) => {return provider.getProviderName();})}`);
		OCRProviderManager.ocrProviders.push(...providers);
	}

	/**
	 * Deregister a provider. There shouldn't really be a need for this function, but just in case
	 * @param provider the provider to deregister
	 * */
	static deregisterOCRProvider(provider: OCRProvider) {
		ObsidianOCRPlugin.logger.info(`Deregistering provider ${provider.getProviderName()}`);
		OCRProviderManager.ocrProviders.remove(provider);
	}

	/**
	 * Get the provider with that name
	 * @param name the name of the provider to get
	 * @return the fitting provider, or undefined if none were found
	 * */
	static getByName(name: string): OCRProvider {
		ObsidianOCRPlugin.logger.debug(`Returning provider with name ${name}`);
		return find(OCRProviderManager.ocrProviders, (ocrProvider) => {
			return ocrProvider.getProviderName() == name;
		});
	}

	/**
	 * MacOS workaround to allow discovery of binaries installed via homebrew
	 * @see {@link https://github.com/MohrJonas/obsidian-ocr/issues/4}
	 * */
	static async applyHomebrewWorkaround() {
		if(existsSync("/opt/homebrew/bin")) {
			process.env.PATH = `${process.env.PATH}:/opt/homebrew/bin`;
			ObsidianOCRPlugin.logger.info(`Applying homebrew workaround. $PATH is now ${process.env.PATH}`);
		}
	}

	/**
	 * Add all additional paths specified in the settings
	 * */
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
