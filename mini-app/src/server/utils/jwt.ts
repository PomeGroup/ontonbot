import { SHARED_SECRET } from "@/constants";
import { decodeJwt, JWTPayload, jwtVerify, SignJWT } from 'jose';
import { CHAIN } from "@/constants";
import { ValueOf } from "@/types";

/**
 * Secret key for the token.
 */
const JWT_SECRET_KEY = SHARED_SECRET;

/**
 * Payload of the token.
 */
export type AuthToken = {
  address: string;
  network: ValueOf<typeof CHAIN>;
};

export type PayloadToken = {
  address: string
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
function buildDecodeToken<T extends JWTPayload>(): (token: string) => T | null {
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
