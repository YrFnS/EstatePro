import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 start-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 end-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          {/* House with question mark illustration */}
          <div className="relative inline-flex items-center justify-center">
            {/* Background circle */}
            <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center">
              {/* House icon */}
              <div className="relative">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  fill="none"
                  className="text-primary/30"
                >
                  <path
                    d="M10 32L40 8L70 32V68C70 70.2 68.2 72 66 72H14C11.8 72 10 70.2 10 68V32Z"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M30 72V44H50V72"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {/* Question mark overlay */}
                <div className="absolute -top-2 -end-4 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
                  ?
                </div>
              </div>
            </div>
            {/* Decorative floating dots */}
            <div className="absolute top-2 end-0 w-3 h-3 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: "0.5s" }} />
            <div className="absolute bottom-4 start-2 w-2 h-2 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: "1s" }} />
            <div className="absolute top-8 start-0 w-2 h-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: "1.5s" }} />
          </div>
        </div>

        {/* 404 Number */}
        <div className="mb-4">
          <h1 className="text-8xl font-extrabold tracking-tighter">
            <span className="gradient-text">404</span>
          </h1>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-3">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
          The property or page you&apos;re looking for doesn&apos;t exist or may have been moved. Let us help you find your way back home.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2 min-w-[160px]">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 min-w-[160px]">
            <Link href="/properties">
              <Search className="h-4 w-4" />
              Browse Properties
            </Link>
          </Button>
        </div>

        {/* Decorative line */}
        <div className="mt-12 mx-auto decorative-line" />
      </div>
    </div>
  );
}
