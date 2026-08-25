import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { sharePage } from "@/lib/media";

export function ShareButton({ title, path, text }: { title: string; path: string; text?: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={async () => {
        const url = `${window.location.origin}${path}`;
        const result = await sharePage(title, url, text);
        if (result === "copied") toast.success("Link copied to clipboard");
      }}
    >
      <Share2 className="size-4" />
      Share
    </Button>
  );
}
