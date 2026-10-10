declare module "fontkit";
declare module "bidi-js" {
  interface Bidi {
    getEmbeddingLevels(text: string, explicitDirection?: "ltr" | "rtl"): { levels: Uint8Array; paragraphs: { start: number; end: number; level: number }[] };
    getMirroredCharacter(char: string): string | null;
  }
  export default function bidiFactory(): Bidi;
}
