import InstallationProvider from "./InstallationProvider";

export default class InstallationProviderManager {

	private static providers: Array<InstallationProvider> = [];

	static registerProviders(...providers: Array<InstallationProvider>) {
		InstallationProviderManager.providers.push(...providers);
	}

	static async getCorrectProvider(): Promise<InstallationProvider | undefined> {
		return InstallationProviderManager.providers.filter(async (provider) => {
			return await provider.isApplicable();
		})[0];
	}

}