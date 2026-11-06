import { Notify } from "quasar";

interface IError {
  message: string;
  type: "warning" | "positive" | "negative" | "info";
}

export default () => {
  const errorNotify = (error: any) => {
    Notify.create({
      type: "negative",
      message: error.response?.data?.message || error.message,
      icon: "report_problem",
    });
  };
  const personErrorNotify = (error: IError) => {
    Notify.create({
      color: error.type,
      message: error.message,
      icon: "report_problem",
    });
  };

  return {
    errorNotify,
    personErrorNotify,
  };
};
