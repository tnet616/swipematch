'use client';

import { useState } from 'react';
import { Box, Flex, Text, VStack, Button, Input, NativeSelect } from '@chakra-ui/react';
import { supabase } from '../../utils/supabase'; // Adjust path if needed
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!nickname || !gender) {
      setErrorMessage("Please fill out both fields.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) throw new Error("No user found. Please log in again.");

      // THE FUNAAB DOMAIN CHECK
      if (!user.email?.endsWith('@student.funaab.edu.ng')) {
        // Sign them out immediately so they aren't stuck in a ghost state
        await supabase.auth.signOut();
        throw new Error("Omo, this is exclusive to FUNAAB students! Please use your student.funaab.edu.ng email.");
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: user.id, 
            name: nickname,
            gender: gender,
            photo_url: user.user_metadata.avatar_url, 
            elo_score: 1200, 
            fire_count: 15,
            is_approved: true, 
          }
        ]);

      if (insertError) throw insertError;

      localStorage.removeItem('guestSwipeCount');
      localStorage.removeItem('guestPendingVotes');

      router.push('/');

    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex h="100dvh" w="100vw" bg="white" justify="center" pt={20} px={6}>
      <VStack w="100%" maxW="md" gap={8}>
        
        <Box textAlign="center">
          <Text fontSize="3xl" fontWeight="900" color="gray.900">Join the Ranking</Text>
          <Text color="gray.500" mt={2} fontSize="sm">
            Set up your profile to continue swiping and see where you stand on campus.
          </Text>
        </Box>

        {/* Error Message Display */}
        {errorMessage && (
          <Box w="100%" p={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
            <Text color="red.600" fontSize="sm" textAlign="center" fontWeight="bold">
              {errorMessage}
            </Text>
          </Box>
        )}

        <VStack w="100%" gap={5}>
          {/* Nickname Input */}
          <Box w="100%">
            <Text fontSize="sm" fontWeight="bold" mb={2} color="gray.700">Your Nickname</Text>
            <Input 
              placeholder="e.g., Alex" 
              size="lg" 
              bg="gray.50" 
              borderColor="gray.200"
              borderRadius="xl"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </Box>

          {/* Gender Selector (Using Chakra v3 NativeSelect) */}
          <Box w="100%">
            <Text fontSize="sm" fontWeight="bold" mb={2} color="gray.700">Gender</Text>
            <NativeSelect.Root>
              <NativeSelect.Field
                placeholder="Select option"
                value={gender}
                onChange={(e) => setGender(e.currentTarget.value)}
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="xl"
                h="12"
                px={4}
                fontSize="md"
                color="gray.800"
                _focus={{ borderColor: "pink.400", outline: "none" }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>
        </VStack>

        <Button
          w="100%"
          h="14"
          borderRadius="xl"
          bgGradient="to-r"
          gradientFrom="pink.400"
          gradientTo="orange.400"
          color="white"
          fontSize="lg"
          fontWeight="bold"
          loading={isSubmitting}
          loadingText="Saving..."
          disabled={!nickname || !gender || isSubmitting}
          mt={4}
          onClick={handleSubmit}
        >
          Submit Profile
        </Button>

      </VStack>
    </Flex>
  );
}