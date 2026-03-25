'use client';

import { Button, Dialog, Text, VStack, Icon, Box } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { FaGraduationCap } from 'react-icons/fa'; 
import { supabase } from '../utils/supabase';

// Notice we removed the onClose prop. It is now a permanent hard wall once triggered.
interface WallDialogProps {
  showWall: boolean;
}

export const WallDialog = ({ showWall }: WallDialogProps) => {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });
    if (error) console.error("Auth error:", error.message);
  };

  return (
    <Dialog.Root
      open={showWall}
      closeOnInteractOutside={false} 
      closeOnEscape={false}          
    >
      <Dialog.Backdrop backdropFilter="blur(10px)" bg="blackAlpha.700" />
      
      {/* Aligning to flex-end makes it look like a sleek native bottom sheet */}
      <Dialog.Positioner alignItems="flex-end" pb={6}> 
        <Dialog.Content 
          p={8} 
          textAlign="center" 
          borderRadius="3xl" 
          mx={4} 
          bg="white" 
          boxShadow="2xl"
          w="calc(100vw - 32px)"
          maxW="md"
        >
          <VStack gap={6}>
            <Box bg="pink.50" p={4} borderRadius="full">
              <Icon as={FaGraduationCap} boxSize={8} color="pink.400" />
            </Box>

            <VStack gap={2}>
              <Text fontSize="2xl" fontWeight="black" color="gray.900">
                Join the Campus Ranking
              </Text>
              <Text color="gray.500" fontWeight="medium" fontSize="md" lineHeight="1.6">
                Log in with your official school email to verify your student status.
                <br />
                <Text as="span" fontWeight="bold" color="pink.500">@student.funaab.edu.ng</Text>
              </Text>
            </VStack>

            <Button
              w="100%" h="14" borderRadius="xl" border="1px solid" borderColor="gray.200"
              bg="white" color="gray.800" fontWeight="bold" fontSize="md" boxShadow="sm" mt={4}
              _hover={{ bg: 'gray.50', transform: 'scale(0.98)' }} transition="all 0.2s"
              onClick={handleGoogleLogin}
            >
              <FcGoogle size={24} style={{ marginRight: '10px' }} />
              Continue with Google
            </Button>
            
          </VStack>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};