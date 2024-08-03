import { apiKeyAuthentication } from "@/server/auth";
import { NextResponse, NextRequest } from "next/server";

const protectWithAPIKeyPatterns: ProtectedRoute[] = [
  { methods: ["*"], pattern: /^\/api\/v1\/ticket(\/.*)?$/ },
  { methods: ["PATCH"], pattern: /^\/api\/v1\/order(\/.*)?$/ },
];

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", request.url);

  const pathname = request.nextUrl.pathname;
  const method = request.method;

  const isProtected = protectWithAPIKeyPatterns.some(
    (route) =>
      (route.methods.includes("*") || route.methods.includes(method)) &&
      route.pattern.test(pathname),
  );

  if (isProtected) {
    const errorResponse = apiKeyAuthentication(request);
    if (errorResponse) return errorResponse;
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

type ProtectedRoute = {
  methods: string[]; // Array of HTTP methods
  pattern: RegExp; // Regular expression for the path
};
