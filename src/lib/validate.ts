import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; response: NextResponse };

export function validateBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): ValidationSuccess<T> | ValidationFailure {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = formatZodError(result.error);
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}

function formatZodError(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }
  return errors;
}
