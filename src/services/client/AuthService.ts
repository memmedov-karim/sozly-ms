import crypto from "crypto";
import { USER_ID_PREFIX } from "../../constants/character";

export function generateUserId(): string {
  const SECRET_KEY = process.env.USER_ID_SECRET as string;
  const random = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(random)
    .digest("hex");

  return `${USER_ID_PREFIX}${random}_${signature}`;
}

export function verifyUserId(userId: string): boolean {
  const SECRET_KEY = process.env.USER_ID_SECRET as string;

  if (!userId.startsWith(USER_ID_PREFIX)) return false;

  const parts = userId.split("_");
  if (parts.length !== 3) return false;

  const random = parts[1];
  const signature = parts[2];

  const expectedSignature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(random)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
