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
