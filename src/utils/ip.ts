import { Request } from "express";
import { COMMA, EMPTY } from "../constants/character";

export function getClientIp(source: Request): string {
  // Debug logging (remove in production after fixing)
  console.log("=== IP Detection Debug ===");
  console.log("Headers:", {
    "x-forwarded-for": source.headers["x-forwarded-for"],
    "x-real-ip": source.headers["x-real-ip"],
    "cf-connecting-ip": source.headers["cf-connecting-ip"],
  });
  console.log("req.ip:", source.ip);
  console.log("socket.remoteAddress:", source.socket?.remoteAddress);
  console.log("========================");

  // Try multiple common proxy headers in order of reliability
  const headers = [
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip", // Cloudflare
    "x-client-ip",
    "x-cluster-client-ip",
    "forwarded-for",
    "forwarded",
  ];

  // Check each header
  for (const header of headers) {
    const value = source.headers[header];
    if (value) {
      const ip = Array.isArray(value)
        ? value[0]
        : value.split(COMMA)[0].trim();
      if (ip && ip !== "::1" && ip !== "127.0.0.1") {
        console.log(`Found IP from ${header}:`, ip);
        return normalizeIp(ip);
      }
    }
  }

  // Use Express req.ip (works when trust proxy is enabled)
  if (source.ip && source.ip !== "::1" && source.ip !== "127.0.0.1") {
    console.log("Found IP from req.ip:", source.ip);
    return normalizeIp(source.ip);
  }

  // Fallback to socket remote address
  const socketIp = source.socket?.remoteAddress;
  if (socketIp && socketIp !== "::1" && socketIp !== "127.0.0.1") {
    console.log("Found IP from socket:", socketIp);
    return normalizeIp(socketIp);
  }

  // If all else fails, return empty
  console.log("WARNING: Could not determine client IP!");
  return EMPTY;
}

function normalizeIp(ip: string): string {
  // Remove IPv6 prefix for IPv4-mapped addresses
  return ip.replace(/^::ffff:/, "");
}
