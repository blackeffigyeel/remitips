import Image from "next/image";
import { TrendingUp, ShieldCheck, Clock, Github } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <a href="/">
            <Image
              src="/remitips-black-on-white-logo.png"
              alt="Remitips"
              width={180}
              height={40}
              className="h-8 w-auto"
            />
            </a>
          </div>

          {/* Features */}
          <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Best Rates</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Real-time</span>
            </div>
            {/* GitHub link */}
            <a
              href="https://github.com/blackeffigyeel/remitips"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-primary transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
