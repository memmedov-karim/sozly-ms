import dotenv from "dotenv";
import { expand } from "dotenv-expand";

const env = dotenv.config();

expand(env);
