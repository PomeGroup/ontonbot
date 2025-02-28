export interface StructuredErrorShape {
  status: number;
  errorBody: {
    success: boolean;
    message?: string;
    status?: string;
    [key: string]: any;
  };
}

// A simple type guard function
export const isStructuredErrorShape = (err: unknown): err is StructuredErrorShape =>
  typeof err === "object" && err !== null && "status" in err && "errorBody" in err;
