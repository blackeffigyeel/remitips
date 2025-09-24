import { Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4">
          <div className="font-display text-xl font-bold">Remitips</div>
          <p className="text-white/80 max-w-md mx-auto">
            Compare money transfer rates and save on international transfers
          </p>
          <div className="text-sm text-white/60">&copy; {new Date().getFullYear()} Remitips. All rights reserved.</div>
          <a
            href="https://github.com/blackeffigyeel/remitips"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 hover:text-white transition-colors"
          >
            <Github className="h-5 w-5" />
            <span className="text-sm font-medium">View on GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
