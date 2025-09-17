import localFont from "next/font/local";

export const stableBold = localFont({
  // Path is relative to this file (lib/ is sibling to public/)
  src: "../public/bold.ttf",
  display: "swap",
  // Add these if you know the font specifics
  // weight: "700",
  // style: "normal",
});
