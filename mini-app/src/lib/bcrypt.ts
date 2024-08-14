import bcrypt from "bcrypt";

export function hashPassword(text: string): Promise<string> {
  const saltRounds = 10;
  return new Promise((resolve, reject) => {
    bcrypt.hash(text, saltRounds, (err, hash) => {
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
