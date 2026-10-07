import {NoataAIClient} from "@/components/ai/noata-ai-client";
export const metadata={title:"Noata AI"};

export default function NoataAIPage(){
  return <main style={{padding:24,minHeight:"100vh"}}><NoataAIClient/></main>;
}
