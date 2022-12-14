import initSqlJs from "sql.js";
import {join} from "path";
import ObsidianOCRPlugin from "../Main";
import {FileSystemAdapter} from "obsidian";
import {existsSync} from "fs";
import {readFile, writeFile} from "fs/promises";
import {flattenText} from "../utils/HocrUtils";
import Page from "../hocr/Page";
import {SQLResultPage} from "./SQLResultPage";
import {SQLResultTranscript} from "./SQLResultTranscript";
import FileSpecificSettings from "./FileSpecificSettings";
import FileSpecificSQLSettings from "./FileSpecificSQLSettings";

/**
 * Abstraction layer between a sqlite database and Obsidian
 * */
export default class DBManager {

	private static SQL: initSqlJs.SqlJsStatic;
	private static DB: initSqlJs.Database;
	private static DB_PATH: string;

	/**
	 * Initialize the db by either loading it (if already existant) or creating a new one
	 * */
	static async init() {
		DBManager.DB_PATH = join((ObsidianOCRPlugin.plugin.app.vault.adapter as FileSystemAdapter).getBasePath(), ".obsidian-ocr.sqlite");
		DBManager.SQL = await initSqlJs({
			locateFile: file => `https://sql.js.org/dist/${file}`
		});
		if (existsSync(DBManager.DB_PATH)) {
			ObsidianOCRPlugin.logger.info(`Opening already existent database ${this.DB_PATH}`);
			DBManager.DB = new DBManager.SQL.Database(await readFile(DBManager.DB_PATH));
		} else {
			ObsidianOCRPlugin.logger.info(`Creating new database ${this.DB_PATH}`);
			DBManager.DB = new DBManager.SQL.Database();
			await DBManager.initDB();
		}
	}

	/**
	 * Insert a transcript into the database
	 * @param relativeFilePath The file-path, relative to the vault base-path, of the transcribed file
	 * @param pages An array of Pages that make up the transcript
	 * */
	static async insertTranscript(relativeFilePath: string, pages: Array<Page>) {
		ObsidianOCRPlugin.logger.info(`Inserting transcript with path ${relativeFilePath} and ${pages.length} pages`);
		const transcriptId = DBManager.DB.exec("INSERT INTO transcripts (relative_path, num_pages) VALUES (:path, :numPages) RETURNING transcript_id", {
			":path": relativeFilePath, ":numPages": pages.length
		});
		pages.forEach((page, index) => {
			DBManager.DB.run("INSERT INTO pages (transcript_id, page_num, thumbnail, transcript_text) VALUES (:transcriptId, :pageNum, :thumbnail, :transcriptText)", {
				":transcriptId": transcriptId[0].values[0][0],
				":pageNum": index,
				":thumbnail": page.thumbnail,
				":transcriptText": flattenText(page)
			});
		});
		await DBManager.saveDB();
	}

	/**
	 * Remove a transcript by its path from the database
	 * @param relativeFilePath The file-path, relative to the vault base-path, of the transcribed file
	 * */
	//TODO for some reason cascade doesn't seem to work, have to find out why. Until then it should work like this too...
	static async removeTranscriptByPath(relativeFilePath: string) {
		ObsidianOCRPlugin.logger.info(`Removing transcript with path ${relativeFilePath}`);
		const row = DBManager.unwrapSafe(DBManager.DB.exec("SELECT transcript_id FROM transcripts WHERE relative_path = :path;", {
			":path": relativeFilePath
		}));
		if(!row) return;
		const transcriptId = row[0] as number;
		ObsidianOCRPlugin.logger.info(`Transcript ID is ${transcriptId}`);
		DBManager.DB.run("DELETE FROM transcripts WHERE transcript_id = :id", {
			":id": transcriptId
		});
		DBManager.DB.run("DELETE FROM pages WHERE transcript_id = :id", {
			":id": transcriptId
		});
		DBManager.DB.run("DELETE FROM settings WHERE transcript_id = :id", {
			":id": transcriptId
		});
		await DBManager.saveDB();
	}

	/**
	 * Update the path of a transcript
	 * @param oldPath The old transcript path that will be updated
	 * @param newPath The new path
	 * */
	static async updateTranscriptPath(oldPath: string, newPath: string) {
		ObsidianOCRPlugin.logger.info(`Updating transcript path from ${oldPath} to ${newPath}`);
		DBManager.DB.run("UPDATE transcripts SET relative_path = :newPath WHERE relative_path = :oldPath", {
			":oldPath": oldPath, ":newPath": newPath
		});
		await DBManager.saveDB();
	}

	/**
	 * Get all transcripts from the database
	 * @return An array of SQLResultTranscript
	 * */
	static getAllTranscripts(): Array<SQLResultTranscript> {
		ObsidianOCRPlugin.logger.debug("Fetching all transcripts");
		return DBManager.DB.exec("SELECT * FROM Transcripts;")[0].values.map((row) => {
			return new SQLResultTranscript(row[0] as number, row[1] as string, row[2] as number);
		});
	}

	/**
	 * Get all pages from the database
	 * @return An array of SQLResultPage
	 * */
	static getAllPages(): Array<SQLResultPage> {
		ObsidianOCRPlugin.logger.debug("Fetching all pages");
		return DBManager.DB.exec("SELECT * FROM Pages;")[0].values.map((row) => {
			return new SQLResultPage(row[0] as number, row[1] as number, row[2] as number, row[3] as string, row[4] as string);
		});
	}

	/**
	 * Get the settings associated with the transcript id
	 * @param id The id to fetch the settings for
	 * @return A FileSpecificSQLSettings if settings exist, undefined otherwise
	 * */
	static getSettingsByTranscriptId(id: number): FileSpecificSQLSettings | undefined {
		ObsidianOCRPlugin.logger.debug(`Fetching settings with transcript id ${id}`);
		const row = DBManager.unwrapSafe(DBManager.DB.exec("SELECT * FROM settings WHERE transcript_id = :id", {
			":id": id
		}));
		if(!row) return undefined;
		return new FileSpecificSQLSettings(row[0] as number, row[1] as number, row[2] as number, row[3] as number, row[4] as string, row[5] as number == 1);
	}

	/**
	 * Set the settings associated with the transcript id
	 * @param id The id to set the settings for
	 * @param settings The settings to save
	 * */
	static setSettingsByTranscriptId(id: number, settings: FileSpecificSettings) {
		ObsidianOCRPlugin.logger.info(`Setting settings with transcript id ${id} to ${settings}`);
		DBManager.DB.run("DELETE FROM settings WHERE transcript_id = :id", {
			":id": id
		});
		DBManager.DB.run("INSERT INTO settings (transcript_id, image_density, image_quality, imagemagick_args, ignore) VALUES (:transcriptId, :imageQuality, :imageDensity, :imagemagickArgs, :ignore)", {
			":transcriptId": id,
			":imageQuality": settings.imageQuality,
			":imageDensity": settings.imageDensity,
			":imagemagickArgs": settings.imagemagickArgs,
			":ignore": settings.ignore ? 1 : 0
		});
	}

	/**
	 * Get the transcript associated with the path
	 * @param relativeFilePath The path to lookup
	 * @return A SQLResultTranscript
	 * */
	static getTranscriptByPath(relativeFilePath: string): SQLResultTranscript | undefined {
		ObsidianOCRPlugin.logger.debug(`Fetching transcript with path ${relativeFilePath}`);
		const row = DBManager.unwrapSafe(DBManager.DB.exec("SELECT * FROM transcripts WHERE relative_path = :relativePath;", {
			":relativePath": relativeFilePath
		}));
		if(!row) return undefined;
		return new SQLResultTranscript(row[0] as number, row[1] as string, row[2] as number);
	}

	/**
	 * Close the database
	 * */
	static dispose() {
		ObsidianOCRPlugin.logger.info("Closing DB");
		DBManager.DB.close();
	}

	/**
	 * Write the database to file
	 * */
	static async saveDB() {
		ObsidianOCRPlugin.logger.info(`Saving DB to ${DBManager.DB_PATH}`);
		await writeFile(DBManager.DB_PATH, Buffer.from(DBManager.DB.export()));
	}

	/**
	 * Check if a transcript with that path exists
	 * @param relativeFilePath The path to check
	 * @return true, if a transcript exists, false otherwise
	 * */
	static doesTranscriptWithPathExist(relativeFilePath: string): boolean {
		ObsidianOCRPlugin.logger.debug(`Checking if transcript with path ${relativeFilePath} exists`);
		return DBManager.DB.exec("SELECT EXISTS(SELECT 1 FROM transcripts WHERE relative_path = :path);", {
			":path": relativeFilePath
		})[0].values[0][0] == 1;
	}

	/**
	 * Get all pages associated with the transcript id
	 * @param id The id to lookup
	 * @return An array of SQLResultPage
	 * */
	static getPagesByTranscriptId(id: number): Array<SQLResultPage> {
		ObsidianOCRPlugin.logger.debug(`Fetching pages with transcript id ${id}`);
		return DBManager.DB.exec("SELECT * FROM pages WHERE transcript_id = :id;", {
			":id": id
		})[0].values.map((row) => {
			return new SQLResultPage(row[0] as number, row[1] as number, row[2] as number, row[3] as string, row[4] as string);
		});
	}

	/**
	 * Get the transcript associated with the id
	 * @param id The id to lookup
	 * @return A SQLResultTranscript
	 * */
	static getTranscriptById(id: number): SQLResultTranscript | undefined {
		ObsidianOCRPlugin.logger.debug(`Fetching transcript with id ${id}`);
		const row = DBManager.unwrapSafe(DBManager.DB.exec("SELECT * FROM transcripts WHERE transcript_id = :id;", {
			":id": id
		}));
		if(!row) return undefined;
		return new SQLResultTranscript(row[0] as number, row[1] as string, row[2] as number);
	}

	/**
	 * Reset the database by dropping all tables
	 * */
	static resetDB() {
		ObsidianOCRPlugin.logger.info("Resetting DB");
		DBManager.DB.run("DROP TABLE IF EXISTS pages");
		DBManager.DB.run("DROP TABLE IF EXISTS transcripts");
	}

	/**
	 * Remove the setting associated with the transcript id
	 * @param id The id to remove with
	 * */
	static removeSettingsByTranscriptId(id: number) {
		DBManager.DB.run("DELETE FROM settings WHERE transcript_id = :id", {
			":id": id
		});
	}

	private static unwrapSafe(result: Array<initSqlJs.QueryExecResult>): Array<initSqlJs.SqlValue> | undefined {
		if(result.length == 0) return undefined;
		return result[0].values[0];
	}

	/**
	 * Init the database by creating all tables
	 * */
	static async initDB() {
		ObsidianOCRPlugin.logger.info("Initializing DB");
		DBManager.DB.exec(`
            CREATE TABLE IF NOT EXISTS transcripts
            (
                transcript_id integer PRIMARY KEY AUTOINCREMENT,
                relative_path text,
                num_pages     integer
            );

            CREATE TABLE IF NOT EXISTS pages
            (
                page_id         integer PRIMARY KEY AUTOINCREMENT,
                transcript_id   integer,
                page_num        integer,
                thumbnail       text,
                transcript_text text,
                FOREIGN KEY (transcript_id) REFERENCES transcripts (transcript_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS settings
            (
                settings_id      integer PRIMARY KEY AUTOINCREMENT,
                transcript_id    integer,
                image_density    integer,
                image_quality    integer,
                imagemagick_args text,
                ignore           integer,
                FOREIGN KEY (transcript_id) REFERENCES transcripts (transcript_id) ON DELETE CASCADE
            );
		`);
		await DBManager.saveDB();
	}
}