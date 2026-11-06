import { useQuasar } from "quasar";

export function useNotify() {
  const $q = useQuasar();

  const notifySuccess = (message: string) => {
    $q.notify({
      type: "positive",
      message,
      position: "top-right",
      timeout: 3500,
      group: false,
      icon: "check_circle",
      progress: true,
      actions: [{ label: "Fechar", color: "white" }],
    });
  };

  const notifyError = (message: string) => {
    $q.notify({
      type: "negative",
      message,
      position: "top",
      timeout: 0,
      actions: [{ label: "Fechar", color: "white" }],
    });
  };

  const notifyErrorWait = (message: string) => {
    $q.notify({
      type: "negative",
      message,
      position: "top",
      timeout: 5000, // 5 segundos
      actions: [{ label: "Fechar", color: "white" }],
    });
  };

  return {
    notifySuccess,
    notifyError,
    notifyErrorWait,
  };
}
