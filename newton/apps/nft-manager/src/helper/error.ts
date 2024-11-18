import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { AxiosError } from "axios";

export function getErrorMessage(error: unknown) {
  let message = "";
  message =
    error instanceof PrismaClientKnownRequestError ||
    error instanceof PrismaClientUnknownRequestError ||
    error instanceof PrismaClientValidationError
      ? `DB Error: ${error.message}`
      : error instanceof AxiosError
        ? getAxiosErrorMessage(error)
        : JSON.stringify(error);

  return message;
}

function getAxiosErrorMessage(error: AxiosError) {
  const axiosString = JSON.stringify(error.toJSON());
  let message = "";
  switch (error.status) {
    case 400:
      message = `ba_request: response: ${getUnknownData(error.response.data)}`;
    case 404:
      message = `not_found: response: ${getUnknownData(error.response.data)}`;
    case 403:
      message = `forbidden: response: ${getUnknownData(error.response.data)}`;
    default:
      message = `internal_request_error`;
  }

  message += ` status: ${error.status} axios: ${axiosString}`;

  return message;
}
function getUnknownData(data: unknown): string {
  // return the data if it was no falsy
  if (data) return JSON.stringify(data);

  return "no_response";
}
