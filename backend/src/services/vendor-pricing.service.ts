type Currency = "EGP" | "USD";

const CONFIG = {
  currency: "EGP" as Currency,
  // Location: choose tiers by numeric location (fallback: 0)
  bazaar: {
    1: { TWO_BY_TWO: 15000, FOUR_BY_FOUR: 30000 }, // 150/300 EGP
    2: { TWO_BY_TWO: 12000, FOUR_BY_FOUR: 24000 },
    0: { TWO_BY_TWO: 10000, FOUR_BY_FOUR: 20000 },
  },
  platformPerDay: {
    1: 8000,    // 80 EGP/day
    2: 6000,
    0: 5000,
  },
};

export function computeVendorFee(params: {
  type: "BAZAAR" | "PLATFORM";
  boothSize: "TWO_BY_TWO" | "FOUR_BY_FOUR";
  location?: number;     // falls back to 0
  duration?: number;     // only for PLATFORM
}) {
  const loc = params.location ?? 0;
  if (params.type === "BAZAAR") {
    const tier = CONFIG.bazaar[loc as 1|2|0] ?? CONFIG.bazaar[0];
    const amount = tier[params.boothSize];
    return { paymentAmount: amount, paymentCurrency: CONFIG.currency };
  } else {
    const perDay = CONFIG.platformPerDay[loc as 1|2|0] ?? CONFIG.platformPerDay[0];
    const days = Math.max(1, params.duration ?? 1);
    return { paymentAmount: perDay * days, paymentCurrency: CONFIG.currency };
  }
}
