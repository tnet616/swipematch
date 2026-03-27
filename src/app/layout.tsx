import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Provider } from "@/components/ui/provider";

const neueMontreal = localFont({
  src: [
    {
      path: "./fonts/NeueMontreal-Light.woff2", // Your 100 weight file
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/NeueMontreal-Medium.woff2", // Your 200 weight file
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/NeueMontreal-Regular.woff2", // Your 400 weight file
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/NeueMontreal-Medium.woff2", // Your 200 weight file
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/NeueMontreal-Bold.woff2", // Your 700 weight file
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-neue-montreal",
  display: "swap",
});

export const metadata = {
  title: "Campus Swipematch",
  description: "Who is the finest on campus?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${neueMontreal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Provider children={children}/>
      </body>
    </html>
  );
}
