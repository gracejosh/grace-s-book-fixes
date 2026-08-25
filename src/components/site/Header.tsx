import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, LogOut, Menu, Shield, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const LINKS = [
  { to: "/books", label: "Books" },
  { to: "/courses", label: "Courses" },
  { to: "/flyers", label: "Flyers" },
  { to: "/posts", label: "Posts" },
  { to: "/blog", label: "Blog" },
  { to: "/chat", label: "Chat" },
  { to: "/quiz", label: "Quiz" },
] as const;

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-5" />
          </span>
          <span className="text-display text-xl font-semibold">Grace Library</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Button key={l.to} asChild variant="ghost" size="sm">
              <Link to={l.to} activeProps={{ className: "bg-accent text-accent-foreground" }}>
                {l.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {isAdmin ? (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/admin">
                <Shield className="size-4" />
                Admin
              </Link>
            </Button>
          ) : null}
          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label="Profile">
                <Link to="/profile">
                  <UserRound className="size-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => void signOut()}>
                <LogOut className="size-5" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="text-display">Browse</SheetTitle>
              <nav className="mt-4 grid gap-1">
                {LINKS.map((l) => (
                  <Button key={l.to} asChild variant="ghost" className="justify-start">
                    <Link to={l.to} onClick={() => setOpen(false)}>
                      {l.label}
                    </Link>
                  </Button>
                ))}
                <Button asChild variant="ghost" className="justify-start">
                  <Link to="/contact" onClick={() => setOpen(false)}>
                    Contact & Give
                  </Link>
                </Button>
                {isAdmin ? (
                  <Button asChild variant="ghost" className="justify-start">
                    <Link to="/admin" onClick={() => setOpen(false)}>
                      Admin
                    </Link>
                  </Button>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
