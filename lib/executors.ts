export type Executor = {
  id: string;
  name: string;
  tagline: string;
  platform: string[];
  price: "Free" | "Paid" | "Key System";
  status: "Working" | "Updating" | "Detected";
  features: string[];
  website: string;
  color: string;
  emoji: string;
};

export const EXECUTORS: Executor[] = [
  {
    id: "solara",
    name: "Solara",
    tagline: "Popular free Windows executor with frequent updates.",
    platform: ["Windows"],
    price: "Free",
    status: "Working",
    features: ["UNC support", "Fast attach", "Script hub"],
    website: "https://getsolara.dev",
    color: "#ffe08a",
    emoji: "☀️",
  },
  {
    id: "xeno",
    name: "Xeno",
    tagline: "Lightweight free executor built for everyday scripting.",
    platform: ["Windows"],
    price: "Free",
    status: "Working",
    features: ["Keyless options", "Stable inject", "Community scripts"],
    website: "https://xeno.onl",
    color: "#c9b6ff",
    emoji: "⚡",
  },
  {
    id: "wave",
    name: "Wave",
    tagline: "Trusted paid executor with strong performance.",
    platform: ["Windows"],
    price: "Paid",
    status: "Working",
    features: ["High UNC", "Smooth UI", "Regular patches"],
    website: "https://wave.wtf",
    color: "#9fdcff",
    emoji: "🌊",
  },
  {
    id: "codex",
    name: "Codex",
    tagline: "Mobile-friendly option with an easy setup flow.",
    platform: ["Android", "iOS"],
    price: "Key System",
    status: "Working",
    features: ["Mobile support", "Delta UI", "Script save"],
    website: "https://codex.lol",
    color: "#b8f5c8",
    emoji: "📱",
  },
  {
    id: "velocity",
    name: "Velocity",
    tagline: "Fast free executor aimed at casual players.",
    platform: ["Windows"],
    price: "Free",
    status: "Updating",
    features: ["Quick inject", "Free forever", "Active Discord"],
    website: "#",
    color: "#ffc9b8",
    emoji: "🚀",
  },
  {
    id: "argon",
    name: "Argon",
    tagline: "Compact executor focused on stability over flash.",
    platform: ["Windows"],
    price: "Free",
    status: "Detected",
    features: ["Simple UI", "Auto-update", "Lua runner"],
    website: "#",
    color: "#ffd6ea",
    emoji: "💎",
  },
];
