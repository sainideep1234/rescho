// ─────────────────────────────────────────────────────────────────────────────
// src/lib/room/codeGenerator.ts — Generates and validates short room codes.
//
// Room codes look like "XK7M2P". They are shown to users so they can invite
// a friend by typing the code instead of sharing a long URL.
// ─────────────────────────────────────────────────────────────────────────────

// We deliberately exclude characters that look alike (0 vs O, 1 vs I vs l)
// so users don't get confused when reading the code out loud.
const SAFE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// ─────────────────────────────────────────────────────────────────────────────
// generateRoomCode
//
// Picks 6 random characters from SAFE_CHARACTERS and joins them into a string.
// Example output: "XK7M2P"
// ─────────────────────────────────────────────────────────────────────────────
export function generateRoomCode(): string {
  let code = "";

  for (let i = 0; i < 6; i++) {
    // Math.random() gives a decimal between 0 and 1 (e.g. 0.73).
    // Multiplying by the total number of characters and flooring gives a valid index.
    const randomIndex = Math.floor(Math.random() * SAFE_CHARACTERS.length);
    code += SAFE_CHARACTERS.charAt(randomIndex);
  }

  return code;
}

// ─────────────────────────────────────────────────────────────────────────────
// isValidRoomCode
//
// Returns true only if the string is exactly 6 uppercase letters or digits.
// Used to reject obviously wrong input before hitting the database.
//
// The regex /^[A-Z0-9]{6}$/ means:
//   ^        — start of string
//   [A-Z0-9] — any uppercase letter or digit
//   {6}      — exactly 6 of them
//   $        — end of string
// ─────────────────────────────────────────────────────────────────────────────
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}
