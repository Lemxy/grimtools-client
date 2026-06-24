import { ScrollTiltedGrid } from "@/components/ui/scroll-tilted-grid";

export default function DemoOne() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight">
          A field of stills
        </h1>
        <p className="mt-4 max-w-md text-sm opacity-60">
          Pictures rise from below, settle into focus, then tilt away as the page advances.
        </p>
      </section>

      <ScrollTiltedGrid loop />
    </main>
  );
}
