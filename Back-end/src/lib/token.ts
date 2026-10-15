import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export type AuthTokenPayload = {
  sub: string;
  role: 'ADMIN' | 'OPERATOR';
  storeId: string;
};

export const createAccessToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, config.JWT_SECRET);

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.JWT_SECRET) as AuthTokenPayload;

export const createOpaqueToken = () => crypto.randomBytes(32).toString('hex');
export const hashOpaqueToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');
