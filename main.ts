/* eslint-disable no-mixed-spaces-and-tabs */
const fs = require("fs");
const sqlite3 = require("sqlite3");
const glob = require("glob");
const os = require("os");
const { open } = require("sqlite");
let { render } = require("mustache");
const { groupCollapsed } = require("console");

const username = os.userInfo().username;
const ANNOTATION_DB_PATH = `/users/${username}/Library/Containers/com.apple.iBooksX/Data/Documents/AEAnnotation/`;
const BOOK_DB_PATH = `/users/${username}/Library/Containers/com.apple.iBooksX/Data/Documents/BKLibrary/`;
const annotationsFiles = glob.sync(`${ANNOTATION_DB_PATH}/*.sqlite`);
const booksFiles = glob.sync(`${BOOK_DB_PATH}/*.sqlite`);

const APPLE_EPOCH_START = new Date("2001-01-01").getTime();

const SELECT_ALL_ANNOTATIONS_QUERY = `
select 
  ZANNOTATIONASSETID as assetId,
  ZANNOTATIONSELECTEDTEXT as quote,
  ZANNOTATIONNOTE as comment,
  ZFUTUREPROOFING5 as chapter,
  ZANNOTATIONSTYLE as colorCode,
  ZANNOTATIONMODIFICATIONDATE as modifiedAt,
  ZANNOTATIONCREATIONDATE as createdAt
from ZAEANNOTATION
where ZANNOTATIONDELETED = 0 
  and ZANNOTATIONSELECTEDTEXT is not null 
  and ZANNOTATIONSELECTEDTEXT <> ''
order by ZANNOTATIONASSETID, ZPLLOCATIONRANGESTART;`;
const SELECT_ALL_BOOKS_QUERY = `select ZASSETID as id, ZTITLE as title, ZAUTHOR as author from ZBKLIBRARYASSET`;

function convertAppleTime(appleTime) {
  return new Date(APPLE_EPOCH_START + appleTime * 1000).getTime();
}

async function createDB(filename) {
  return await open({
    filename: filename,
    driver: sqlite3.Database,
  });
}

async function getBooksFromDBFile(filename) {
  const db = await createDB(filename);
  return await db.all(SELECT_ALL_BOOKS_QUERY);
}

async function getBooks() {
  const books = await Promise.all(booksFiles.map(getBooksFromDBFile));
  return books.flat();
}

async function getAnnotationsFromDBFile(filename) {
  const db = await createDB(filename);
  return await db.all(SELECT_ALL_ANNOTATIONS_QUERY);
}

async function getAnnotations() {
  const annotations = await Promise.all(
    annotationsFiles.map(getAnnotationsFromDBFile)
  );
  return annotations.flat();
}

export default class AppleBooksSync extends Plugin {

async onload() {
	console.log('Obsidian Apple Books Highlights');
	const template = fs.readFileSync("./template.md").toString()
	const books = await getBooks();
	const annotations = await getAnnotations();
	const booksByAssetId : {[key: string]: any} = {};
	const output = annotations.map(({ assetId, ...r }) => {
		if (booksByAssetId[assetId] === undefined) {
		booksByAssetId[assetId] = books.find((b) => b.id === assetId);
		}
		const book = booksByAssetId[assetId];
		return {
		...r,
		modifiedAt: convertAppleTime(r.modifiedAt),
		createdAt: convertAppleTime(r.createdAt),
		author: book.author ?? "Unknown Author",
		title: book.title ?? "Unknown Title",
		};
	});
	output.forEach(book => {
		const res = render(template, book)
		const filePath = `/Users/pacod/Library/Mobile Documents/iCloud~md~obsidian/Documents/obsidianNotes/3. recursos/libros/notes/${book.title}.md`
		//const options = { weekday: 'string', year: 'numeric', month: 'numeric', day: 'numeric' };
		const exists = fs.existsSync(filePath)
		if (!exists) {
			fs.writeFileSync(filePath, res)
		}

			fs.appendFileSync(filePath,"\n\n #### " + new Date(book.createdAt).toLocaleString('es-ES') + "\n> " + book.quote)
		})
	console.log("Exported", output.length, "items");
	//Añadir lógica de creación de ficheros y recogida de datos
	//Hacerlo todo de manera funcional
	//Solucionar problema de ficheros existentes
  }

  onunload() {
    console.log('Obsidian Apple Books Highlights');
  }
}