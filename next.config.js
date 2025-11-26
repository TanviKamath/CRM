/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push("knex", "oracledb");
    return config;
  },
};

module.exports = nextConfig;
