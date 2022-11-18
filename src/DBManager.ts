import initSqlJs from "sql.js";
import {join} from "path";
import ObsidianOCRPlugin from "./Main";
import {FileSystemAdapter} from "obsidian";
import {existsSync} from "fs";
import {readFile, writeFile} from "fs/promises";
import {flattenText} from "./utils/HocrUtils";
import Page from "./hocr/Page";

export class SQLResultPage {
	constructor(public readonly pageNumber: number, public readonly transcriptId: number, public readonly thumbnail: string, public readonly transcriptText: string) {
	}
}

export class SQLResultTranscript {
	constructor(public readonly id: number, public readonly relativePath: string, public readonly numPages: number) {
	}
}

export default class DBManager {

	private static SQL: initSqlJs.SqlJsStatic;
	private static DB: initSqlJs.Database;
	private static DB_PATH: string;

	static async init() {
		DBManager.DB_PATH = join((ObsidianOCRPlugin.plugin.app.vault.adapter as FileSystemAdapter).getBasePath(), ".obsidian-ocr.sqlite");
		DBManager.SQL = await initSqlJs({
			locateFile: file => `https://sql.js.org/dist/${file}`
		});
		if (existsSync(DBManager.DB_PATH))
			DBManager.DB = new DBManager.SQL.Database(await readFile(DBManager.DB_PATH));
		else {
			DBManager.DB = new DBManager.SQL.Database();
			DBManager.initDB();
		}
	}

	static async insertTranscript(relativeFilePath: string, pages: Array<Page>) {
		//TranscriptId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
		// RelativePath TEXT NOT NULL,
		// numPages INTEGER NOT NULL
		const transcriptId = DBManager.DB.exec("INSERT INTO Transcripts (RelativePath, numPages) VALUES (:path, :numPages) RETURNING TranscriptId", {
			":path": relativeFilePath,
			":numPages": pages.length
		});
		//PageId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
		// TranscriptId INTEGER FOREIGN KEY REFERENCES Transcripts(TranscriptId),
		// PageNum INTEGER NOT NULL,
		// Thumbnail TEXT NOT NULL,
		// TranscriptText TEXT NOT NULL
		pages.forEach((page, index) => {
			DBManager.DB.run("INSERT INTO Pages (TranscriptId, PageNum, Thumbnail, TranscriptText) VALUES (:transcriptId, :pageNum, :thumbnail, :transcriptText)", {
				":transcriptId": transcriptId[0].values[0][0],
				":pageNum": index,
				":thumbnail": page.thumbnail,
				":transcriptText": flattenText(page)
			});
		});
		await DBManager.saveDB();
	}

	static async removeTranscriptByPath(relativeFilePath: string) {
		DBManager.DB.run("DELETE FROM Transcripts WHERE RelativePath = :path", {
			":path": relativeFilePath
		});
		await DBManager.saveDB();
	}

	static async updateTranscriptPath(oldPath: string, newPath: string) {
		DBManager.DB.run("UPDATE Transcripts SET RelativePath = :newPath WHERE RelativePath = :oldPath", {
			":oldPath": oldPath,
			":newPath": newPath
		});
		await DBManager.saveDB();
	}

	static getAllTranscripts(): Array<SQLResultTranscript> {
		return DBManager.DB.exec("SELECT * FROM Transcripts;")[0].values.map((row) => {
			return new SQLResultTranscript(row[0] as number, row[1] as string, row[2] as number);
		});
	}

	static getAllPages(): Array<SQLResultPage> {
		return DBManager.DB.exec("SELECT * FROM Pages;")[0].values.map((row) => {
			return new SQLResultPage(row[1] as number, row[4] as number, row[2] as string, row[3] as string);
		});
	}

	static dispose() {
		DBManager.DB.close();
	}

	static async saveDB() {
		await writeFile(DBManager.DB_PATH, Buffer.from(DBManager.DB.export()));
	}

	static doesTranscriptWithPathExist(relativeFilePath: string): boolean {
		return DBManager.DB.exec("SELECT EXISTS(SELECT 1 FROM Transcripts WHERE RelativePath = :path);", {
			":path": relativeFilePath
		})[0].values[0][0] == 1;
	}

	static getPagesByTranscriptId(id: number): Array<SQLResultPage> {
		return DBManager.DB.exec("SELECT * FROM Pages WHERE TranscriptId = :id;", {
			":id": id
		})[0].values.map((row) => {
			return new SQLResultPage(row[1] as number, row[4] as number, row[2] as string, row[3] as string);
		});
	}

	static getTranscriptById(id: number): SQLResultTranscript {
		const row =  DBManager.DB.exec("SELECT * FROM Transcripts WHERE TranscriptId = :id;", {
			":id": id
		})[0].values[0];
		return new SQLResultTranscript(row[0] as number, row[1] as string, row[2] as number);
	}

	private static async initDB() {
		DBManager.DB.run("CREATE TABLE Transcripts (TranscriptId INTEGER PRIMARY KEY AUTOINCREMENT, RelativePath TEXT NOT NULL, numPages INTEGER NOT NULL);");
		DBManager.DB.run("CREATE TABLE Pages (PageId INTEGER PRIMARY KEY AUTOINCREMENT, PageNum INTEGER NOT NULL, Thumbnail TEXT NOT NULL, TranscriptText TEXT NOT NULL, TranscriptId INTEGER, FOREIGN KEY (TranscriptId) REFERENCES Transcripts(TranscriptId) ON DELETE CASCADE);");
		await DBManager.saveDB();
	}
}