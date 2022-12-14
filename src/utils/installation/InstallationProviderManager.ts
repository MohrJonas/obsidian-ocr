import InstallationProvider from "./InstallationProvider";

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
		InstallationProviderManager.providers.push(...providers);
	}

	/**
	 * Return the correct provider for the current platform
	 * @return the provider for the current platform, or undefined is none is available
	 * */
	static async getCorrectProvider(): Promise<InstallationProvider | undefined> {
		return InstallationProviderManager.providers.filter(async (provider) => {
			return await provider.isApplicable();
		})[0];
	}

}