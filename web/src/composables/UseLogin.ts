import { sessionUser, setSession, clearSession } from "src/services/session";
import { logoutSession } from "src/boot/axios";
import useAuth from "src/hooks/auth/useAuth";
import useCatchError from "src/hooks/useCatchError";
import useSuccessNotify from "src/hooks/useSuccessNotify";
import { ILogin } from "src/models/login.model";
import { IUser } from "./UseUser";

interface IStore {
  user: IUser;
  token: string;
  refreshToken: string;
}

export default function UseLogin() {
  const login = async (form: ILogin) => {
    const { login } = useAuth();
    try {
      const response = await login(form);
      const { user, token, refreshToken } = response.data;

      storeToken({ user, token, refreshToken });

      useSuccessNotify().personSucessNotify({
        message: `Bem-Vindo ${user.nomeAbreviado}!`,
        type: "positive",
      });
    } catch (error) {
      return useCatchError().errorNotify(error);
    }
  };

  const logout = async () => {
    await logoutSession();
    clearToken();
  };

  const validateToken = async () => {
    const storage = getToken();
    if (storage) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  };

  const storeToken = (data: IStore) => {
    setSession(data.user);
  };

  const clearToken = () => { clearSession(); };
  const getToken = (): IStore => sessionUser.value ? { user: sessionUser.value } as IStore : null as any;

  return {
    login,
    logout,
    validateToken,
    getToken,
    storeToken,
  };
}
