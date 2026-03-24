"use client";

import { Button, Dialog, Text } from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import {supabase} from "@/utils/supabase"; 

interface WallDialogProps {
  showWall: boolean;
}

export const WallDialog = ({ showWall }: WallDialogProps) => {
  return (
    <Dialog.Root
      open={showWall}
      // These prevent the user from dismissing the wall to keep swiping
      closeOnInteractOutside={false}
      closeOnEscape={false}
    >
      {/* The blurred background overlay */}
      <Dialog.Backdrop backdropFilter="blur(8px)" bg="blackAlpha.600" />

      {/* Positioner is required in v3 to center the content */}
      <Dialog.Positioner>
        <Dialog.Content
          p={6}
          textAlign="center"
          borderRadius="3xl"
          mx={4}
          bg="white"
          boxShadow="2xl"
          w="calc(100vw - 32px)"
          maxW="sm"
        >
          <Dialog.Header pt={4}>
            <Dialog.Title fontSize="2xl" fontWeight="900" color="gray.900">
              Want to keep swiping? 🔥
            </Dialog.Title>
          </Dialog.Header>

          <Dialog.Body pb={6}>
            <Text mb={8} color="gray.500" fontWeight="medium" fontSize="sm">
              You've hit the limit for guest swiping. Join to see the live
              campus rankings and continue voting.
            </Text>

            {/* Chakra v3 Gradient Syntax */}
            <Button
              // ... your existing styling props ...
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    // After Google approves, send them to our onboarding screen
                    redirectTo: `${window.location.origin}/onboarding`,
                  },
                });
                if (error) console.error("Auth error:", error.message);
              }}
            >
              <FcGoogle
                size={24}
                style={{
                  marginRight: "10px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  padding: "2px",
                }}
              />
              Continue with Google
            </Button>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
