import { Inter, Fredoka } from "next/font/google";
import "./globals.css";

// Inter for body text, Fredoka for playful headings and amounts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fredoka",
});

export const metadata = {
  title: "Remitips - Compare Money Transfer Rates",
  description: "Find the best exchange rates and lowest fees for international money transfers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fredoka.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
