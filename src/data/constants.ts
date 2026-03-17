export const TIERS = {
  explorer: {
    id: "explorer",
    name: "The Explorer",
    description:
      "Access to core market signals designed for structured observation.",
    capabilities: ["coreSignals"],
    price: {
      monthly: 14.99,
      annual: 119.99, // ~33% saving
      oneTime: 199.99, // lifetime
    },
  },
  strategist: {
    id: "strategist",
    name: "The Strategist",
    description:
      "Expanded signal access with additional analytical indicators.",
    capabilities: ["coreSignals", "advancedIndicators"],
    price: {
      monthly: 24.99,
      annual: 199.99,
      oneTime: 349.99,
    },
  },
  mathematician: {
    id: "mathematician",
    name: "The Mathematician",
    description:
      "Full analytical access including structured analytics and deeper insight.",
    capabilities: ["coreSignals", "advancedIndicators", "analytics"],
    price: {
      monthly: 34.99,
      annual: 279.99,
      oneTime: 499.99,
    },
  },
};

export const DEFAULT_TIERS = [
  {
    id: "explorer",
    name: "The Explorer",
    description:
      "Access to core market signals designed for structured observation.",
    capabilities: ["coreSignals"],
    price: { weekly: 2.99, monthly: 9.99, annual: 79.99, oneTime: 149.99 },
    order: 0,
  },
  {
    id: "strategist",
    name: "The Strategist",
    description:
      "Expanded signal access with additional analytical indicators.",
    capabilities: ["coreSignals", "advancedIndicators"],
    price: { weekly: 4.99, monthly: 19.99, annual: 159.99, oneTime: 299.99 },
    order: 1,
  },
  {
    id: "mathematician",
    name: "The Mathematician",
    description:
      "Full analytical access including structured analytics and deeper insight.",
    capabilities: ["coreSignals", "advancedIndicators", "analytics"],
    price: { weekly: 7.99, monthly: 29.99, annual: 239.99, oneTime: 449.99 },
    order: 2,
  },
];
