/**
 * Fisher-Yates shuffle algorithm
 * 
 * Provides both seeded (for testing) and non-seeded (for runtime) variants.
 * Runtime should use the non-seeded version by default.
 */

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 * Non-seeded variant for runtime use
 * 
 * @param array - Array to shuffle (will be modified in place)
 * @returns The shuffled array (same reference)
 */
export function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Seeded random number generator for deterministic testing
 * Uses a simple LCG (Linear Congruential Generator)
 */
class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Generate next random number between 0 and 1
     */
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

/**
 * Shuffle an array using a seeded random number generator
 * For deterministic testing only
 * 
 * @param array - Array to shuffle (will be modified in place)
 * @param seed - Seed for random number generator
 * @returns The shuffled array (same reference)
 */
export function shuffleSeeded<T>(array: T[], seed: number): T[] {
    const rng = new SeededRandom(seed);

    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}
