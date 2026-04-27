/**
 * Set of characters that are visually distinct to avoid user confusion (e.g., no 0/O or 1/I).
 */
const SAFE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generates a random 6-character room code using visually distinct characters.
 */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * SAFE_CHARACTERS.length);
    code += SAFE_CHARACTERS.charAt(randomIndex);
  }
  return code;
}

/**
 * Validates that a string matches the 6-character alphanumeric room code format.
 */
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}

