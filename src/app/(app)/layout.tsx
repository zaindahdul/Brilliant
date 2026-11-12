import { Nav } from "@/components/nav/Nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
