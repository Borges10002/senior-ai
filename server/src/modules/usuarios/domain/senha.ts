import AppError from "@shared/errors/AppError";

export const MENSAGEM_SENHA_FRACA =
  "Senha fraca. Use no mínimo 12 caracteres, até 72 bytes, letra, número e caractere especial.";

/** bcrypt ignora o que passa de 72 bytes: senhas maiores são recusadas. */
export function senhaForte(senha: string): boolean {
  const valor = String(senha || "");
  return (
    Array.from(valor).length >= 12 &&
    Buffer.byteLength(valor, "utf8") <= 72 &&
    /\p{L}/u.test(valor) &&
    /\d/.test(valor) &&
    /[^\p{L}\d]/u.test(valor)
  );
}

export function garantirSenhaForte(senha: string): void {
  if (!senhaForte(senha)) throw new AppError(MENSAGEM_SENHA_FRACA, 400);
}
