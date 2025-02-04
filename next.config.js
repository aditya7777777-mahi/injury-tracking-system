
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/report/:id',
        destination: '/report/[id]',
      },
    ];
  },
};

module.exports = nextConfig;