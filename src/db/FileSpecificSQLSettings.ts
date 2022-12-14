/**
 * Like {@link FileSpecificSettings}, but immutable and with associated SQL keys
 * @description These settings are not meant to be created by hand, but rather fetched from the db with
 * 				{@link DBManager.getSettingsByTranscriptId}
 * */
export default class FileSpecificSQLSettings {
	constructor(
		public readonly settingsId: number,
        public readonly transcriptId: number,
        public readonly imageDensity: number,
        public readonly imageQuality: number,
        public readonly imagemagickArgs: string,
		public readonly ignore: boolean
	) {}
}