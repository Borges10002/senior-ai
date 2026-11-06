import { randomUUID } from "crypto";
import { issueToken, verifySessionToken } from "../tokenProfile";
import { sessions } from "../infra/typeorm/repositories/SessionStore";
import { credentialVersion, validAccount, tokenHash } from "../sessionSecurity";
import {
  default as mensagemConstansts,
  default as mensagemConstants,
} from "@/constants/mensagem.constants";
import parametroConstansts from "@/constants/parametro.constants";
import TOKEN_TYPE from "@/constants/tokenType.constants";
import auth from "@config/auth.config";
import { resumoPerfil } from "@modules/usuario/domain/perfil";
import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
import AppError from "@shared/errors/AppError";
import stringUtils from "@utils/string.utils";
import { inject, injectable } from "tsyringe";
import IAccountsRepository from "../domain/repositories/IAccountsRepository";
import bcrypt from "bcryptjs";

interface RequestAuthenticateUserDTO {
  usuario: string;
  email: string;
  password: string;
}

interface RequestRefreshTokenDTO {
  refreshToken: string;
}

interface ResponseAuthenticateUserDTO {
  user: {
    codigo: number;
    usuario: string;
    nome: string;
    email: string;
    nomeAbreviado: string;
    nivelAcesso: number;
    perfil: ReturnType<typeof resumoPerfil>;
  };
  token: string;
  refreshToken: string;
}

type ResponseRefreshTokenDTO = ResponseAuthenticateUserDTO;

const dummyPasswordHash = bcrypt.hashSync(randomUUID(), 10);

@injectable()
class AuthenticateUserUseCase {
  constructor(
    @inject("AccountsRepository")
    private accountsRepository: IAccountsRepository
  ) {}

  async authenticate({
    usuario,
    email,
    password,
  }: RequestAuthenticateUserDTO): Promise<ResponseAuthenticateUserDTO> {
    if (!email || !password) {
      throw new AppError(mensagemConstansts.USUARIO_INVALIDO, 401);
    }

    const user = await this.accountsRepository.findByEmail(email);

    if (!user) {
      await bcrypt.compare(password, dummyPasswordHash);
      throw new AppError(mensagemConstansts.USUARIO_INVALIDO, 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.senha);
    if (!passwordMatch || user.ativo !== parametroConstansts.SIM) {
      throw new AppError(mensagemConstansts.USUARIO_INVALIDO, 401);
    }

    return this.gerarTokens(user);
  }

  async refrehAuthenticate({
    refreshToken,
  }: RequestRefreshTokenDTO): Promise<ResponseRefreshTokenDTO> {
    if (!refreshToken)
      throw new AppError(mensagemConstansts.TOKEN_INVALIDO, 401);

    let codigo: number;
    let payload: any;
    try {
      payload = verifySessionToken(refreshToken, TOKEN_TYPE.REFRESH);
      codigo = Number(payload.sub);
    } catch (error) {
      throw new AppError(mensagemConstants.TOKEN_INVALIDO, 401);
    }

    // Recarrega o usuario para refletir alteracoes e bloquear inativos/excluidos.
    const user = await this.accountsRepository.findByUsuarioId(codigo);
    if (!user) {
      throw new AppError(mensagemConstants.TOKEN_INVALIDO, 401);
    }

    if (user.ativo == parametroConstansts.NAO) {
      throw new AppError(mensagemConstansts.USUARIO_INATIVO, 401);
    }

    if (!validAccount(user, payload.cv) || !(await sessions.active(payload.sid, codigo))) {
      throw new AppError(mensagemConstants.TOKEN_INVALIDO, 401);
    }
    const result = await this.gerarTokens(user, payload.sid, tokenHash(refreshToken));
    return result;
  }

  private async gerarTokens(user: Usuario, sid = randomUUID(), oldHash?: string): Promise<ResponseAuthenticateUserDTO> {
    const version = credentialVersion(user);
    const token = issueToken(TOKEN_TYPE.ACCESS, Number(user.codigo), sid, version);
    const refreshToken = issueToken(TOKEN_TYPE.REFRESH, Number(user.codigo), sid, version);

    if (oldHash) {
      if (!(await sessions.rotate(sid, oldHash, tokenHash(refreshToken)))) {
        throw new AppError(mensagemConstants.TOKEN_INVALIDO, 401);
      }
    } else {
      const decoded = verifySessionToken(refreshToken, TOKEN_TYPE.REFRESH);
      await sessions.create({ id: sid, codusuario: Number(user.codigo), refresh_hash: tokenHash(refreshToken), expira_em: new Date(decoded.exp * 1000) });
    }
    return {
      token,
      refreshToken,
      user: {
        codigo: Number(user.codigo),
        usuario: user.usuario,
        nome: user.nome,
        email: user.email,
        nomeAbreviado: stringUtils().getNomeAbreviadoUsuario(user.nome),
        nivelAcesso: Number(user.nivelacesso),
        perfil: resumoPerfil(user.nivelacesso),
      },
    };
  }
}

export { AuthenticateUserUseCase };
