declare namespace Express {
  export interface Request {
    userAuth: {
      codigo: string;
      usuario: string;
      nome: string;
      email?: string;
      nivelAcesso: number;
    };
  }
}