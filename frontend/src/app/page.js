import ExchangeRateComparison from "../components/ExchangeRateComparison";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-light-cream">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <ExchangeRateComparison />
      </main>
      <Footer />
    </div>
  );
}
