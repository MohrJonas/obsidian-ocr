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
import SQLResultFolder from "./SQLResultFolder";
// Typescript complains about the wasm file not having type definitions (duh), so just ignore it
//@ts-ignore
import sqlWasm from "../../node_modules/sql.js/dist/sql-wasm.wasm";

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
		DBManager.SQL = await initSqlJs({ wasmBinary: new Uint8Array(atob(sqlWasm.split(",")[1]).split("").map((v) => v.charCodeAt(0))) });
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
		const transcriptId = DBManager.DB.exec("INSERT OR IGNORE INTO transcripts (relative_path, num_pages) VALUES (:path, :numPages) RETURNING transcript_id", {
			":path": relativeFilePath, ":numPages": pages.length
		});
		pages.forEach((page, index) => {
			DBManager.DB.run("INSERT OR IGNORE INTO pages (transcript_id, page_num, thumbnail, transcript_text) VALUES (:transcriptId, :pageNum, :thumbnail, :transcriptText)", {
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
		ObsidianOCRPlugin.logger.debug(`Transcript ID is ${transcriptId}`);
		DBManager.DB.run("DELETE FROM transcripts WHERE transcript_id = :id", {
			":id": transcriptId
		});
		DBManager.DB.run("DELETE FROM pages WHERE transcript_id = :id", {
			":id": transcriptId
		});
		DBManager.DB.run("DELETE FROM settings WHERE relative_path = :path", {
			":path": relativeFilePath
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
	 * Get the settings associated with the vault-relative path
	 * @param path The path to fetch the settings for
	 * @return A FileSpecificSQLSettings if settings exist, undefined otherwise
	 * */
	static getSettingsByRelativePath(path: string): FileSpecificSQLSettings | undefined {
		ObsidianOCRPlugin.logger.debug(`Fetching settings with path ${path}`);
		const row = DBManager.unwrapSafe(DBManager.DB.exec("SELECT * FROM settings WHERE relative_path = :path", {
			":path": path
		}));
		if(!row) return undefined;
		return new FileSpecificSQLSettings(row[0] as number, row[1] as string, row[2] as number, row[3] as number, row[4] as string);
	}

	/**
	 * Set the settings associated with the vault-relative path
	 * @param path The path to set the settings for
	 * @param settings The settings to save
	 * */
	static setSettingsByRelativePath(path: string, settings: FileSpecificSettings) {
		ObsidianOCRPlugin.logger.info(`Setting settings with path ${path} to ${JSON.stringify(settings)}`);
		DBManager.DB.run("DELETE FROM settings WHERE relative_path = :path", {
			":path": path
		});
		DBManager.DB.run("INSERT OR IGNORE INTO settings (relative_path, image_density, image_quality, imagemagick_args) VALUES (:path, :imageQuality, :imageDensity, :imagemagickArgs)", {
			":path": path,
			":imageQuality": settings.imageQuality,
			":imageDensity": settings.imageDensity,
			":imagemagickArgs": settings.imagemagickArgs,
		});
	}

	/**
	 * Get the transcript associated with the path
	 * @param relativeFilePath The path to lookup
	 * @return A SQLResultTranscript
	 * */
	static getTranscriptByRelativePath(relativeFilePath: string): SQLResultTranscript | undefined {
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
		DBManager.DB.run("DROP TABLE IF EXISTS settings");
		DBManager.DB.run("DROP TABLE IF EXISTS ignored_folders");
	}

	static deleteAllTranscripts() {
		ObsidianOCRPlugin.logger.info("Deleting all transcripts");
		DBManager.DB.run("DELETE FROM pages");
		DBManager.DB.run("DELETE FROM transcripts");
	}

	/**
	 * Remove the setting associated with the vault relative path
	 * @param path The path to remove with
	 * */
	static removeSettingsByRelativePath(path: string) {
		ObsidianOCRPlugin.logger.info("Removing settings with path ${path}");
		DBManager.DB.run("DELETE FROM settings WHERE relative_path = :path", {
			":path": path
		});
	}

	static addIgnoredFolder(vaultRelativePath: string) {
		ObsidianOCRPlugin.logger.info(`Adding ignored folder with path ${vaultRelativePath}`);
		DBManager.DB.run("INSERT OR IGNORE INTO ignored_folders (relative_path) VALUES (:path)", {
			":path": vaultRelativePath
		});
	}

	static removeIgnoredFolderById(id: number) {
		ObsidianOCRPlugin.logger.info(`Deleting ignored folder with id ${id}`);
		DBManager.DB.run("DELETE FROM ignored_folders WHERE folder_id = :id", {
			":id": id
		});
	}

	static getIgnoredFolderByPath(vaultRelativePath: string): SQLResultFolder | undefined {
		ObsidianOCRPlugin.logger.debug(`Fetching ignored folder with path ${vaultRelativePath}`);
		const row = DBManager.unwrapSafe(DBManager.DB.exec("SELECT * FROM ignored_folders WHERE relative_path = :path;", {
			":path": vaultRelativePath
		}));
		if(!row) return undefined;
		return new SQLResultFolder(row[0] as number, row[1] as string);
	}

	static getAllIgnoredFolders(): Array<SQLResultFolder> {
		ObsidianOCRPlugin.logger.debug("Fetching all ignored folders");
		const result = DBManager.DB.exec("SELECT * FROM ignored_folders;");
		const results = result[0];
		if(!results) return [];
		return results.values.map((row) => { return new SQLResultFolder(row[0] as number, row[1] as string); });
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
                num_pages     integer,
                UNIQUE(relative_path)
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
                relative_path    text,
                image_density    integer,
                image_quality    integer,
                imagemagick_args text,
                UNIQUE(relative_path)
            );

			CREATE TABLE IF NOT EXISTS ignored_folders
			(
                folder_id        integer PRIMARY KEY AUTOINCREMENT,
                relative_path    text,
                UNIQUE(relative_path)
			);
		`);
		await DBManager.saveDB();
	}
}