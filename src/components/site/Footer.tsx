import { Link } from "@tanstack/react-router";
import { Heart, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <h3 className="text-display text-lg font-semibold">Grace Library</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Free Christian books, courses, teaching and fellowship — for everyone, everywhere.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Explore</h4>
          <ul className="mt-3 grid gap-1.5 text-sm">
            <li>
              <Link to="/books" className="hover:text-primary">
                Books
              </Link>
            </li>
            <li>
              <Link to="/courses" className="hover:text-primary">
                Courses
              </Link>
            </li>
            <li>
              <Link to="/blog" className="hover:text-primary">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/chat" className="hover:text-primary">
                Community chat
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Connect</h4>
          <ul className="mt-3 grid gap-1.5 text-sm">
            <li>
              <Link to="/contact" className="inline-flex items-center gap-2 hover:text-primary">
                <Mail className="size-4" /> Contact us
              </Link>
            </li>
            <li>
              <Link to="/contact" hash="donate" className="inline-flex items-center gap-2 hover:text-primary">
                <Heart className="size-4" /> Give
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Grace Library. Freely you received, freely give.
      </p>
    </footer>
  );
}
