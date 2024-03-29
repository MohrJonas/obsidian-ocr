/**
 * Immutable wrapper class for a DB-row from the pages table
 * */
export class SQLResultPage {
	constructor(
		public readonly pageId: number,
		public readonly transcriptId: number,
		public readonly pageNum: number,
		public readonly thumbnail: string,
		public readonly transcriptText: string
	) {}
}