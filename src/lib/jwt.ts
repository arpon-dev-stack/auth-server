import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface TokenPayload {
  userId: number;
  email: string;
  [key: string]: unknown;
}

export const generateAccessToken = async (
  payload: TokenPayload,
): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(ACCESS_SECRET);
};

export const generateRefreshToken = async (
  payload: TokenPayload,
): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(REFRESH_SECRET);
};

export const verifyAccessToken = async (
  token: string,
): Promise<TokenPayload> => {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload as TokenPayload;
};

export const verifyRefreshToken = async (
  token: string,
): Promise<TokenPayload> => {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as TokenPayload;
};
