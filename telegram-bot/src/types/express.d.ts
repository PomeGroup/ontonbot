import 'express';
import { Bot } from 'grammy';

// express.d.ts
declare namespace Express {
  export interface Request {
    bot?: Bot
  }
}

