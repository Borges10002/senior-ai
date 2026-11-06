import { IUsuarioLogado } from "src/models/usuario.model";

export interface UserStateInterface {
  usuario: IUsuarioLogado;
}

function state(): UserStateInterface {
  return {
    usuario: { id: 0, nome: "" },
  };
}

export default state;
