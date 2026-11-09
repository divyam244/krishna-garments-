import Hero from "@/components/hero";
import TrustBar from "@/components/sections/TrustBar";
import NewArrivals from "@/components/sections/NewArrivals";
import SeasonalCollection from "@/components/sections/SeasonalCollection";
import CategoryGrid from "@/components/sections/CategoryGrid";
import PromoBanners from "@/components/sections/PromoBanners";
import AboutStory from "@/components/sections/AboutStory";
import WholesaleStrip from "@/components/sections/WholesaleStrip";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <NewArrivals />
      <SeasonalCollection />
      <CategoryGrid />
      <PromoBanners />
      <AboutStory />
      <WholesaleStrip />
    </>
  );
}
