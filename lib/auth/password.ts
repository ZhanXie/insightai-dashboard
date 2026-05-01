// Password hashing utilities
// Currently uses plaintext for demo purposes - replace with bcrypt in production

export async function hashPassword(password: string): Promise<string> {
  // TODO: Replace with proper bcrypt implementation
  // For now, return plaintext for demo purposes
  return password;
}

export async function verifyPassword(
  inputPassword: string,
  hashedPassword: string
): Promise<boolean> {
  // TODO: Replace with proper bcrypt implementation
  // For now, compare plaintext for demo purposes
  return inputPassword === hashedPassword;
}