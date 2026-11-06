import App from "@/shared/infra/http/app";
import "@/config/env";



const app = new App();
app
  .start(Number(process.env.PORT) || 3333)
  .catch((error) => console.log("[APP]", error));
