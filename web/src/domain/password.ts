export const PASSWORD_MESSAGE = "Use pelo menos 12 caracteres, com letra, número e símbolo. Evite senhas muito longas.";
export function passwordChecks(password: string) {
  return {
    minLength: Array.from(password).length >= 12 && new TextEncoder().encode(password).length <= 72,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}
export const isStrongPassword = (password: string) => Object.values(passwordChecks(password)).every(Boolean);
