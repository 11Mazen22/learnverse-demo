/** Portable, user-requested export format for the owner's saved Noata memories. */
export type MemoryExportRow = {
  content: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type MemoryExportDocument = {
  format: "noata.ai.memory-export";
  version: 1;
  exportedAt: string;
  consent: { enabled: boolean };
  memories: Array<{
    content: string;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
};

/** Exports only the fields a user expects; never includes account IDs or DB keys. */
export function serializeMemoryExport(
  rows: readonly MemoryExportRow[],
  enabled: boolean,
  exportedAt = new Date().toISOString(),
): string {
  const timestamp = new Date(exportedAt);
  if (!Number.isFinite(timestamp.getTime())) throw new Error("memory_export_date_invalid");
  if (rows.length > 50) throw new Error("memory_export_limit");
  const memories = rows.map((row) => {
    if (typeof row.content !== "string" || row.content.trim().length < 8 || row.content.length > 500) {
      throw new Error("memory_export_item_invalid");
    }
    return {
      content: row.content,
      createdAt: typeof row.created_at === "string" ? row.created_at : null,
      updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    };
  });
  const document: MemoryExportDocument = {
    format: "noata.ai.memory-export",
    version: 1,
    exportedAt: timestamp.toISOString(),
    consent: { enabled },
    memories,
  };
  return JSON.stringify(document, null, 2) + "\n";
}
