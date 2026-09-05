// NOTE: the old TIERS constant (used by the pre-RevenueCat custom "/subscriptions/subscribe"
// endpoint) has been removed — real purchases now go through Apple/RevenueCat, and that
// endpoint has been disabled (see subscription.controller.ts). DEFAULT_TIERS below is the
// single remaining source of tier metadata, seeded into Firestore on first boot.

export const DEFAULT_TIERS = [
  {
    id: "explorer",
    name: "The Explorer",
    description:
      "Access to core market signals designed for structured observation.",
    capabilities: ["coreSignals"],
    // Explorer is the free default tier — there is no App Store product for it (see
    // PACKAGE_ID_BY_TIER in the app's paywall.tsx, which has no "explorer" entry).
    price: { weekly: 0, monthly: 0, annual: 0, oneTime: 0 },
    order: 0,
  },
  {
    id: "strategist",
    name: "The Strategist",
    description:
      "Expanded signal access with additional analytical indicators.",
    capabilities: ["coreSignals", "advancedIndicators"],
    // These numbers are DISPLAY-ONLY FALLBACKS used only if the live RevenueCat/App Store
    // price hasn't loaded yet. The real, charged price always comes from Apple via
    // com.woteva.elite.strategist.monthly — keep this in sync with App Store Connect so the
    // fallback is never far off, but it is never the source of truth for what gets charged.
    price: { weekly: 4.99, monthly: 19.99, annual: 159.99, oneTime: 299.99 },
    order: 1,
  },
  {
    id: "mathematician",
    name: "The Mathematician",
    description:
      "Full analytical access including structured analytics and deeper insight.",
    capabilities: ["coreSignals", "advancedIndicators", "analytics"],
    // Same note as above — keep in sync with com.woteva.elite.mathematician.monthly.
    price: { weekly: 7.99, monthly: 29.99, annual: 239.99, oneTime: 449.99 },
    order: 2,
  },
];
