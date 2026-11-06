/**
 * Define o perfil de um usuário direto no banco. Serve para criar o primeiro
 * administrador (depois disso, os admins gerenciam perfis pela tela).
 *
 *   npm run admin:promover -- email@exemplo.com            (banco local)
 *   npm run admin:promover:online -- email@exemplo.com     (banco do .env.online)
 *   npm run admin:promover -- email@exemplo.com usuario    (rebaixa para Usuário)
 */
import "./semSincronizar";
import "reflect-metadata";
import "@/config/env";
import nivelacessoConstants from "@/constants/nivelacesso.constants";
import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
import { TipecDataSource } from "@shared/infra/typeorm";

const PERFIS_POR_NOME: Record<string, number> = {
  usuario: nivelacessoConstants.USUARIO.level,
  gestor: nivelacessoConstants.GESTOR.level,
  admin: nivelacessoConstants.ADMINISTRADOR.level,
  administrador: nivelacessoConstants.ADMINISTRADOR.level,
};

async function main() {
  const [email, nomePerfil = "admin"] = process.argv.slice(2);
  const nivel = PERFIS_POR_NOME[nomePerfil.toLowerCase()];

  if (!email || !email.includes("@") || nivel === undefined) {
    console.error(
      "Uso: npm run admin:promover -- <email> [usuario|gestor|admin]",
    );
    process.exitCode = 1;
    return;
  }

  await TipecDataSource.initialize();
  try {
    const repositorio = TipecDataSource.getRepository(Usuario);
    const usuario = await repositorio.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!usuario) {
      console.error(`Nenhum usuário cadastrado com o e-mail ${email}. Cadastre a conta antes.`);
      process.exitCode = 1;
      return;
    }

    await repositorio.update({ codigo: usuario.codigo }, { nivelacesso: nivel });
    const perfil = Object.values(nivelacessoConstants).find((p) => p.level === nivel);
    console.log(`Perfil de ${usuario.nome} <${usuario.email}> definido como ${perfil?.nome}.`);
  } finally {
    await TipecDataSource.destroy();
  }
}

main().catch((erro) => {
  console.error("Falha ao definir perfil:", erro?.message ?? erro);
  process.exitCode = 1;
});
