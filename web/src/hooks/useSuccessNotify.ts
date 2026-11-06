import { Notify, type QNotifyCreateOptions } from "quasar";

interface ISuccess {
  message: string;
  type: "warning" | "positive" | "info" | "negative";
  time?: number;
  position?: QNotifyCreateOptions["position"];
}

export default () => {
  const successNotify = (success: any) => {
    Notify.create({
      type: "positive",
      message: success.response?.data?.message || success.message,
      progress: true,
    });
  };

  const personSucessNotify = (success: ISuccess) => {
    Notify.create({
      type: success.type,
      message: success.message,
      timeout: success.time || 3000,
      progress: true,
      position: success.position || "top",
    });
  };

  const personSucessNotifyTop = (success: ISuccess) => {
    Notify.create({
      type: success.type,
      message: success.message,
      timeout: success.time || 5000,
      progress: true,
      position: "top",
    });
  };

  const errorNotify = (error: any) => {
    Notify.create({
      type: "negative",
      message:
        error?.response?.data?.message || error?.message || "Erro inesperado",
      progress: true,
      icon: "report_problem",
    });
  };

  const personErrorNotify = (error: ISuccess) => {
    Notify.create({
      type: "negative",
      message: error.message,
      timeout: error.time || 4000,
      progress: true,
      icon: "report_problem",
      position: error.position || "top",
    });
  };

  return {
    successNotify,
    personSucessNotify,
    personSucessNotifyTop,
    errorNotify,
    personErrorNotify,
  };
};
