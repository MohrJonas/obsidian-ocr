import InstallationProvider from "./InstallationProvider";
import ObsidianOCRPlugin from "../../Main";

/**
 * Manager for all installation providers
 * */
export default class InstallationProviderManager {

	private static providers: Array<InstallationProvider> = [];

	/**
	 * Register a new provider
	 * @param providers The provider(s) to register
	 * */
	static registerProviders(...providers: Array<InstallationProvider>) {
		ObsidianOCRPlugin.logger.info(`Registering provider(s) ${providers}`);
		InstallationProviderManager.providers.push(...providers);
	}

	/**
	 * Return the correct provider for the current platform
	 * @return the provider for the current platform, or undefined is none is available
	 * */
	static async getCorrectProvider(): Promise<InstallationProvider | undefined> {
		const provider = InstallationProviderManager.providers.filter(async (provider) => {
			return await provider.isApplicable();
		})[0];
		ObsidianOCRPlugin.logger.debug(`Returning appropriate provider ${provider}`);
		return provider;
	}

}