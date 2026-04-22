import { EB_Garamond } from "next/font/google";
import localFont from "next/font/local";

// TODO: Replace EB Garamond with Adobe Garamond Pro (local font)
// When swapping, change this to localFont({ src: "..." }) — the variable stays the same
export const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  display: "swap",
});

export const helveticaNeue = localFont({
  src: [
    {
      path: "../assets/fonts/HelveticaNeue-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../assets/fonts/HelveticaNeue-Medium.otf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-helvetica-neue",
});

export const posterman = localFont({
  src: "../assets/fonts/Posterman-Regular.otf",
  variable: "--font-posterman",
});
