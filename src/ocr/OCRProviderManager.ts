import OCRProvider from "./OCRProvider";

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
}
