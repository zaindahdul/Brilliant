import { Nav } from "@/components/nav/Nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted">
        Nudge · an open, Brilliant-style tutor for Math 54 and CE C30 / ME C85. The AI nudges; you do the work.
      </footer>
    </div>
  );
}
