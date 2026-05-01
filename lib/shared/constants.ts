// Shared constants used across the application

// Chat token budget management
export const CHAT_TOKEN_BUDGET = 32_000; // Total tokens for context window
export const CHAT_RESERVED_OUTPUT_TOKENS = 2_000; // Tokens reserved for model output
export const CHAT_MIN_HISTORY_TURNS = 2; // Minimum conversation turns to preserve
export const CHARS_PER_TOKEN = 3.5; // Conservative estimate for mixed Chinese/English