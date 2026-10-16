import type {PdfTextNote,PdfNotePosition} from "./pdf-annotations.ts";

export type NativePdfRevisionInput =
  | {mode:"pages";pageCount:number;order:readonly number[];rotatePage:number;rotation:0|90|180|270}
  | {mode:"annotate";pageCount:number;notes:readonly PdfTextNote[]};

export type PdfExtractionQuality = {
  scannedPages:readonly number[];
  damagedPages?:readonly number[];
  truncated:boolean;
};

const notePositions=new Set<PdfNotePosition>(["top-left","top-right","bottom-left","bottom-right"]);

function validPageCount(value:number):boolean {
  return Number.isInteger(value)&&value>=1&&value<=300;
}

/**
 * A descriptive, explicitly non-text source record for native PDF operations
 * when a scanned PDF has no extractable text. The PDF bytes—not this record—
 * remain the authoritative document content.
 */
export function nativePdfRevisionRecord(input:NativePdfRevisionInput):string {
  if(!validPageCount(input.pageCount))throw Error("pdf_revision_page_count_invalid");
  const lines=[
    "# Noata native PDF revision record",
    "Record type: operation metadata, not extracted document text",
    "Page count: "+input.pageCount,
    "Text extraction/OCR: not used to create the PDF revision",
    "Fidelity: the saved PDF bytes preserve the original page content except for the explicit operation below. This record is not a reconstruction of the document."
  ];
  if(input.mode==="pages"){
    if(!Array.isArray(input.order)||input.order.length!==input.pageCount||
      input.order.some(n=>!Number.isInteger(n)||n<1||n>input.pageCount)||
      new Set(input.order).size!==input.pageCount)throw Error("pdf_revision_page_order_invalid");
    if(!Number.isInteger(input.rotatePage)||input.rotatePage<1||input.rotatePage>input.pageCount||
      ![0,90,180,270].includes(input.rotation))throw Error("pdf_revision_rotation_invalid");
    lines.push(
      "Operation: reorder pages and optionally rotate one page",
      "Output page order (1-based original page numbers): "+input.order.join(", "),
      "Additional rotation: page "+input.rotatePage+" by "+input.rotation+" degrees"
    );
  }else{
    if(!Array.isArray(input.notes)||input.notes.length<1||input.notes.length>20)throw Error("pdf_revision_notes_invalid");
    for(const note of input.notes){
      if(!note||!Number.isInteger(note.page)||note.page<1||note.page>input.pageCount||
        typeof note.text!=="string"||!note.text.trim()||note.text.length>1000||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(note.text)||
        !notePositions.has(note.position))throw Error("pdf_revision_notes_invalid");
    }
    lines.push(
      "Operation: add standard PDF /Text sticky-note annotations",
      "Annotations added: "+input.notes.length,
      "Annotations are comments, not text replacement or redaction."
    );
  }
  return lines.join("\n");
}

/** Keep partial OCR/extraction results visibly marked as partial in revision metadata. */
export function pdfRevisionExtractionNotice(quality:PdfExtractionQuality):string {
  const details:string[]=[];
  if(quality.scannedPages.length)details.push("Image-only/scanned pages without extractable text: "+quality.scannedPages.join(", ")+". OCR was not performed.");
  if(quality.damagedPages?.length)details.push("Pages whose text could not be read: "+quality.damagedPages.join(", ")+".");
  if(quality.truncated)details.push("The extracted text excerpt was truncated by the safe extraction limit.");
  if(!details.length)return "";
  return [
    "# PDF text extraction limitation",
    "The source text below is incomplete and must not be treated as a full reconstruction. The saved PDF bytes remain authoritative and retain the original page content.",
    ...details
  ].join("\n");
}
