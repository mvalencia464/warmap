"use node";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

function randomFileId(): string {
  const b = new Uint8Array(16);
  globalThis.crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const MAX_VISION = 6;

/**
 * Set in Convex dashboard → Environment variables:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 * - R2_PUBLIC_BASE_URL (e.g. https://media.stokeleads.com — no trailing slash)
 */
export const prepareUpload = action({
  args: {
    contentType: v.string(),
    fileExtension: v.string(),
  },
  async handler(ctx, { contentType, fileExtension }) {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;
    const ext = fileExtension.toLowerCase().replace(/^\./, "");
    if (!ALLOWED_EXT.has(ext)) {
      throw new Error("Use JPG, PNG, WebP, or GIF");
    }
    const allowTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);
    if (!allowTypes.has(contentType)) {
      throw new Error("Invalid content type");
    }

    const config = getR2Env();
    if (!config) {
      throw new Error(
        "Vision uploads are not configured. Add R2 env vars in the Convex dashboard.",
      );
    }

    const name = randomFileId();
    const r2Key = `vision/${userId}/${name}.${ext}`;
    const publicUrl = `${config.publicBase.replace(/\/$/, "")}/${r2Key}`;

    const client = createS3Client(config);

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: r2Key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    return { uploadUrl, r2Key, publicUrl, maxImages: MAX_VISION };
  },
});

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBase: string;
};

function readProcessEnv() {
  const g = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return g.process?.env;
}

function getR2Env(): R2Config | null {
  const p = readProcessEnv();
  const accountId = p?.R2_ACCOUNT_ID;
  const accessKeyId = p?.R2_ACCESS_KEY_ID;
  const secretAccessKey = p?.R2_SECRET_ACCESS_KEY;
  const bucket = p?.R2_BUCKET_NAME;
  const publicBase = p?.R2_PUBLIC_BASE_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBase };
}

function createS3Client(config: R2Config) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/**
 * Deletes the object in R2, then the Convex row. Use instead of `vision.remove` (removed).
 */
export const removeWithR2 = action({
  args: { id: v.id("visionImages") },
  async handler(ctx, { id }) {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    const row = await ctx.runQuery(internal.vision.getRowInternal, { id });
    if (!row || row.userId !== identity.subject) {
      throw new Error("Not found");
    }

    const config = getR2Env();
    if (!config) {
      throw new Error(
        "R2 is not configured; cannot remove file from storage.",
      );
    }

    const client = createS3Client(config);
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: row.r2Key,
        }),
      );
    } catch (e) {
      const err = e as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
      if (err.name === "NotFound" || err.Code === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
        // Object already gone — still remove DB row
      } else {
        throw e instanceof Error ? e : new Error("R2 delete failed");
      }
    }

    await ctx.runMutation(internal.vision.removeRowInternal, { id });
  },
});
