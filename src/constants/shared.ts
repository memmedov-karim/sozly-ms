export const CORS_ORIGIN = process.env.CLIENT_URL?.split(',') || '*';
export const API_KEYS = process.env.VALID_API_KEYS?.split(',') || [];
