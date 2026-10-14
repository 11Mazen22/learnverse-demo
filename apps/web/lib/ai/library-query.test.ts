import test from "node:test";import assert from "node:assert/strict";
import {LIBRARY_COLUMNS,libraryPage,librarySearchPattern,mergeLibraryPage} from "./library-query.ts";
test("Library queries remain bounded, stable and escape filename wildcard characters",()=>{
 assert.deepEqual(libraryPage(0),{from:0,to:23});assert.deepEqual(libraryPage(5),{from:120,to:143});
 assert.throws(()=>libraryPage(-1));assert.throws(()=>libraryPage(Infinity));
 assert.equal(librarySearchPattern(" 50%_draft\\final "),"%"+"50\\%\\_draft\\\\final"+"%");
 assert.equal(librarySearchPattern("علوم"),"%علوم%");
 assert.doesNotMatch(LIBRARY_COLUMNS.artifacts,/source_content|\*/);
});
test("Large-library traversal retains more than 100 files and deduplicates overlapping pages",()=>{
 let records:{id:string}[]=[];
 for(let p=0;p<8;p++)records=mergeLibraryPage(records,Array.from({length:24},(_,i)=>({id:String(p*24+i)})));
 assert.equal(records.length,192);records=mergeLibraryPage(records,[{id:"191"},{id:"192"}]);assert.equal(records.length,193);
 assert.deepEqual(mergeLibraryPage(records,[{id:"new search"}],true),[{id:"new search"}]);
});
