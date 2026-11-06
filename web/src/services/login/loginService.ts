import { AxiosInstance } from "axios";
import { api } from "src/boot/axios";
import { ILogin } from "../../models/login.model";

export default class LoginService {
  private repository: AxiosInstance;

  constructor() {
    this.repository = api;
  }

  async login(param: ILogin) {
    return await this.repository.post("/sessions", param);
  }

  async verifyAccess(controle: { codRotina: number; codControle: number }) {
    return await this.repository.get("/verify-access", {
      params: {
        ...controle,
      },
    });
  }
}
