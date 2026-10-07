export type FanarCapability = {
  id: string;
  label: string;
  category:
    | "chat"
    | "reasoning"
    | "islamic"
    | "vision"
    | "audio"
    | "image"
    | "safety"
    | "translation"
    | "creative";
  endpoint: string;
  quota: string;
  visibleInPicker: boolean;
  use: string;
};

export const FANAR_CAPABILITIES: FanarCapability[] = [
  {
    id: "Fanar",
    label: "Chat · Fanar",
    category: "chat",
    endpoint: "/chat/completions",
    quota: "50/min",
    visibleInPicker: true,
    use: "general",
  },
  {
    id: "Fanar-S-1-7B",
    label: "Fast · Fanar S 7B",
    category: "chat",
    endpoint: "/chat/completions",
    quota: "50/min",
    visibleInPicker: true,
    use: "fast",
  },
  {
    id: "Fanar-C-1-8.7B",
    label: "Reasoning · C 8.7B",
    category: "reasoning",
    endpoint: "/chat/completions",
    quota: "50/min",
    visibleInPicker: true,
    use: "reasoning",
  },
  {
    id: "Fanar-C-2-27B",
    label: "Reasoning · C 27B",
    category: "reasoning",
    endpoint: "/chat/completions",
    quota: "50/min",
    visibleInPicker: true,
    use: "deep-reasoning",
  },
  {
    id: "Fanar-Sadiq",
    label: "Islamic · Sadiq",
    category: "islamic",
    endpoint: "/chat/completions",
    quota: "50/min",
    visibleInPicker: true,
    use: "islamic",
  },
  {
    id: "Fanar-Sadiq-2",
    label: "Islamic · Sadiq 2",
    category: "islamic",
    endpoint: "/chat/completions",
    quota: "50/min",
    visibleInPicker: true,
    use: "islamic",
  },
  {
    id: "Fanar-Sadiq-2 (validate)",
    label: "Sadiq · Validate",
    category: "islamic",
    endpoint: "specialized",
    quota: "200/min",
    visibleInPicker: false,
    use: "validation",
  },
  {
    id: "Fanar-Sadiq-2 (deep research)",
    label: "Sadiq · Deep Research",
    category: "islamic",
    endpoint: "specialized",
    quota: "20/day",
    visibleInPicker: false,
    use: "deep-research",
  },
  {
    id: "Fanar-Sadiq-TTS-1",
    label: "Sadiq · Quran TTS",
    category: "audio",
    endpoint: "/audio/speech",
    quota: "20/day",
    visibleInPicker: false,
    use: "quran-tts",
  },
  {
    id: "Fanar-Oryx-IVU-2",
    label: "Vision · Oryx IVU 2",
    category: "vision",
    endpoint: "vision",
    quota: "20/day",
    visibleInPicker: true,
    use: "vision",
  },
  {
    id: "Fanar-Aura-TTS-2",
    label: "Audio · Aura TTS 2",
    category: "audio",
    endpoint: "/audio/speech",
    quota: "20/day",
    visibleInPicker: false,
    use: "tts",
  },
  {
    id: "Fanar-Aura-STT-1",
    label: "Audio · Aura STT",
    category: "audio",
    endpoint: "/audio/transcriptions",
    quota: "20/day",
    visibleInPicker: false,
    use: "stt",
  },
  {
    id: "Fanar-Aura-STT-LF-1",
    label: "Audio · Aura STT Long Form",
    category: "audio",
    endpoint: "specialized",
    quota: "10/day",
    visibleInPicker: false,
    use: "long-form-stt",
  },
  {
    id: "Fanar-Oryx-IG-2",
    label: "Image · Oryx IG 2",
    category: "image",
    endpoint: "/images/generations",
    quota: "20/day",
    visibleInPicker: false,
    use: "image",
  },
  {
    id: "Fanar-Guard-2",
    label: "Safety · Guard 2",
    category: "safety",
    endpoint: "/moderations",
    quota: "50/min",
    visibleInPicker: false,
    use: "moderation",
  },
  {
    id: "Fanar-Shaheen-MT-1",
    label: "Translation · Shaheen MT 1",
    category: "translation",
    endpoint: "/translations",
    quota: "20/day",
    visibleInPicker: false,
    use: "translation",
  },
  {
    id: "Fanar-Diwan",
    label: "Creative · Diwan",
    category: "creative",
    endpoint: "/poems/generations",
    quota: "50/min",
    visibleInPicker: false,
    use: "poetry",
  },
];

export const capabilityById = new Map(
  FANAR_CAPABILITIES.map((item) => [item.id, item]),
);
