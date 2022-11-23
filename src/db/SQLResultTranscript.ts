export class SQLResultTranscript {
	constructor(
		public readonly transcriptId: number,
		public readonly relativePath: string,
		public readonly numPages: number)
	{}
}