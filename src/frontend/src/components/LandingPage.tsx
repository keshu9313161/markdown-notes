import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { ArrowRight, Loader2, PenLine } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export const LandingPage = () => {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="h-dvh overflow-hidden bg-landing relative flex flex-col items-center justify-center px-6 animate-page-fade-in">
      {/* Top bar */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center gap-2">
        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
          <PenLine className="w-3 h-3 text-primary-foreground" />
        </div>
        <span className="font-display font-extrabold text-foreground text-lg tracking-tight">
          StoryMesh
        </span>
      </div>
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30">
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-3xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 rounded px-4 py-2 mb-8 sm:mb-10 bg-landing-highlight">
          <span className="font-mono text-xs text-foreground/70 leading-tight">
            a writing tool for connected thinkers
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold text-foreground text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1] tracking-tight">
          Your ideas deserve <br className="hidden sm:block" />
          to be{" "}
          <mark className="!bg-landing-highlight text-foreground rounded px-1">
            connected.
          </mark>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto text-center mt-6 sm:mt-10 leading-relaxed">
          A beautiful space to write, link your ideas together, and see how they
          all connect.
        </p>

        {/* CTA Button */}
        <div className="mt-8 sm:mt-10">
          <button
            type="button"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-primary-foreground rounded font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign in with Internet Identity
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-4 sm:bottom-6 text-center text-muted-foreground text-sm z-10">
        &copy; 2026. Built with &hearts; using{" "}
        <a
          href="https://caffeine.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
};
