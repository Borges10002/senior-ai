// Modelos dos e-mails do Senior AI (HTML simples, com a identidade DimiTech).

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const urlWeb = () => (process.env.WEB_URL || "https://seniorai.dimitech.com.br").replace(/\/$/, "");

function layout(titulo: string, corpo: string, botao?: { texto: string; url: string }) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f6fb;font-family:Segoe UI,Arial,sans-serif;color:#0f1b2d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0c0d13;padding:20px 24px;color:#94baff;font-weight:700;font-size:18px">Senior AI</td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 12px;font-size:20px">${escapar(titulo)}</h1>
${corpo}
${botao ? `<p style="margin:24px 0"><a href="${botao.url}" style="background:#2457f5;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;display:inline-block">${escapar(botao.texto)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:16px 24px;background:#f4f6fb;color:#5b6b82;font-size:12px">Você recebeu este e-mail porque tem uma conta no Senior AI · DimiTech.</td></tr>
</table></td></tr></table></body></html>`;
}

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function emailRecuperacaoSenha(nome: string, link: string, minutos: number) {
  const primeiro = nome.split(" ")[0] || nome;
  return {
    assunto: "Redefinir sua senha do Senior AI",
    html: layout(
      "Redefinir sua senha",
      `<p>Olá, ${escapar(primeiro)}!</p>
<p>Recebemos um pedido para trocar a senha da sua conta. Clique no botão abaixo para criar uma nova senha. O link vale por ${minutos} minutos e só pode ser usado uma vez.</p>
<p style="color:#5b6b82;font-size:13px">Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>`,
      { texto: "Criar nova senha", url: link },
    ),
    texto: `Olá, ${primeiro}! Para criar uma nova senha do Senior AI, acesse: ${link}\nO link vale por ${minutos} minutos. Se não foi você, ignore este e-mail.`,
  };
}
