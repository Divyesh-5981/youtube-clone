import crypto from "crypto";
import path from "path";

import multer from "multer";

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (_req, file, cb) {
    // This generates a Universally Unique Identifier (UUID) 🆔 (e.g., 123e4567-e89b-12d3-a456-426614174000).
    const uniqueSuffix = crypto.randomUUID();
    // This looks at the file the user uploaded and grabs the extension 🏷️ (like .png or .pdf).
    const ext = path.extname(file.originalname); // e.g. ".jpg"
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

export { upload };
