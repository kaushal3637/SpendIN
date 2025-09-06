export const DOMAIN_URL =
  process.env.NODE_ENV == "development"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_URL
    : process.env.NEXT_PUBLIC_PRODUCTION_URL;

export const MONGODB_URI =
  process.env.NODE_ENV == "development"
    ? process.env.DEVELOPMENT_MONGODB_URI
    : process.env.PRODUCTION_MONGODB_URI;
