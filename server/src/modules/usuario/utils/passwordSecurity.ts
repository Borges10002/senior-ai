import AppError from "@shared/errors/AppError";

const PASSWORD_SECURITY_MESSAGE =
  "Senha fraca. Use no minimo 12 caracteres, ate 72 bytes, letra, numero e caractere especial";

const isStrongPassword = (password: string): boolean => {
  const normalizedPassword = String(password || "");

  return (
    Array.from(normalizedPassword).length >= 12 &&
    Buffer.byteLength(normalizedPassword, "utf8") <= 72 &&
    /[A-Za-z]/.test(normalizedPassword) &&
    /\d/.test(normalizedPassword) &&
    /[^A-Za-z0-9]/.test(normalizedPassword)
  );
};

const ensureStrongPassword = (password: string): void => {
  if (!isStrongPassword(password)) {
    throw new AppError(PASSWORD_SECURITY_MESSAGE, 400);
  }
};

export { ensureStrongPassword, isStrongPassword, PASSWORD_SECURITY_MESSAGE };
