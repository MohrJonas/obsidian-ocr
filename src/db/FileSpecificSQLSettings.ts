/**
 * Like FileSpecificSettings, but with SQL keys
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