export type Executor = {
  id: string;
  name: string;
  tagline: string;
  platform: string[];
  price: "Free" | "Paid" | "Key System";
  /** Whether the executor supports the current Roblox version */
  updateStatus: "Updated" | "Not updated";
  recommended?: boolean;
  features: string[];
  website: string;
  color: string;
  /** Path under /public */
  logo: string;
};

export const EXECUTORS: Executor[] = [
  {
    id: "velocity",
    name: "Velocity",
    tagline: "Our top pick — fast, free, and built for everyday scripting.",
    platform: ["Windows"],
    price: "Free",
    updateStatus: "Updated",
    recommended: true,
    features: ["Quick inject", "Active updates", "Script hub friendly"],
    website: "https://getvelocity.xyz",
    color: "#111111",
    logo: "/executors/velocity.png",
  },
  {
    id: "volt",
    name: "Volt",
    tagline: "Paid Windows executor with strong UNC and regular patches.",
    platform: ["Windows"],
    price: "Paid",
    updateStatus: "Updated",
    features: ["High UNC", "Weekly plan", "HWID tools"],
    website: "https://discord.gg/voltbz",
    color: "#ffe08a",
    logo: "/executors/volt.svg",
  },
  {
    id: "potassium",
    name: "Potassium",
    tagline: "Premium lifetime option with kernel-level performance.",
    platform: ["Windows"],
    price: "Paid",
    updateStatus: "Updated",
    features: ["Lifetime license", "High UNC", "Stable inject"],
    website: "https://potassium.pro",
    color: "#c9b6ff",
    logo: "/executors/potassium.png",
  },
  {
    id: "synapse-z",
    name: "Synapse Z",
    tagline: "Unofficial Synapse-branded paid executor — check update status.",
    platform: ["Windows"],
    price: "Paid",
    updateStatus: "Not updated",
    features: ["Weekly plan", "High UNC", "Familiar UI"],
    website: "https://synapsez.org",
    color: "#9fdcff",
    logo: "/executors/synapse-z.svg",
  },
  {
    id: "madium",
    name: "Madium",
    tagline: "Free Windows executor with frequent community updates.",
    platform: ["Windows"],
    price: "Free",
    updateStatus: "Updated",
    features: ["Free forever", "Solid UNC", "Easy setup"],
    website: "https://getmadium.com",
    color: "#b8f5c8",
    logo: "/executors/madium.svg",
  },
  {
    id: "cosmic",
    name: "Cosmic",
    tagline: "Paid lifetime executor — confirm it matches the latest Roblox build.",
    platform: ["Windows"],
    price: "Paid",
    updateStatus: "Not updated",
    features: ["Lifetime option", "High UNC", "Windows focused"],
    website: "https://getcosmic.net",
    color: "#7b5cff",
    logo: "/executors/cosmic.svg",
  },
  {
    id: "real",
    name: "Real",
    tagline: "Free executor option for casual scripting sessions.",
    platform: ["Windows"],
    price: "Key System",
    updateStatus: "Updated",
    features: ["Free tier", "Key system", "Community builds"],
    website: "#",
    color: "#ffc9b8",
    logo: "/executors/real.png",
  },
];

export function isFreePrice(price: Executor["price"]) {
  return price === "Free" || price === "Key System";
}
