import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the project-level .env (one level above src/ when compiled it sits two levels above dist/config)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
