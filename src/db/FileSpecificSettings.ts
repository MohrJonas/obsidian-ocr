export default class FileSpecificSettings {
	constructor(
		public imageDensity: number,
		public imageQuality: number,
		public imagemagickArgs: string,
		public ignore: boolean
	) {
	}

	public static DEFAULT(): FileSpecificSettings {
		return new FileSpecificSettings(
			300,
			98,
			"",
			false
		);
	}
}