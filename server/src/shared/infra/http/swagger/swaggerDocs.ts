import swaggerJSDoc from "swagger-jsdoc";
import { swaggerRoutes } from "../routes";

export default function swaggerDocs(): object {
  const swaggerOptions: swaggerJSDoc.Options = {
    swaggerDefinition: {
      openapi: "3.0.0",
      info: {
        title: "Senior AI API",
        description: "Assistente executivo inteligente: reuniões, atas, tarefas e agenda",
        version: "1.0.0",
        contact: { email: "contato@dimitech.com.br" },
      },
      servers: [
        {
          url: "/",
          description: "Servidor atual",
        },
      ],
    },
    apis: [],
  };

  const paths: { [key: string]: any } = {};
  Object.entries(swaggerRoutes).forEach(([path, methods]) => {
    paths[path] = methods;
  });

  swaggerOptions.swaggerDefinition!.paths = paths;
  const swaggerDocs = swaggerJSDoc(swaggerOptions);

  return swaggerDocs;
}
