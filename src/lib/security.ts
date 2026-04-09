const SAFE_HTTP_PROTOCOLS = new Set(["https:", "http:"]);

export const isValidUsername = (value: string) => /^[a-zA-Z0-9_]{3,30}$/.test(value);

export const isStrongPassword = (value: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(value);

export const sanitizeExternalUrl = (input: string): string | null => {
  const raw = (input || "").trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    if (!SAFE_HTTP_PROTOCOLS.has(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

export const sanitizeInternalPath = (input: string, allowedPrefixes: string[]): string | null => {
  const raw = (input || "").trim();
  if (!raw.startsWith("/")) return null;
  if (allowedPrefixes.some((prefix) => raw.startsWith(prefix))) return raw;
  return null;
};

export const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2]?.length === 11 ? match[2] : null;
};

export const assertSafeYoutubeEmbed = (url: string): string | null => {
  const id = extractYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
};

export const sanitizeFilename = (name: string): string => {
  const raw = (name || "file")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_");
  const cleaned = [...raw]
    .filter((char) => char.charCodeAt(0) >= 32)
    .join("")
    .slice(0, 100);
  return cleaned || "file";
};

export const validateUpload = (
  file: Blob | File,
  options: { maxBytes: number; allowedMimeTypes: string[] }
): { ok: boolean; reason?: string } => {
  if (file.size > options.maxBytes) {
    return { ok: false, reason: "File is too large." };
  }
  if (file instanceof File && file.type && !options.allowedMimeTypes.includes(file.type)) {
    return { ok: false, reason: "File type is not allowed." };
  }
  return { ok: true };
};
