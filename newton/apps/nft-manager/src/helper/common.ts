import type { ReadStream } from "fs";

export async function stream2buffer(stream: ReadStream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf: Uint8Array[] = [];

    stream.on("data", (chunk) => _buf.push(chunk as Uint8Array));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(`error converting stream - ${err}`));
  });
}

export const isPlainObj = (o): boolean =>
  typeof o === "object" && o.constructor === Object;

export const getFileExtension = (filename: string): string =>
  filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2); // eslint-disable-line no-bitwise

export const getFileNameFromPath = (pathName: string): string =>
  pathName.slice(((pathName.lastIndexOf("/") - 1) >>> 0) + 2);

export const textToSlug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/-+/g, "-")
    .replace(/[^\w-]+/g, "");

export const uniqueBy = <T>(uniqueKey: string, objects: T[]): T[] => {
  const ids = objects.map((object) => object[uniqueKey]);

  return objects.filter(
    (object, index) => !ids.includes(object[uniqueKey], index + 1),
  );
};

export const midOrder = (prev: string, next: string): string => {
  let p!: number, n!: number, pos!: number, str;

  for (pos = 0; p === n; pos++) {
    // find leftmost non-matching character
    p = pos < prev.length ? prev.charCodeAt(pos) : 96;
    n = pos < next.length ? next.charCodeAt(pos) : 123;
  }

  str = prev.slice(0, pos - 1); // copy identical part of string

  if (p === 96) {
    // prev string equals beginning of next
    while (n === 97) {
      // next character is 'a'
      n = pos < next.length ? next.charCodeAt(pos++) : 123; // get char from next
      str += "a"; // insert an 'a' to match the 'a'
    }

    if (n === 98) {
      // next character is 'b'
      str += "a"; // insert an 'a' to match the 'b'
      n = 123; // set to end of alphabet
    }
  } else if (p + 1 === n) {
    // found consecutive characters
    str += String.fromCharCode(p); // insert character from prev
    n = 123; // set to end of alphabet

    while ((p = pos < prev.length ? prev.charCodeAt(pos++) : 96) === 122) {
      // p='z'
      str += "z"; // insert 'z' to match 'z'
    }
  }

  return `${str}${String.fromCharCode(Math.ceil((p + n) / 2))}`; // append middle character
};

export const prefixFile = (filename: string): string =>
  `${process.env.MINIO_PUBLIC_URL}/${filename}`;

export const randomChars = (length: number): string => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};

export const randomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

export const groupBy = <T>(items: T[], key: string): Record<string, T[]> =>
  items.reduce(
    (result, item) => ({
      ...result,
      [item[key]]: [...(result[item[key]] || []), item],
    }),
    {},
  );

export const omit = <T>(
  obj: Record<string, T>,
  keys: string[],
): Record<string, T> => {
  const output: Array<[string, T]> = [];

  for (const [key, value] of Object.entries(obj)) {
    if (!keys.includes(key)) {
      output.push([key, value]);
    }
  }

  return Object.fromEntries(output);
};

export const debounce = (
  callback: (...args: number[]) => void,
  wait: number,
): ((...args: number[]) => void) => {
  let timeoutId: number;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args); // eslint-disable-line prefer-spread
    }, wait);
  };
};

export const excludeFromArr = (arr: string[], exclude: string[]): string[] => {
  const excludeMap = exclude.reduce<Record<string, boolean>>(
    (all, item) => ({ ...all, [item]: true }),
    {},
  );

  return arr.filter((item) => !excludeMap?.[item]);
};

export const resolveVariables = (
  text: string,
  variables: Record<string, string> = {},
): string =>
  text.replace(/{{(\s*\w*\s*)}}/g, function (currentText, variable) {
    const escapedVariable = variable.trim();

    return variables?.[escapedVariable]
      ? variables?.[escapedVariable]
      : currentText;
  });

/* eslint-disable no-redeclare, @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any  */
export function nameof<TObject>(obj: TObject, key: keyof TObject): string;
export function nameof<TObject>(key: keyof TObject): string;

export function nameof(key1: any, key2?: any): any {
  return key2 ?? key1;
}
/* eslint-enable */
