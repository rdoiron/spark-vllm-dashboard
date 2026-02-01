/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    turbo: {
      resolveAlias: {
        "@/*": ["./src/*"]
      }
    }
  }
}

export default nextConfig