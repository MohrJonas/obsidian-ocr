/**
 * Settings specific to a file
 * @description Other than {@link FileSpecificSQLSettings}, these settings are mutable and meant to be inserted into the db with
 * 				{@link DBManager.setSettingsByTranscriptId}
 * */
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