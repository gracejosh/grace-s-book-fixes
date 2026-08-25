import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Radio, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type Station = { id: string; name: string; tagline: string; url: string; hls?: boolean };

const STATIONS: Station[] = [
  {
    id: "k-love",
    name: "K-LOVE",
    tagline: "Positive, encouraging worship",
    url: "https://maestro.emfcdn.com/stream/k-love/tunein/aac",
  },
  {
    id: "air1",
    name: "Air1",
    tagline: "Worship now",
    url: "https://maestro.emfcdn.com/stream/air1/tunein/aac",
  },
  {
    id: "bbn",
    name: "BBN Radio",
    tagline: "Bible teaching & hymns",
    url: "https://bbnradio-lh.akamaihd.net/i/BBNRadio_1@174570/master.mu3u8",
    hls: true,
  },
];

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const [station, setStation] = useState<Station>(STATIONS[0]!);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = muted ? 0 : volume / 100;
  }, [volume, muted]);

  // Tear down any HLS instance when the station changes or on unmount.
  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  async function attachSource(target: Station) {
    const audio = audioRef.current;
    if (!audio) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;

    const canPlayNatively = audio.canPlayType("application/vnd.apple.mpegurl") !== "";
    if (target.hls && !canPlayNatively) {
      const { default: Hls } = await import("hls.js");
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(target.url);
        hls.attachMedia(audio);
        hlsRef.current = hls;
        return;
      }
    }
    audio.src = target.url;
  }

  async function play(target: Station) {
    setLoading(true);
    try {
      await attachSource(target);
      await audioRef.current?.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      toast.error(`${target.name} is not responding right now. Try another station.`);
    } finally {
      setLoading(false);
    }
  }

  function stop() {
    const audio = audioRef.current;
    audio?.pause();
    if (audio) audio.removeAttribute("src");
    hlsRef.current?.destroy();
    hlsRef.current = null;
    setPlaying(false);
  }

  function selectStation(next: Station) {
    setStation(next);
    if (playing) {
      stop();
      void play(next);
    }
  }

  return (
    <section
      aria-label="Gospel radio"
      className="overflow-hidden rounded-3xl border border-border bg-ink p-6 text-primary-foreground shadow-lift sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          <Radio className="size-3.5" />
          Gospel Radio
        </span>
        {playing ? (
          <Badge className="gap-1.5 border-0 bg-live text-live-foreground">
            <span className="live-dot inline-block size-1.5 rounded-full bg-live-foreground" />
            LIVE
          </Badge>
        ) : (
          <Badge variant="outline" className="border-primary-foreground/25 text-primary-foreground/70">
            Off air
          </Badge>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <Button
          size="lg"
          onClick={() => (playing ? stop() : void play(station))}
          disabled={loading}
          className="size-16 shrink-0 rounded-full bg-gold text-gold-foreground hover:bg-gold/90"
          aria-label={playing ? "Pause radio" : "Play radio"}
        >
          {loading ? (
            <Loader2 className="size-7 animate-spin" />
          ) : playing ? (
            <Pause className="size-7 fill-current" />
          ) : (
            <Play className="size-7 fill-current" />
          )}
        </Button>

        <div className="min-w-40 flex-1">
          <h2 className="text-display text-2xl font-semibold">{station.name}</h2>
          <p className="text-sm text-primary-foreground/70">{station.tagline}</p>
        </div>

        <div className="flex w-full max-w-56 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMuted((m) => !m)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </Button>
          <Slider
            value={[muted ? 0 : volume]}
            max={100}
            step={1}
            onValueChange={(v) => {
              setVolume(v[0] ?? 0);
              setMuted(false);
            }}
            aria-label="Volume"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {STATIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => selectStation(s)}
            aria-pressed={s.id === station.id}
            className={cn(
              "rounded-xl border px-4 py-3 text-left transition-colors",
              s.id === station.id
                ? "border-gold bg-gold/15"
                : "border-primary-foreground/15 hover:bg-primary-foreground/10",
            )}
          >
            <span className="block text-sm font-semibold">{s.name}</span>
            <span className="block text-xs text-primary-foreground/60">{s.tagline}</span>
          </button>
        ))}
      </div>

      <audio ref={audioRef} preload="none" />
    </section>
  );
}
