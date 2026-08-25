import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { MediaImage } from "@/components/MediaImage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const INTERVAL_MS = 30 * 60 * 1000; // every 30 minutes
const STORAGE_KEY = "grace:last-ad-shown";

export function AdPopup() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const { data: ads = [] } = useQuery({
    queryKey: ["ads-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (ads.length === 0) return;

    const show = () => {
      setIndex((i) => (i + 1) % ads.length);
      setOpen(true);
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    };

    const last = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    const elapsed = Date.now() - last;
    const firstDelay = last === 0 ? 20_000 : Math.max(20_000, INTERVAL_MS - elapsed);

    const first = window.setTimeout(() => {
      show();
      const repeat = window.setInterval(show, INTERVAL_MS);
      timers.push(repeat);
    }, firstDelay);

    const timers: number[] = [first];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [ads.length]);

  const ad = ads[index];
  if (!ad) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-display text-2xl">{ad.title}</DialogTitle>
          {ad.body ? <DialogDescription>{ad.body}</DialogDescription> : null}
        </DialogHeader>
        {ad.image_url ? (
          <MediaImage
            path={ad.image_url}
            alt={ad.title}
            className="h-44 w-full rounded-xl object-cover"
          />
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Not now
          </Button>
          {ad.link_url ? (
            <Button asChild onClick={() => setOpen(false)}>
              <a href={ad.link_url}>Learn more</a>
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
