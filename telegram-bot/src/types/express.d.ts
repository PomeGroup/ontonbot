import 'express';
import { Telegraf } from "telegraf";

// express.d.ts
declare namespace Express {
  export interface Request {
    bot?: Telegraf
  }
}
