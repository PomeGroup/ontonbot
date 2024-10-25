import { CHAIN } from "@tonconnect/ui-react";
import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";

/**
 * Secret key for the token.
 */
const JWT_SECRET_KEY = 'your_secret_key';

/**
 * Payload of the token.
 */
export type AuthToken = {
  address: string;
  network: CHAIN;
};

export type PayloadToken = {
  payload: string;
};

/**
 * Create a token with the given payload.
 */
function buildCreateToken<T extends JwtPayload>(expiresIn: string): (payload: T) => string {
  return (payload: T) => {
    return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn });
  };
}

export const createAuthToken = buildCreateToken<AuthToken>('1y');
export const createPayloadToken = buildCreateToken<PayloadToken>('15m');

/**
 * Verify the given token.
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;
    return decoded;
  } catch (e) {
    return null;
  }
}

/**
 * Decode the given token.
 */
function buildDecodeToken<T extends JwtPayload>(): (token: string) => T | null {
  return (token: string) => {
    try {
      return jwt.decode(token) as T;
    } catch (e) {
      return null;
    }
  };
}

export const decodeAuthToken = buildDecodeToken<AuthToken>();
export const decodePayloadToken = buildDecodeToken<PayloadToken>();
