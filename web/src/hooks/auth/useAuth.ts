import LoginService from "src/services/login/loginService";

const service = new LoginService();

const login = async (paramentros: any) =>
  service.login(paramentros);

const verifyAccess = async (codRotina: number, codControle: number) =>

  await service.verifyAccess({ codRotina, codControle });

export default () => ({
  login,
  verifyAccess,
});
