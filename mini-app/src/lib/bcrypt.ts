import bcrypt from "bcrypt";

// DO NOT CHANGE THE SALT ROUNDS
const SALTROUNDS: SaltRoundsT = 10;

export function hashPassword(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(text, SALTROUNDS, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}

export function comparePassword(text: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(text, hash, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

type SaltRoundsT = 10;

const bcryptLib = {
    hashPassword,
    comparePassword,
    };
export default bcryptLib;
