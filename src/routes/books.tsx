import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

import { MediaImage } from "@/components/MediaImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { resolveMediaUrl } from "@/lib/media";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Free Christian Books — Grace Library" },
      {
        name: "description",
        content: "Browse and download free Christian books, devotionals and classics by category.",
      },
      { property: "og:title", content: "Free Christian Books — Grace Library" },
      { property: "og:description", content: "Download free Christian books and devotionals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BooksPage,
});

function BooksPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(books.map((b) => b.category)))],
    [books],
  );

  const filtered = books.filter((b) => {
    const matchesCat = category === "All" || b.category === category;
    const needle = q.trim().toLowerCase();
    const matchesQ =
      !needle ||
      b.title.toLowerCase().includes(needle) ||
      (b.author ?? "").toLowerCase().includes(needle);
    return matchesCat && matchesQ;
  });

  async function download(fileUrl: string | null, title: string) {
    if (!fileUrl) {
      toast.error("No file available for this book yet.");
      return;
    }
    const url = await resolveMediaUrl(fileUrl);
    if (!url) {
      toast.error("Could not open this file.");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = title;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-display text-4xl font-bold">Books</h1>
      <p className="mt-2 text-muted-foreground">Every title here is free to read and download.</p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or author"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={c === category ? "default" : "outline"}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-12 text-muted-foreground">Loading books…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-12 text-muted-foreground">No books match your search yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <Card key={book.id} className="card-lift flex flex-col overflow-hidden border-border">
              <div className="relative">
                <MediaImage path={book.cover_url} alt={book.title} className="h-60 w-full object-cover" />
                {book.is_free ? (
                  <Badge className="absolute left-3 top-3 bg-gold text-ink">FREE</Badge>
                ) : null}
              </div>
              <CardContent className="flex flex-1 flex-col p-5">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {book.category}
                </span>
                <h2 className="mt-2 text-display text-xl font-semibold leading-tight">{book.title}</h2>
                {book.author ? <p className="text-sm text-muted-foreground">by {book.author}</p> : null}
                {book.description ? (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{book.description}</p>
                ) : null}
                <Button className="mt-5 w-full" onClick={() => void download(book.file_url, book.title)}>
                  <Download className="size-4" />
                  Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
