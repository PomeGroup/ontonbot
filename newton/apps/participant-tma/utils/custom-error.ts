type ErrorName =
  | 'REQUEST_401_ERROR'


export class RequestError extends Error {
  name: ErrorName
  message: string;
  cause?: any;

  constructor({ message, name, cause }: { name: ErrorName, message: string, cause?: any }) {
    super()
    this.name = name
    this.message = message
    this.cause = cause
  }
}
