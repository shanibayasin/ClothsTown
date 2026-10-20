import Hero from "../components/home/Hero";
import Categories from "../components/home/Categories";
import FeaturedProducts from "../components/home/FeaturedProducts";
import NewArrivals from "../components/home/NewArrivals";
import CollectionBanner from "../components/home/CollectionBanner";

export default function Home() {
  return (
    <>
      <Hero />

      <Categories />

      <FeaturedProducts />

      <NewArrivals />

      <CollectionBanner />
    </>
  );
}