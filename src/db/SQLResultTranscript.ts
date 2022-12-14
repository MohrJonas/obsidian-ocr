/**
 * Immutable wrapper class for a DB-row from the transcripts table
 * */
export class SQLResultTranscript {
	constructor(
		public readonly transcriptId: number,
		public readonly relativePath: string,
		public readonly numPages: number)
	{}
}