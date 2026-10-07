import type { CSSProperties } from "react";
const paths: Record<string, string> = {
  home: "m3 10 9-7 9 7v10H3Z M9 20v-7h6v7",
  book: "M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15",
  target: "M20 12a8 8 0 1 1-8-8 M12 8a4 4 0 1 0 4 4 M12 12l9-9 M16 3h5v5",
  review: "M4 9a8 8 0 1 1 0 6 M4 3v6h6",
  boss: "m12 3 3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1Z",
  ai: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z",
  chart: "M4 3v17h17 M8 15l4-5 4 2 5-7",
  gift: "M3 8h18v4H3Z M5 12v9h14v-9 M12 8v13 M12 8C4 9 5 1 9 3c2 1 3 5 3 5Zm0 0c8 1 7-7 3-5-2 1-3 5-3 5Z",
  check: "m5 12 4 4L20 5",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  arrow: "M19 12H5m6-6-6 6 6 6",
  plus: "M12 4v16M4 12h16",
  send: "m4 4 17 8-17 8 3-8Zm3 8h14",
  mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 11v1a7 7 0 0 0 14 0v-1M12 19v3m-4 0h8",
  copy: "M8 8h12v13H8ZM16 8V3H3v13h5",
  pin: "m8 3 9 0-1 7 4 4H4l5-4Zm4 11v8",
  archive: "M3 3h18v5H3Zm2 5v13h14V8M9 12h6",
  trash: "M3 6h18M5 6l1 15h12l1-15M9 6V3h6v3M10 10v7m4-7v7",
  edit: "m4 15 11-11 5 5L9 20H4Zm9-9 5 5",
  volume: "M4 9h4l5-4v14l-5-4H4Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  image: "M3 3h18v18H3Zm0 14 6-6 5 5 3-3 4 4M16 7h.01",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2",
  help: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9 9a3 3 0 1 1 4 3c-1 0-1 1-1 2m0 3h.01",
  sidebar: "M4 4h16v16H4Zm6 0v16 M7 8h.01 M7 12h.01 M7 16h.01",
  chat: "M4 5h16v11H8l-4 4Zm4 4h8M8 12h5",
  dots: "M6 12h.01M12 12h.01M18 12h.01",
  download: "M12 3v12m-5-5 5 5 5-5M4 20h16",
  screen: "M3 4h18v12H3Zm6 16h6m-3-4v4",
  sparkles: "m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z",
  chevron: "m8 10 4 4 4-4",
  folder: "M3 6h7l2 2h9v11H3Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  stop: "M7 7h10v10H7Z",
  keyboard: "M3 6h18v12H3Zm3 4h.01m3 0h.01m3 0h.01m3 0h.01m3 0h.01M7 14h10",
  sliders: "M4 7h10m4 0h2M4 17h2m4 0h10M14 4v6M8 14v6",
};
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name] ?? paths.ai} />
    </svg>
  );
}
