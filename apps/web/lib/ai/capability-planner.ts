/** Noata's natural-language capability planner. No separate AI Tools panel.
 * The plan describes existing authorized execution paths, never imagined tools.
 * Every server-side action still independently verifies auth, quota and input.
 */
import {detectArtifactIntent,type ArtifactIntent} from "./artifact-intent.ts";
import {imageGenerationIntent} from "./image-intent.ts";
import {searchPlan} from "../../../../supabase/functions/noata-ai/research.ts";
export type NoataPlan=
 |{kind:"chat"}
 |{kind:"image";provider:"fanar"}
 |{kind:"artifact";intent:ArtifactIntent}
 |{kind:"research";provider:"brave";query:string};
export function planNoataRequest(text:string,opts:{mode:"send"|"retry"|"regenerate"|"continue";temporary:boolean;hasUploads:boolean;explicitTool?:string}):NoataPlan {
 if(opts.mode!=="send"||opts.explicitTool||!text.trim())return{kind:"chat"};
 if(!opts.hasUploads&&!opts.temporary){
  const intent=detectArtifactIntent(text);
  if(intent)return{kind:"artifact",intent};
  // Never reinterpret the quoted content of a file as an image tool command.
  if(imageGenerationIntent(text)==="image")
    return{kind:"image",provider:"fanar"};
 }
 // Research remains on the authenticated Edge route. A configured provider
 // must return real evidence before the UI can show a successful search.
 const research=searchPlan(text);
 if(research.needed)return{kind:"research",provider:"brave",query:research.query};
 return{kind:"chat"};
}
