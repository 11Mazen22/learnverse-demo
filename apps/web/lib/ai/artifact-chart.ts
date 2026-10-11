/** Only existing validated chart observations may be exported as graph PDFs. */
import {interactiveResponseSegments,type ResponseUi} from "../../../../supabase/functions/noata-ai/response-ui.ts";
export function findActualLineChart(answer:string):Extract<ResponseUi,{type:"line_chart"}>|null{
 const parts=interactiveResponseSegments(answer,false);
 const found=parts.find(x=>x.type==="interactive"&&x.data.type==="line_chart");
 return found?.type==="interactive"&&found.data.type==="line_chart"?found.data:null;
}
