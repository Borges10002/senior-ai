import { afterEach, describe, expect, it, vi } from "vitest";
import { lerRemetente, MailerSendEmailProvider } from "./MailerSendEmailProvider";

describe("MailerSendEmailProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MAILERSEND_API_TOKEN;
    delete process.env.EMAIL_REMETENTE;
  });

  it("lê o remetente com ou sem nome", () => {
    expect(lerRemetente('"Senior AI" <nao@x.com>')).toEqual({ email: "nao@x.com", name: "Senior AI" });
    expect(lerRemetente("Senior AI <nao@x.com>")).toEqual({ email: "nao@x.com", name: "Senior AI" });
    expect(lerRemetente("nao@x.com")).toEqual({ email: "nao@x.com" });
    expect(lerRemetente("")).toBeNull();
  });

  it("envia pela API com o token e o remetente configurados", async () => {
    process.env.MAILERSEND_API_TOKEN = "tok";
    process.env.EMAIL_REMETENTE = "Senior AI <info@x.mlsender.net>";
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 202 });
    vi.stubGlobal("fetch", fetch);

    const ok = await new MailerSendEmailProvider().enviar({ para: "a@b.com", assunto: "Oi", html: "<p>Oi</p>", texto: "Oi" });
    expect(ok).toBe(true);
    const [url, opcoes] = fetch.mock.calls[0]!;
    expect(url).toBe("https://api.mailersend.com/v1/email");
    expect(opcoes.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(opcoes.body)).toMatchObject({ from: { email: "info@x.mlsender.net", name: "Senior AI" }, to: [{ email: "a@b.com" }], subject: "Oi" });
  });

  it("sem token não envia; erro da API vira exceção", async () => {
    expect(await new MailerSendEmailProvider().enviar({ para: "a@b.com", assunto: "x", html: "", texto: "" })).toBe(false);
    process.env.MAILERSEND_API_TOKEN = "tok";
    process.env.EMAIL_REMETENTE = "info@x.com";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => "domain not verified" }));
    await expect(new MailerSendEmailProvider().enviar({ para: "a@b.com", assunto: "x", html: "", texto: "" })).rejects.toThrow(/422/);
  });
});
