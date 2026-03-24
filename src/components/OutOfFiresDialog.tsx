'use client';

import { Button, Dialog, Text, VStack, HStack, Icon } from '@chakra-ui/react';
import { FaPlay, FaPoll, FaClock } from 'react-icons/fa';

interface OutOfFiresDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onWatchAd: () => void;
}

export const OutOfFiresDialog = ({ isOpen, onClose, onWatchAd }: OutOfFiresDialogProps) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop backdropFilter="blur(8px)" bg="blackAlpha.600" />
      <Dialog.Positioner>
        <Dialog.Content 
          p={6} textAlign="center" borderRadius="3xl" mx={4} bg="white" w="calc(100vw - 32px)" maxW="sm"
        >
          <Dialog.Header pt={2}>
            <Dialog.Title fontSize="2xl" fontWeight="900" color="gray.900">
              Out of 🔥
            </Dialog.Title>
          </Dialog.Header>
          
          <Dialog.Body pb={2}>
            <Text mb={6} color="gray.500" fontWeight="medium" fontSize="sm">
              You've used all your Fires! Refill your stash to keep boosting your favorites.
            </Text>

            <VStack gap={3} w="100%">
              {/* Option 1: Watch an Ad (High Conversion) */}
              <Button
                w="100%" h="14" borderRadius="xl" bg="gray.900" color="white"
                _hover={{ bg: "gray.800", transform: 'scale(0.98)' }}
                onClick={onWatchAd}
              >
                <Icon as={FaPlay} color="pink.400" mr={3} />
                Watch Ad (+5 🔥)
              </Button>

              {/* Option 2: Take a Survey (Data Harvesting) */}
              <Button
                w="100%" h="14" borderRadius="xl" bg="gray.100" color="gray.800"
                _hover={{ bg: "gray.200", transform: 'scale(0.98)' }}
                onClick={() => console.log("Route to Campus Survey")}
              >
                <Icon as={FaPoll} color="blue.400" mr={3} />
                Take Campus Poll (+10 🔥)
              </Button>

              {/* Option 3: Wait it out */}
              <HStack mt={4} color="gray.400" fontSize="xs" fontWeight="bold" justify="center">
                <Icon as={FaClock} />
                <Text>Free refill in 4h 12m</Text>
              </HStack>
            </VStack>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};