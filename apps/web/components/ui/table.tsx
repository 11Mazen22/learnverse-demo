import type { ReactNode } from "react";

export type DataColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  isRowHeader?: boolean;
};

/**
 * Container-query responsive data table wrapped in a keyboard-scrollable region
 * (`tabIndex={0}`, `role="region"`), stacking into cards below `600px`.
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowKey,
  empty,
  className = "",
}: {
  caption: string;
  columns: readonly DataColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T, index: number) => string;
  empty?: ReactNode;
  className?: string;
}) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div
      className={["nk-table-wrap", className].filter(Boolean).join(" ")}
      role="region"
      aria-label={caption}
      tabIndex={0}
    >
      <table className="nk-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey(row, index)}>
              {columns.map((col, colIndex) =>
                col.isRowHeader || colIndex === 0 ? (
                  <th key={col.key} scope="row">
                    {col.cell(row)}
                  </th>
                ) : (
                  <td key={col.key} data-label={col.header}>
                    {col.cell(row)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
