import { site } from "@/lib/site";

// Placeholder home page until the real layout lands (Phase 3).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">{site.name}</h1>
      <p className="text-lg text-foreground/70">{site.tagline}</p>
      <p className="text-foreground/70">{site.intro}</p>
    </main>
  );
}
