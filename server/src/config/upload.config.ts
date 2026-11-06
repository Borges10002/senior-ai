import "@/config/env";
import crypto from "crypto";
import multer from "multer";
import { resolve } from "path";

// Pasta temporária dos uploads.
const tmpFolder = resolve(process.env.UPLOAD_TMP_DIR || "tmp/uploads");

export default {
  tmpFolder,
  storage: multer.diskStorage({
    destination: tmpFolder,
    filename: (request, file, callback) => {
      const fileHash = crypto.randomBytes(16).toString("hex");
      const fileName = `${fileHash}-${file.originalname}`;
      return callback(null, fileName);
    },
  }),
};
