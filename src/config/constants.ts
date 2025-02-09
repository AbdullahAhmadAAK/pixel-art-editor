export const POLLING = {
  BLOCKS: 2_000, // Poll every 2 seconds for blocks
  STATS: 5_000, // Poll every 10 seconds for stats
} as const;

export const ANIMATION = {
  DURATION: 0.2, // Base duration for animations
  STAGGER: 0.05, // Stagger delay between items
  EXIT: {
    DURATION: 0.15,
    HEIGHT: 0.2,
  },
} as const;
