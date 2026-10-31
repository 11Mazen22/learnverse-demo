import type { CSSProperties } from "react";
const paths: Record<string, string> = {
  shield:"m12 3 8 3v6c0 5-5 8-8 10-3-2-8-5-8-10V6Zm-4 9 3 3 5-6",
  file:"M6 3h8l4 4v14H6Zm8 0v5h4M9 12h6M9 16h6",
  play:"m8 4 12 8-12 8z",
  pause:"M8 5v14M16 5v14",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  home: "m3 10 9-7 9 7v10H3Z M9 20v-7h6v7",
  book: "M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15",
  target: "M20 12a8 8 0 1 1-8-8 M12 8a4 4 0 1 0 4 4 M12 12l9-9 M16 3h5v5",
  review: "M4 9a8 8 0 1 1 0 6 M4 3v6h6",
  refresh: "M20 7V3h-4 M20 3l-4 4M4 17v4h4 M4 21l4-4M6 9a7 7 0 0 1 12-2M18 15a7 7 0 0 1-12 2",
  boss: "m12 3 3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1Z",
  ai: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z",
  chart: "M4 3v17h17 M8 15l4-5 4 2 5-7",
  gift: "M3 8h18v4H3Z M5 12v9h14v-9 M12 8v13 M12 8C4 9 5 1 9 3c2 1 3 5 3 5Zm0 0c8 1 7-7 3-5-2 1-3 5-3 5Z",
  check: "m5 12 4 4L20 5",
  lock: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5ZM12 15v2",
  palette: "M12 2C6.49 2 2 6.49 2 12c0 3.86 3.14 7 7 7h1a2 2 0 0 1 2 2 2 2 0 0 0 2 2 7 7 0 0 0 7-7c0-5.51-4.49-10-10-10Zm-5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z",
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
  sun: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.5 1.5m9.8 9.8 1.5 1.5M18.4 5.6l-1.5 1.5m-9.8 9.8-1.5 1.5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z",
  sparkles: "m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z",
  chevron: "m8 10 4 4 4-4",
  folder: "M3 6h7l2 2h9v11H3Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  stop: "M7 7h10v10H7Z",
  keyboard: "M3 6h18v12H3Zm3 4h.01m3 0h.01m3 0h.01m3 0h.01m3 0h.01M7 14h10",
  eye: "M2 12s3.7-7 10-7 10 7 10 7-3.7 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  "eye-off": "M3 3l18 18M10.6 5.1A11 11 0 0 1 12 5c6.3 0 10 7 10 7a15 15 0 0 1-3 4M6.2 6.1A16 16 0 0 0 2 12s3.7 7 10 7a10 10 0 0 0 4.1-.9M10 10a3 3 0 0 0 4 4",
  sliders: "M4 7h10m4 0h2M4 17h2m4 0h10M14 4v6M8 14v6",
  flame: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  star: "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  lightbulb: "M9 18h6m-4 4h2m-7-10a5 5 0 1 1 8 0c0 2-1 3-2 4h-4c-1-1-2-2-2-4Z",
  microscope: "M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9Zm3-8V2",
  compass: "m3 21 8.5-17.5a1 1 0 0 1 1.8 0L21.8 21M6.5 15h11",
  landmark: "m3 8 9-5 9 5M4 10h16M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18",
  feather: "M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8 2 22M17.5 15H9",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-10 10h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z",
  clipboard: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm0 9h6M9 15h4",
  award: "m12 15 3.5 6-3.5-2-3.5 2L12 15Zm0-1a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z",
  bot: "M12 8V4H8M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm5 6h.01M15 14h.01",
  swords: "m14.5 17.5 3 3 3.5-3.5-3-3M6.5 9.5 3.5 6.5 7 3l3 3M19 5l-8.5 8.5M5 19l8.5-8.5",
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
      data-icon={name}
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
