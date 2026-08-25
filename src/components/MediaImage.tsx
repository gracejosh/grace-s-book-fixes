import { useMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function MediaImage({
  path,
  alt,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const url = useMediaUrl(path);

  if (!url) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}
        aria-hidden
      >
        <span className="text-display text-2xl opacity-40">✝</span>
      </div>
    );
  }

  return <img src={url} alt={alt} loading="lazy" className={className} />;
}
