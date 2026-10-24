import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/shop/men/footwear", destination: "/shop/accessories/footwear", statusCode: 301 },
      { source: "/shop/men/mens-accessories", destination: "/shop/accessories/watches-belts-caps", statusCode: 301 },
      { source: "/shop/men/men-s-accessories", destination: "/shop/accessories/watches-belts-caps", statusCode: 301 },
      { source: "/shop/men/perfumes-fragrances", destination: "/shop/accessories/perfumes-fragrances", statusCode: 301 },
      { source: "/shop/men/traditional-essentials", destination: "/shop/men/shalwar-kameez", statusCode: 301 },
      { source: "/shop/men/unstitched-fabric", destination: "/shop/men/mens-unstitched-fabric", statusCode: 301 },
      { source: "/shop/men/winter-wear", destination: "/shop/men/mens-winter-wear", statusCode: 301 },
      { source: "/shop/women/winter-wear", destination: "/shop/women/womens-winter-wear", statusCode: 301 },
      { source: "/shop/women/dupattas", destination: "/shop/women/dupattas-stoles", statusCode: 301 },
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