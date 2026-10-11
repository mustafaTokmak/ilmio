'use strict';

// Brainstorm helper: many people stall on "write a memory" and "pick a motif".
// This module returns a few curated suggestion pairs (memory → intended visual
// influence) tuned to the gift story, so a friend can start from an idea
// instead of a blank box. Deterministic — the same pools every run — and
// honestly labeled in the UI as demo suggestions, not AI output.
//
// A real LLM-backed suggester would implement the same {suggest(friend, gift,
// takenContributions) -> [{memory, influence}]} signature.

const POOLS = {
  // Suggestions tailored to the seeded story (Turkish-inspired textile gift).
  housewarming: [
    {
      memory: 'Lemon sprigs from our garden walks',
      influence: 'one small lemon-and-leaf detail',
    },
    {
      memory: 'Blue tiled courtyards and Turkish motifs',
      influence: 'a simplified tulip and thin geometric border',
    },
    {
      memory: 'Calm home. Minimal pattern. No lettering.',
      influence: 'more empty space, quieter border, no words',
    },
    {
      memory: 'Turkish coffee mornings that ran long',
      influence: 'a tiny cezve silhouette or steam curl',
    },
    {
      memory: 'Ferry rides across the Bosphorus',
      influence: 'a faint wave line along the bottom edge',
    },
    {
      memory: 'Her grandmother’s embroidered tablecloths',
      influence: 'a delicate stitch texture in the border',
    },
    {
      memory: 'Pomegranate seeds shared on the balcony',
      influence: 'a small pomegranate accent in one corner',
    },
    {
      memory: 'Evenings listening to the call to prayer echo',
      influence: 'a soft crescent curve, barely there',
    },
    {
      memory: 'Olive branches from the Aegean trip',
      influence: 'a muted olive sprig between motifs',
    },
  ],
  default: [
    {
      memory: 'A place you went together',
      influence: 'a small landmark or landscape detail',
    },
    {
      memory: 'Something they always say or do',
      influence: 'a subtle repeated motif',
    },
    {
      memory: 'A shared inside joke',
      influence: 'one small hidden detail only they would spot',
    },
  ],
};

// Return `count` suggestions for a friend, skipping pools already "taken"
// by matching memory text in existing contributions.
function suggest(gift, friend, contributions, count) {
  const pool = POOLS[gift.occasion] || POOLS.default;
  const taken = new Set(
    Object.values(contributions || {})
      .filter(Boolean)
      .map((c) => c.text.trim().toLowerCase())
  );
  const fresh = pool.filter((p) => !taken.has(p.memory.trim().toLowerCase()));
  return fresh.slice(0, count || 3);
}

module.exports = { suggest, POOLS };
