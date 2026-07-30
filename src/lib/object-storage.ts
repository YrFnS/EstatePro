import {
  createHash,
  createHmac,
  randomUUID,
} from "node:crypto";
import type { PropertyMediaType } from "@/lib/listing-lifecycle";

interface StorageConfig {
  endpoint: URL;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  forcePathStyle: boolean;
}

export interface UploadTarget {
  uploadUrl: string;
  publicUrl: string;
  storageKey: string;
  headers: Record<string, string>;
  expiresAt: string;
  type: PropertyMediaType;
}

const MIME_RULES: Record<
  string,
  { type: PropertyMediaType; maxBytes: number }
> = {
  "image/jpeg": { type: "image", maxBytes: 15 * 1024 * 1024 },
  "image/png": { type: "image", maxBytes: 15 * 1024 * 1024 },
  "image/webp": { type: "image", maxBytes: 15 * 1024 * 1024 },
  "image/avif": { type: "image", maxBytes: 15 * 1024 * 1024 },
  "video/mp4": { type: "video", maxBytes: 100 * 1024 * 1024 },
  "application/pdf": {
    type: "floorplan",
    maxBytes: 20 * 1024 * 1024,
  },
};

function storageConfig(): StorageConfig | null {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.trim();

  if (
    !endpoint ||
    !bucket ||
    !accessKeyId ||
    !secretAccessKey ||
    !publicBaseUrl
  ) {
    return null;
  }

  return {
    endpoint: new URL(endpoint),
    region: process.env.S3_REGION?.trim() || "auto",
    bucket,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
    forcePathStyle:
      process.env.S3_FORCE_PATH_STYLE?.toLowerCase() !== "false",
  };
}

export function isObjectStorageConfigured(): boolean {
  return Boolean(storageConfig());
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodePath(value: string): string {
  return value
    .split("/")
    .filter(Boolean)
    .map(encodeRfc3986)
    .join("/");
}

export function publicUrlForStorageKey(storageKey: string): string {
  const config = storageConfig();
  if (!config) {
    throw new Error("Object storage is not configured");
  }
  return `${config.publicBaseUrl}/${encodePath(storageKey)}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(
  key: string | Buffer,
  value: string
): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function dateParts(date: Date) {
  const iso = date
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function objectLocation(config: StorageConfig, key: string) {
  const endpointPath = config.endpoint.pathname.replace(/\/$/, "");
  const encodedKey = encodePath(key);

  if (config.forcePathStyle) {
    return {
      host: config.endpoint.host,
      canonicalUri: `${endpointPath}/${encodeRfc3986(
        config.bucket
      )}/${encodedKey}`.replace(/\/+/g, "/"),
    };
  }

  return {
    host: `${config.bucket}.${config.endpoint.host}`,
    canonicalUri: `${endpointPath}/${encodedKey}`.replace(
      /\/+/g,
      "/"
    ),
  };
}

function presignedObjectUrl(
  method: "PUT" | "DELETE",
  key: string,
  expiresSeconds = 900
): { url: string; expiresAt: Date } {
  const config = storageConfig();
  if (!config) {
    throw new Error("Object storage is not configured");
  }

  const now = new Date();
  const { amzDate, dateStamp } = dateParts(now);
  const service = "s3";
  const scope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const { host, canonicalUri } = objectLocation(config, key);

  const queryEntries = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    [
      "X-Amz-Credential",
      `${config.accessKeyId}/${scope}`,
    ],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expiresSeconds)],
    ["X-Amz-SignedHeaders", "host"],
  ] as const;

  const canonicalQuery = queryEntries
    .map(
      ([name, value]) =>
        `${encodeRfc3986(name)}=${encodeRfc3986(value)}`
    )
    .sort()
    .join("&");

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");

  const dateKey = hmac(`AWS4${config.secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, config.region);
  const serviceKey = hmac(regionKey, service);
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  const url = new URL(config.endpoint.toString());
  url.host = host;
  url.pathname = canonicalUri;
  url.search = `${canonicalQuery}&X-Amz-Signature=${signature}`;

  return {
    url: url.toString(),
    expiresAt: new Date(now.getTime() + expiresSeconds * 1_000),
  };
}

function safeFileName(fileName: string): string {
  const normalized = fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .toLowerCase();
  return normalized.slice(-120) || "media";
}

export function validateUpload(
  mimeType: string,
  sizeBytes: number
): { type: PropertyMediaType; maxBytes: number } {
  const rule = MIME_RULES[mimeType.toLowerCase()];
  if (!rule) {
    throw new Error(
      "Unsupported media type. Use JPEG, PNG, WebP, AVIF, MP4, or PDF."
    );
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    throw new Error("The uploaded file size is invalid.");
  }
  if (sizeBytes > rule.maxBytes) {
    throw new Error(
      `The file exceeds the ${Math.round(
        rule.maxBytes / 1024 / 1024
      )} MB limit.`
    );
  }
  return rule;
}

export function createUploadTarget(input: {
  propertyId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): UploadTarget {
  const config = storageConfig();
  if (!config) {
    throw new Error(
      "Object storage is not configured. Add a remote media URL instead."
    );
  }

  const rule = validateUpload(input.mimeType, input.sizeBytes);
  const year = new Date().getUTCFullYear();
  const storageKey = `properties/${input.propertyId}/${year}/${randomUUID()}-${safeFileName(
    input.fileName
  )}`;
  const signed = presignedObjectUrl("PUT", storageKey);

  return {
    uploadUrl: signed.url,
    publicUrl: publicUrlForStorageKey(storageKey),
    storageKey,
    headers: { "Content-Type": input.mimeType },
    expiresAt: signed.expiresAt.toISOString(),
    type: rule.type,
  };
}

export function ownsStorageKey(
  propertyId: string,
  storageKey: string
): boolean {
  return storageKey.startsWith(`properties/${propertyId}/`);
}

export async function deleteStoredObject(
  storageKey: string
): Promise<void> {
  if (!storageKey || !storageConfig()) return;
  const signed = presignedObjectUrl("DELETE", storageKey, 300);
  const response = await fetch(signed.url, { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Storage deletion failed with ${response.status}`);
  }
}
