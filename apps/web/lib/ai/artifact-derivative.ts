import type {ArtifactKind} from "./artifact-intent.ts";
import type {Message} from "./workspace.ts";

const DELIVERABLES:Record<ArtifactKind,string>={
 pdf:"a polished PDF report",
 docx:"an editable Word document",
 xlsx:"an Excel workbook with a clear, useful table",
 pptx:"a concise PowerPoint presentation with slide titles and bullets",
};

/** Reformat the first answer for another requested file without spending another search call. */
export function artifactDerivativePrompt(kind:ArtifactKind):string{
 const deliverable=DELIVERABLES[kind];
 return [
  `Create ${deliverable} from the immediately preceding assistant answer.`,
  "That answer is the sole source for factual claims and data. Preserve its numbers, caveats, uncertainty, and citation IDs; do not broaden its claims or add facts, figures, citations, or URLs.",
  "Do not browse, search the web, or call tools again. Do not ask for confirmation or describe capabilities. Return the complete finished content in the requested structure.",
  ...(kind==="xlsx"?["Build rows and cells only from information already present. If a useful workbook cannot be made without inventing values, say so instead of making up data."]:[]),
 ].join(" ");
}

export function artifactDerivativeHistory(
 history:readonly Message[],sourceContent:string,kind:ArtifactKind,conversationId:string,operationId:string,createdAt:string,
):Message[]{
 return [...history,
  {id:operationId+"-source",conversation_id:conversationId,role:"assistant",content:sourceContent,model:null,status:"complete",created_at:createdAt},
  {id:operationId+"-format",conversation_id:conversationId,role:"user",content:artifactDerivativePrompt(kind),model:null,status:"complete",created_at:createdAt},
 ];
}
