declare namespace Express {
  export interface Request {
    userAuth: {
      id: string;
      nome: string;
      email: string;
      perfil: "proprietario" | "administrador" | "participante" | "convidado";
      sessaoId: string;
    };
  }
}
