"use node";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v } from "convex/values";
import { action } from "./_generated/server";

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

    const env = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
    const p = env.process?.env;
    const accountId = p?.R2_ACCOUNT_ID;
    const accessKeyId = p?.R2_ACCESS_KEY_ID;
    const secretAccessKey = p?.R2_SECRET_ACCESS_KEY;
    const bucket = p?.R2_BUCKET_NAME;
    const publicBase = p?.R2_PUBLIC_BASE_URL;
    if (
      !accountId
      || !accessKeyId
      || !secretAccessKey
      || !bucket
      || !publicBase
    ) {
      throw new Error(
        "Vision uploads are not configured. Add R2 env vars in the Convex dashboard.",
      );
    }

    // Run a lightweight count check via a follow-up: clients call add() after;
    // we can't query DB from action easily without internal API — skip or use runQuery
    // For cap, the add mutation enforces. OK to prepare URL even if at cap; add will fail.

    const name = randomFileId();
    const r2Key = `vision/${userId}/${name}.${ext}`;
    const publicUrl = `${publicBase.replace(/\/$/, "")}/${r2Key}`;

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: r2Key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    return { uploadUrl, r2Key, publicUrl, maxImages: MAX_VISION };
  },
});
