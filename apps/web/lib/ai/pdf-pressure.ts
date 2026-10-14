let active = 0;
export class PdfBusyError extends Error {}
export function acquirePdfSlot() {
  if (active >= 2) throw new PdfBusyError("PDF renderer is busy");
  active++;
  let released = false;
  return () => { if (!released) { released = true; active--; } };
}
