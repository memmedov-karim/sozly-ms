import { Request } from "express";
import { COMMA, EMPTY } from "../constants/character";

export function getClientIp(source: Request): string {
  let ip: string | undefined;

  const forwarded = source.headers["x-forwarded-for"] as string | undefined;
  ip =
    forwarded?.split(COMMA)[0].trim() ||
    source.socket?.remoteAddress ||
    (source as any).ip;

  if (!ip) return EMPTY;

  return ip.replace(/^::ffff:/, "");
}
