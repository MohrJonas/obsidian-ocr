import OCRProvider from "./OCRProvider";
import {existsSync} from "fs";

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
			console.log(`Applying homebrew workaround. Path is now ${process.env.PATH}`);
		}
	}
}
