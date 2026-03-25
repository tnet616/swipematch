'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Flex, Text, VStack, Button, Input, NativeSelect, Image, Icon, Checkbox } from '@chakra-ui/react';
import { FaImage, FaCheckCircle, FaEye, FaExclamationTriangle } from 'react-icons/fa';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [isSpectator, setIsSpectator] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authError, setAuthError] = useState<string | null>(null); // NEW: Catches bad emails/redirects
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // THE INTERCEPTOR: Checks email BEFORE showing the form
  useEffect(() => {
    const checkExistingUser = async () => {
      // 1. Grab the user from the Google Redirect
      const { data: { user }, error: authErr } = await supabase.auth.getUser();

      if (authErr || !user) {
        setAuthError("Authentication failed or was cancelled. Please try again.");
        setIsCheckingUser(false);
        return;
      }

      // 2. THE FUNAAB LOCKDOWN
      if (user.email && !user.email.endsWith('@student.funaab.edu.ng')) {
        await supabase.auth.signOut(); // Instantly wipe their invalid session
        setAuthError("Exclusive to FUNAAB! You must use your @student.funaab.edu.ng email to join the rankings.");
        setIsCheckingUser(false);
        return;
      }

      // 3. Check if they already have an active profile
      const { data } = await supabase.from('users').select('id').eq('id', user.id).single();
      if (data) {
        router.push('/'); // Send them straight to the deck!
        return;
      }
      
      // If they passed all checks and don't have a profile, let them see the form
      setIsCheckingUser(false);
    };
    checkExistingUser();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setIsSpectator(false); 
    }
  };

  const handleSubmit = async () => {
    if (!nickname || !gender) {
      setErrorMessage("Please fill out your name and gender.");
      return;
    }
    if (!isSpectator && !file) {
      setErrorMessage("Please upload a photo, or check 'Spectator Mode' below.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found. Please log in again.");

      let finalPhotoUrl = user.user_metadata.avatar_url; 
      
      if (file && !isSpectator) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, file);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(fileName);
          finalPhotoUrl = publicUrlData.publicUrl;
        }
      }

      const { error: insertError } = await supabase.from('users').upsert({
          id: user.id, 
          name: nickname,
          gender: gender,
          photo_url: isSpectator ? null : finalPhotoUrl, 
          elo_score: isSpectator ? 0 : 1200, 
          fire_count: 15,
          is_approved: true, 
      }, { onConflict: 'id' });

      if (insertError) throw insertError;

      localStorage.removeItem('guestSwipeCount');
      localStorage.removeItem('guestPendingVotes');
      
      setIsSuccess(true);

    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingUser) return <Flex h="100dvh" justify="center" align="center" bg="white">Loading...</Flex>;

  // ==========================================
  // VIEW 1: ERROR STATE (Invalid Email / Failed Auth)
  // ==========================================
  if (authError) {
    return (
      <Flex h="100dvh" w="100vw" bg="white" justify="center" align="center" px={6}>
        <VStack w="100%" maxW="md" gap={6} textAlign="center">
          <Box bg="red.50" p={5} borderRadius="full">
            <Icon as={FaExclamationTriangle} color="red.500" boxSize={12} />
          </Box>
          <VStack gap={2}>
            <Text fontSize="2xl" fontWeight="900" color="gray.900">Access Denied</Text>
            <Text color="gray.500" fontSize="sm" lineHeight="1.6" px={4}>{authError}</Text>
          </VStack>
          <Button
            w="100%" h="14" borderRadius="xl" bg="gray.900" color="white"
            fontWeight="bold" mt={4} _hover={{ opacity: 0.9 }}
            onClick={() => router.push('/')}
          >
            Go Back & Try Again
          </Button>
        </VStack>
      </Flex>
    );
  }

  // ==========================================
  // VIEW 2: SUCCESS STATE
  // ==========================================
  if (isSuccess) {
    return (
      <Flex h="100dvh" w="100vw" bg="white" justify="center" align="center" px={6}>
        <VStack w="100%" maxW="md" gap={8} textAlign="center">
          <Icon as={FaCheckCircle} color="pink.400" boxSize={20} />
          <VStack gap={2}>
            <Text fontSize="3xl" fontWeight="900" color="gray.900">You're in!</Text>
            <Text color="gray.500" fontSize="sm">
              {isSpectator ? "You are in Spectator Mode. Go vote!" : "Your profile will go live once approved."}
            </Text>
          </VStack>
          <Button
            w="100%" h="14" borderRadius="xl" bgGradient="to-r" gradientFrom="pink.400" gradientTo="pink.500"
            color="white" fontSize="lg" fontWeight="bold" mt={4} _hover={{ opacity: 0.9 }}
            onClick={() => router.push('/')}
          >
            Continue Swiping 🤩
          </Button>
        </VStack>
      </Flex>
    );
  }

  // ==========================================
  // VIEW 3: ONBOARDING FORM
  // ==========================================
  return (
    <Flex h="100dvh" w="100vw" bg="white" justify="center" pt={10} px={6} overflowY="auto">
      <VStack w="100%" maxW="md" gap={6} pb={10}>
        <Text fontSize="2xl" fontWeight="900" color="gray.900">Setup Profile</Text>

        {errorMessage && (
          <Box w="100%" p={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
            <Text color="red.600" fontSize="sm" textAlign="center" fontWeight="bold">{errorMessage}</Text>
          </Box>
        )}

        <Box 
          w="200px" h="200px" bg="gray.50" border="2px dashed" borderColor="gray.300" 
          borderRadius="2xl" overflow="hidden" position="relative" cursor={isSpectator ? "not-allowed" : "pointer"}
          onClick={() => !isSpectator && fileInputRef.current?.click()}
          opacity={isSpectator ? 0.5 : 1}
        >
          {previewUrl && !isSpectator ? (
            <Image src={previewUrl} alt="Preview" objectFit="cover" w="100%" h="100%" />
          ) : (
            <Flex w="100%" h="100%" direction="column" justify="center" align="center" color="gray.400">
              <Icon as={isSpectator ? FaEye : FaImage} boxSize={8} mb={2} />
              <Text fontSize="xs" fontWeight="bold">{isSpectator ? "Spectator Mode" : "Tap to upload photo"}</Text>
            </Flex>
          )}
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        </Box>

        <Flex w="100%" justify="center" align="center" gap={3} mt={-2} cursor="pointer" onClick={() => setIsSpectator(!isSpectator)}>
          <Box w="5" h="5" border="2px solid" borderColor={isSpectator ? "pink.400" : "gray.300"} borderRadius="md" bg={isSpectator ? "pink.400" : "transparent"} display="flex" alignItems="center" justifyContent="center">
            {isSpectator && <Icon as={FaCheckCircle} color="white" boxSize={3} />}
          </Box>
          <Text fontSize="sm" fontWeight="bold" color="gray.600">I just want to spectate/vote (No photo)</Text>
        </Flex>

        <VStack w="100%" gap={4} mt={2}>
          <Input placeholder="Your nickname" size="lg" bg="white" borderColor="gray.300" borderRadius="xl" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <NativeSelect.Root>
            <NativeSelect.Field placeholder="Gender" value={gender} onChange={(e) => setGender(e.currentTarget.value)} bg="white" borderColor="gray.300" borderRadius="xl" h="12" px={4}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </VStack>

        <Button w="100%" h="14" borderRadius="xl" bgGradient="to-r" gradientFrom="orange.400" gradientTo="orange.500" color="white" fontSize="lg" fontWeight="bold" mt={4} loading={isSubmitting} onClick={handleSubmit}>
          Save Profile
        </Button>
      </VStack>
    </Flex>
  );
}