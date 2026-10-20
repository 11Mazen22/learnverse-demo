import type {DocumentTheme} from "../../../../supabase/functions/noata-ai/document-design.ts";

export type DocumentPalette = {
  paper:string; ink:string; muted:string; accent:string; accentSoft:string;
  coverBg:string; coverInk:string; coverMuted:string; coverAccent:string;
  line:string; panel:string; panelInk:string; deep:string;
};
export const DOCUMENT_PALETTES:Record<DocumentTheme,DocumentPalette>={
 midnight:{paper:"#FFFFFF",ink:"#0B1220",muted:"#52627A",accent:"#0369A1",accentSoft:"#E0F2FE",coverBg:"#08111F",coverInk:"#F8FAFC",coverMuted:"#A9B8CC",coverAccent:"#38BDF8",line:"#D7E0EA",panel:"#F1F7FC",panelInk:"#0B1220",deep:"#0B2A4A"},
 ivory:{paper:"#FFFDF7",ink:"#2A2420",muted:"#6B5E52",accent:"#9A3412",accentSoft:"#FEF3C7",coverBg:"#F4E9D8",coverInk:"#2A2420",coverMuted:"#7C6A58",coverAccent:"#B45309",line:"#E3D5C3",panel:"#FBF4E8",panelInk:"#2A2420",deep:"#B45309"},
 forest:{paper:"#FCFEFB",ink:"#102A22",muted:"#4F645B",accent:"#166534",accentSoft:"#DCFCE7",coverBg:"#0E3B2E",coverInk:"#F3FBF6",coverMuted:"#A9C7B8",coverAccent:"#6EE7B7",line:"#D5E6DC",panel:"#EFF8F2",panelInk:"#102A22",deep:"#166534"},
 sand:{paper:"#FFFCF5",ink:"#2C2118",muted:"#6B5846",accent:"#9A3412",accentSoft:"#FFEDD5",coverBg:"#EAD9BC",coverInk:"#2C2118",coverMuted:"#78624B",coverAccent:"#C2410C",line:"#E6D8C2",panel:"#FAF2E4",panelInk:"#2C2118",deep:"#C2410C"},
 cobalt:{paper:"#FFFFFF",ink:"#0B1B3A",muted:"#4A5B7A",accent:"#1D4ED8",accentSoft:"#DBEAFE",coverBg:"#0A2A6B",coverInk:"#F5F8FF",coverMuted:"#B4C6E8",coverAccent:"#7DD3FC",line:"#D3DEF0",panel:"#EFF4FF",panelInk:"#0B1B3A",deep:"#1E3A8A"},
 rose:{paper:"#FFF9FB",ink:"#32101F",muted:"#6E4A58",accent:"#9F1239",accentSoft:"#FFE4E6",coverBg:"#47091F",coverInk:"#FFF1F4",coverMuted:"#D8AEBB",coverAccent:"#FDA4AF",line:"#EAD3D9",panel:"#FBEFF3",panelInk:"#32101F",deep:"#9F1239"},
 graphite:{paper:"#FAFAF9",ink:"#18181B",muted:"#52525B",accent:"#3F3F46",accentSoft:"#E4E4E7",coverBg:"#18181B",coverInk:"#FAFAF9",coverMuted:"#A1A1AA",coverAccent:"#D4D4D8",line:"#D4D4D8",panel:"#F4F4F5",panelInk:"#18181B",deep:"#27272A"}
};
export function documentPalette(theme:DocumentTheme|string|undefined):DocumentPalette{
 return DOCUMENT_PALETTES[(theme as DocumentTheme) in DOCUMENT_PALETTES?theme as DocumentTheme:"midnight"];
}
