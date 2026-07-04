import { readFile } from "node:fs/promises";
import path from "node:path";

import { requireAdmin } from "@/admin/auth/require-admin";
import { getRequestLocaleFromRequest } from "@/shared/i18n/server";

import { getPreviewEmail } from "../email-previews";

type RouteContext = {
  params: Promise<{
    template: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  await requireAdmin();

  const { template } = await context.params;
  const email = getPreviewEmail(template, getRequestLocaleFromRequest(request));

  if (!email) {
    return new Response("Email template not found", { status: 404 });
  }

  let html = email.template.html;

  for (const asset of email.template.assets ?? []) {
    const bytes = await readFile(path.resolve(process.cwd(), asset.filePath), "base64");
    const dataUrl = `data:${asset.contentType};base64,${bytes}`;
    const escapedPublicPath = asset.publicPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    html = html.replace(new RegExp(`https?://[^"']+${escapedPublicPath}`, "g"), dataUrl);
  }

  return new Response(new TextEncoder().encode(html), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
