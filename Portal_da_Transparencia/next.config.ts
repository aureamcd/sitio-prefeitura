import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  async redirects() {
    return [
      {
        source: "/ESIC",
        destination: "https://padremarcos.pi.gov.br/esic",
        permanent: false,
      },
      {
        source: "/ESIC/consultar",
        destination: "https://padremarcos.pi.gov.br/esic/consultar",
        permanent: false,
      },
      {
        source: "/LAI",
        destination: "/acesso-informacao",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
