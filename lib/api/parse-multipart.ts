import { type NextRequest } from "next/server";
import { DomainError } from "@/lib/api/errors";

export interface ParsedFile {
  filename: string;
  contentType: string;
  size: number;
  buffer: Buffer;
}

export interface ParseMultipartOptions {
  fileField: string;
  requireFile?: boolean;
  maxBytes: number;
  allowedMime: readonly string[];
  textFields?: readonly string[];
}

export interface ParsedMultipart {
  fields: Record<string, string>;
  file: ParsedFile | null;
}

// Each entry: list of (offset, bytes) pairs — all must match for the file
// to be considered valid. Fixed-offset multi-segment matching catches
// formats like WebP that share their first 4 bytes with WAV/AVI (RIFF).
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[][]> = {
  "application/pdf": [[{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }]],
  "image/jpeg": [[{ offset: 0, bytes: [0xff, 0xd8, 0xff] }]],
  "image/png": [[{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }]],
  "image/webp": [[
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },         // "RIFF"
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },         // "WEBP"
  ]],
};

function magicBytesMatch(buf: Buffer, declaredMime: string): boolean {
  const variants = MAGIC_BYTES[declaredMime];
  if (!variants) return true;
  return variants.some((segments) =>
    segments.every(({ offset, bytes }) => bytes.every((b, i) => buf[offset + i] === b)),
  );
}

export async function parseMultipart(
  req: NextRequest,
  opts: ParseMultipartOptions,
): Promise<ParsedMultipart> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    throw new DomainError("INVALID_MULTIPART", { message: "expected multipart/form-data" }, 400);
  }

  const fields: Record<string, string> = {};
  for (const key of opts.textFields ?? []) {
    const value = formData.get(key);
    if (typeof value === "string") fields[key] = value;
  }

  const fileEntry = formData.get(opts.fileField);
  if (!fileEntry || !(fileEntry instanceof File)) {
    if (opts.requireFile !== false) {
      throw new DomainError("FILE_REQUIRED", { field: opts.fileField }, 400);
    }
    return { fields, file: null };
  }

  if (fileEntry.size > opts.maxBytes) {
    throw new DomainError("FILE_TOO_LARGE", { maxBytes: opts.maxBytes, gotBytes: fileEntry.size }, 413);
  }

  if (!opts.allowedMime.includes(fileEntry.type)) {
    throw new DomainError("UNSUPPORTED_MEDIA_TYPE", { mime: fileEntry.type, allowed: opts.allowedMime }, 415);
  }

  const buffer = Buffer.from(await fileEntry.arrayBuffer());
  if (!magicBytesMatch(buffer, fileEntry.type)) {
    throw new DomainError("UNSUPPORTED_MEDIA_TYPE", { reason: "magic_byte_mismatch" }, 415);
  }

  return {
    fields,
    file: {
      filename: fileEntry.name || "upload",
      contentType: fileEntry.type,
      size: fileEntry.size,
      buffer,
    },
  };
}
