import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/shop/men/footwear", destination: "/shop/accessories/footwear", statusCode: 301 },
      { source: "/shop/men/men-s-accessories", destination: "/shop/men/mens-accessories", statusCode: 301 },
      { source: "/shop/men/perfumes-fragrances", destination: "/shop/accessories/perfumes-fragrances", statusCode: 301 },
      { source: "/shop/men/accessories", destination: "/shop/men/mens-accessories", statusCode: 301 },
      { source: "/shop/women/winter-wear", destination: "/shop/women/winter-collection", statusCode: 301 },
      { source: "/shop/women/unstitched-fabric", destination: "/shop/women", statusCode: 301 },
      { source: "/shop/women/dupattas", destination: "/shop/women/dupattas-shawls", statusCode: 301 },
      { source: "/shop/women/formal-wedding-wear", destination: "/shop/women/womens-formal-wedding-wear", statusCode: 301 },
      { source: "/shop/womens", destination: "/shop/women", statusCode: 301 },
      { source: "/shop/new-arrivals", destination: "/new-arrivals", statusCode: 301 },
      { source: "/shop/summer-collection", destination: "/collections", statusCode: 301 },
      { source: "/shop/summer-wear", destination: "/collections", statusCode: 301 },
      { source: "/shop/winter-collection", destination: "/collections", statusCode: 301 },
      { source: "/shop/unstitched-fabric", destination: "/shop/women", statusCode: 301 },
      { source: "/category/men", destination: "/shop/men", statusCode: 301 },
      { source: "/category/women", destination: "/shop/women", statusCode: 301 },
      { source: "/category/womens", destination: "/shop/women", statusCode: 301 },
      { source: "/category/girls", destination: "/shop/girls", statusCode: 301 },
      { source: "/category/boys", destination: "/shop/boys", statusCode: 301 },
      { source: "/category/accessories", destination: "/shop/accessories", statusCode: 301 },
      { source: "/category/footwear", destination: "/shop/accessories/footwear", statusCode: 301 },
      { source: "/category/mens-accessories", destination: "/shop/men/mens-accessories", statusCode: 301 },
      { source: "/category/womens-accessories", destination: "/shop/women/womens-accessories", statusCode: 301 },
      { source: "/category/new-arrivals", destination: "/new-arrivals", statusCode: 301 },
      { source: "/category/summer-collection", destination: "/collections", statusCode: 301 },
      { source: "/category/summer-wear", destination: "/collections", statusCode: 301 },
      { source: "/category/traditional-essentials", destination: "/shop/men/traditional-essentials", statusCode: 301 },
      { source: "/category/unstitched-fabric", destination: "/shop/women", statusCode: 301 },
      { source: "/category/unstitched-lawn", destination: "/shop/women/unstitched-lawn", statusCode: 301 },
      { source: "/category/unstitched-khaddar", destination: "/shop/women/unstitched-khaddar", statusCode: 301 },
      { source: "/category/unstitched-cambric-cotton", destination: "/shop/women/unstitched-cambric-cotton", statusCode: 301 },
      { source: "/category/winter-wear", destination: "/shop/men/winter-wear", statusCode: 301 },
      { source: "/category/winter-collection", destination: "/shop/women/winter-collection", statusCode: 301 },
      { source: "/category/stitched-suits", destination: "/shop/women/stitched-suits", statusCode: 301 },
      { source: "/category/kurtis-tops", destination: "/shop/women/kurtis-tops", statusCode: 301 },
      { source: "/category/two-piece-three-piece-suits", destination: "/shop/women/two-piece-three-piece-suits", statusCode: 301 },
      { source: "/category/womens-formal-wedding-wear", destination: "/shop/women/womens-formal-wedding-wear", statusCode: 301 },
      { source: "/category/dupattas-shawls", destination: "/shop/women/dupattas-shawls", statusCode: 301 },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;