"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";
import { system } from "@/utils/theme";

export function Provider({
  children,
  ...props
}: ColorModeProviderProps & { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props}>{children}</ColorModeProvider>
    </ChakraProvider>
  )
}





// export function Provider({ children, ...props }: ColorModeProviderProps & { children: React.ReactNode }) {
//   return (
//     <ChakraProvider value={system}>
//       <ColorModeProvider {...props}>{children}</ColorModeProvider>
//     </ChakraProvider>
//   );
// }
