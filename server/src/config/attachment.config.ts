import "@/config/env";
import { resolve } from "path";

// Pasta base dos anexos; cada usuário acessa a subpasta com o próprio código.
const diretorio = resolve(process.env.ATTACHMENTS_DIR || "storage/anexos");

export default {
  diretorio,
};
