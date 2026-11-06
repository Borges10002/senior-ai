import UseLogin from "./UseLogin";

export interface IUser {
  usuario: string;
  nome: string;
  nomeAbreviado: string;
  permissaoAccess: { codRotina: number; codControle: number }[]
}

export default function UseUser() {
  const getUser = (): IUser => {
    const token = UseLogin().getToken();

    return token.user;
  };

  return {
    getUser,
  };
}
