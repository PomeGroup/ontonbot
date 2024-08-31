import { TRPCError } from "@trpc/server";
import { ZodError } from "zod";

const parseStringError = (errorString: string): string[] => {
  try {
    const errorObject = JSON.parse(errorString);
    return getErrorMessages(errorObject);
  } catch {
    // ignore
  }
  return [errorString];
};

export const getErrorMessages = (error: any): string[] => {
  if (Array.isArray(error)) {
    return error.map((item) => getErrorMessages(item)).flat();
  }

  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message);
  }

  if (error instanceof TRPCError) {
    return [error.message];
  }

  if (typeof error === "string") {
    return parseStringError(error);
  }

  if (error instanceof Error) {
    return [error.message];
  }

  if (error?.message) {
    return [error.message];
  }

  return ["An unknown error occurred."];
};
