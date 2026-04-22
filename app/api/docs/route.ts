import { ApiReference } from "@scalar/nextjs-api-reference";

export const GET = ApiReference({
  url: "/api/v1/openapi.json",
  pageTitle: "EasySlip HR API Docs",
} as Parameters<typeof ApiReference>[0]);
