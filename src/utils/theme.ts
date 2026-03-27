import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        primary: {
          50: { value: "rgba(255, 205, 223, 1)" },
          100: { value: "rgba(255, 191, 214, 1)" },
          200: { value: "rgba(255, 162, 196, 1)" },
          300: { value: "rgba(255, 134, 177, 1)" },
          400: { value: "rgba(255, 105, 159, 1)" },
          500: { value: "rgba(255, 77, 141, 1)" },
          600: { value: "rgba(214, 65, 118, 1)" },
          700: { value: "rgba(173, 52, 96, 1)" },
          800: { value: "rgba(133, 40, 73, 1)" },
          900: { value: "rgba(92, 28, 51, 1)" },
        },
        dark: { value: "rgba(0, 0, 0, 1)" },
        grey: { value: "rgba(252, 252, 252, 1)" },
        white: { value: "rgba(255, 255, 255, 1)" },
      },
      fonts: {
        heading: { value: "var(--font-neue-montreal), Helvetica, sans-serif" },
        body: { value: "var(--font-neue-montreal), Helvetica, sans-serif" },
      },
    },
    textStyles: {
      // Displays
      "large-display": {
        value: {
          fontSize: "82px",
          lineHeight: "88px",
          fontWeight: "400",
          fontFamily: "$body",
        },
      },
      "medium-display": {
        value: {
          fontSize: "66px",
          lineHeight: "72px",
          fontWeight: "400",
          fontFamily: "$body",
        },
      },
      "small-display": {
        value: {
          fontSize: "52px",
          lineHeight: "56px",
          fontWeight: "400",
          fontFamily: "$body",
        },
      },

      // Headings
      "large-heading": {
        value: {
          fontSize: "42px",
          lineHeight: "48px",
          fontWeight: "400",
          fontFamily: "$heading",
        },
      },
      "medium-heading": {
        value: {
          fontSize: "34px",
          lineHeight: "40px",
          fontWeight: "400",
          fontFamily: "$heading",
        },
      },
      "small-heading": {
        value: {
          fontSize: "26px",
          lineHeight: "32px",
          fontWeight: "400",
          fontFamily: "$heading",
        },
      },

      // Titles
      "large-title": {
        value: {
          fontSize: "22px",
          lineHeight: "28px",
          fontWeight: "400",
          fontFamily: "$heading",
        },
      },
      "medium-title": {
        value: {
          fontSize: "16px",
          lineHeight: "24px",
          fontWeight: "400",
          fontFamily: "$heading",
        },
      },
      "small-title": {
        value: {
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: "400",
          fontFamily: "$heading",
        },
      },

      // Body (Regular & Bold)
      "large-body": {
        value: {
          fontSize: "16px",
          lineHeight: "24px",
          fontWeight: "400",
          fontFamily: "$body",
        },
      },
      "large-body-bold": {
        value: {
          fontSize: "16px",
          lineHeight: "24px",
          fontWeight: "700",
          fontFamily: "$body",
        },
      },
      "medium-body": {
        value: {
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: "400",
          fontFamily: "$body",
        },
      },
      "medium-body-bold": {
        value: {
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: "700",
          fontFamily: "$body",
        },
      },
      "small-body": {
        value: {
          fontSize: "8px",
          lineHeight: "12px",
          fontWeight: "400",
          fontFamily: "$body",
        },
      },
      "small-body-bold": {
        value: {
          fontSize: "8px",
          lineHeight: "12px",
          fontWeight: "700",
          fontFamily: "$body",
        },
      },

      // Utilities
      "large-button": {
        value: {
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: "400",
          fontFamily: "$body",
        },
      },
      "small-button": {
        value: {
          fontSize: "10px",
          lineHeight: "16px",
          fontWeight: "400",
          fontFamily: "$body",
        },
      },
      link: {
        value: {
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: "400",
          fontFamily: "$body",
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
