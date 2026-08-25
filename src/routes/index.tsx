import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, MessagesSquare, Newspaper } from "lucide-react";

import { MediaImage } from "@/components/MediaImage";
import { RadioPlayer } from "@/components/RadioPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Grace Library — Free Christian Books, Courses & Gospel Radio" },
      {
        name: "description",
        content:
          "Download free Christian books, watch teaching courses, tune into live gospel radio and join the community.",
      },
      { property: "og:title", content: "Grace Library — Free Christian Books & Gospel Radio" },
      {
        property: "og:description",
        content: "Free books and courses, live gospel radio, flyers, posts, blog and community chat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const SECTIONS = [
  { to: "/books", label: "Books", copy: "Free classics and devotionals", icon: BookOpen },
  { to: "/courses", label: "Courses", copy: "Video teaching series", icon: GraduationCap },
  { to: "/blog", label: "Blog", copy: "Articles, images and video", icon: Newspaper },
  { to: "/chat", label: "Community", copy: "Live rooms and prayer", icon: MessagesSquare },
] as const;

function Home() {
  const { data: books = [] } = useQuery({
    queryKey: ["books-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge variant="outline" className="border-gold/60 bg-gold/10 text-xs uppercase tracking-[0.2em]">
              Always free
            </Badge>
            <h1 className="mt-5 text-display text-4xl font-bold leading-[1.05] sm:text-6xl">
              Grow in grace, one page at a time.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              A growing library of Christian books and courses, live gospel radio, and a community that prays
              together — free for everyone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/books">Browse the library</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/courses">Watch a course</Link>
              </Button>
            </div>
          </div>
          <RadioPlayer />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((s) => (
            <Link key={s.to} to={s.to}>
              <Card className="card-lift h-full border-border">
                <CardContent className="p-6">
                  <s.icon className="size-6 text-gold" />
                  <h3 className="mt-4 text-display text-xl font-semibold">{s.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.copy}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-display text-3xl font-semibold">Latest in the library</h2>
          <Button asChild variant="ghost">
            <Link to="/books">See all</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <Card key={book.id} className="card-lift overflow-hidden border-border">
              <MediaImage path={book.cover_url} alt={book.title} className="h-52 w-full object-cover" />
              <CardContent className="p-4">
                <h3 className="text-display text-lg font-semibold leading-tight">{book.title}</h3>
                <p className="text-sm text-muted-foreground">{book.author}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
