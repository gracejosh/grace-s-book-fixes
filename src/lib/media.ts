import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKET = "media";

/** Uploads a file into the signed-in user's own folder and returns its storage path. */
export async function uploadMedia(userId: string, file: File, folder = "uploads") {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function resolveMediaUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("data:")) return pathOrUrl;
  const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(pathOrUrl, 60 * 60 * 6);
  return data?.signedUrl ?? null;
}

/** Resolves either an external URL or a private storage path to a displayable URL. */
export function useMediaUrl(pathOrUrl: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["media-url", pathOrUrl],
    queryFn: () => resolveMediaUrl(pathOrUrl),
    enabled: Boolean(pathOrUrl),
    staleTime: 1000 * 60 * 60,
  });
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("data:")) return pathOrUrl;
  return data ?? null;
}

export async function downloadMedia(pathOrUrl: string, filename: string) {
  const url = await resolveMediaUrl(pathOrUrl);
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function sharePage(title: string, url: string, text?: string) {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title, text, url });
      return "shared" as const;
    } catch {
      return "cancelled" as const;
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied" as const;
}
