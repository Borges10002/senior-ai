import "@/config/env";
import { resolve } from "path";

// Pasta temporária dos uploads.
const tmpFolder = resolve(process.env.UPLOAD_TMP_DIR || "tmp/uploads");

export default {
  tmpFolder,
};
