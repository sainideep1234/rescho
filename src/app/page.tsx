import { Hero, Features } from "@/components/landing";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-16 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-text-muted text-sm flex items-center gap-1">
            <span className="gradient-text-primary font-bold text-base">
              RESCHO
            </span>{" "}
            &copy; {new Date().getFullYear()}
          </div>
          <div className="flex gap-8 text-sm text-text-secondary">
            <a
              href="#"
              className="hover:text-text-primary transition-colors duration-200"
            >
              About
            </a>
            <a
              href="#"
              className="hover:text-text-primary transition-colors duration-200"
            >
              Privacy
            </a>
            <a
              href="#"
              className="hover:text-text-primary transition-colors duration-200"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
