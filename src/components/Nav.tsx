import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";

export function Nav() {
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-2xl glass px-5 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
            <Activity className="h-4 w-4 text-primary" />
          </span>
          <span className="font-display text-xl tracking-tight">
            Pulse<span className="text-primary">AI</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <NavLink to="/">Overview</NavLink>
          <NavLink to="/copilot">Co-Pilot</NavLink>
          <NavLink to="/radiology">Radiology</NavLink>
        </nav>
        <Link
          to="/copilot"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 glow-primary"
        >
          Launch console
        </Link>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-white/5 hover:text-foreground [&.active]:bg-white/8 [&.active]:text-foreground"
    >
      {children}
    </Link>
  );
}
