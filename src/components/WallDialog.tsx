"use client";

import { useState } from "react"; // 1. Import useState
import { Button, Text, VStack, Drawer, Portal } from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "../utils/supabase";

interface WallDialogProps {
  showWall: boolean;
}

export const WallDialog = ({ showWall }: WallDialogProps) => {
  // 2. Add loading state
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true); // 3. Set loading to true when clicked

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) {
      console.error("Auth error:", error.message);
      setIsLoading(false); // 4. Only stop loading if there is an error
    }
  };

  return (
    <Drawer.Root
      open={showWall}
      placement="bottom"
      closeOnInteractOutside={false}
      closeOnEscape={false}
    >
      <Portal>
        <Drawer.Backdrop backdropFilter="blur(10px)" bg="blackAlpha.700" />
        <Drawer.Positioner>
          <Drawer.Content
            textAlign="center"
            borderTopRadius="3xl"
            bg="white"
            w="100%"
            maxW="md"
            px="20px"
            py="50px"
          >
            <VStack align="center" gap={"40px"}>
              <VStack textAlign="center" gap="10px">
                <Text
                  color="dark"
                  fontFamily="heading"
                  fontSize="23px"
                  fontWeight="700"
                >
                  Want to keep swiping?
                </Text>
                <Text color="dark" fontFamily="body" fontSize="16px">
                  Log in with your official school email to verify your student
                  status.
                  <br />
                  <Text as="span" fontWeight="500" color="primary.500">
                    @student.funaab.edu.ng
                  </Text>
                </Text>
              </VStack>

              <Button
                w="100%"
                h="60px"
                borderRadius="12px"
                border="2px solid"
                borderColor="primary.900"
                bg="white"
                color="dark"
                fontWeight="500"
                fontSize="22px"
                _hover={{ bg: "grey", transform: "scale(0.98)" }}
                transition="all 0.2s"
                onClick={handleGoogleLogin}
                loading={isLoading} // 5. Pass the loading state to the Chakra Button
              >
                {!isLoading && <FcGoogle size={24} />}
                Continue with Google
              </Button>
            </VStack>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};
