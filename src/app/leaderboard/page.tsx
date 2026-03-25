"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Icon,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { FaFire, FaTrophy, FaRegHandPointer, FaCrown, FaUser } from "react-icons/fa";
import { FiHome, FiUser } from "react-icons/fi";
import { supabase } from "../../utils/supabase";
import { useRouter } from "next/navigation";
import { WallDialog } from "@/components/WallDialog"; // <-- Imported the Wall!

export default function LeaderboardPage() {
  const [activeGender, setActiveGender] = useState<"Girls" | "Boys">("Girls");
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track if we should hide the Join button
  const [showAuthWall, setShowAuthWall] = useState(false); // Control the profile wall

  const router = useRouter();

  // Add this new state at the top with your other states:
  const [isSpectator, setIsSpectator] = useState(false);

  // 1. Update the floating button logic
  const handleJoinRanking = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // If they are logged in (Spectator), send them to Profile to flip the switch
      router.push('/profile'); 
    } else {
      // If they are a guest, hit them with the wall
      setShowAuthWall(true);
    }
  };

  // 2. Update the useEffect to check for Spectator status
  useEffect(() => {
    const fetchLeaderboardAndUser = async () => {
      setIsLoading(true);

      // 1. Check User & Spectator Status
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsLoggedIn(true);
        const { data: userData } = await supabase
          .from("users")
          .select("elo_score")
          .eq("id", user.id)
          .single();

        // FIX: Safely cast to Number and explicitly set true OR false
        if (userData && Number(userData.elo_score) === 0) {
          setIsSpectator(true);
        } else {
          setIsSpectator(false); // Ensures state resets if they join ranking!
        }
      } else {
        setIsLoggedIn(false);
        setIsSpectator(false); // Ensure guests are clean
      }

      // 2. Fetch Leaderboard Data
      const genderFilter = activeGender === "Girls" ? "Female" : "Male";

      const { data, error } = await supabase
        .from("users")
        .select("id, name, photo_url, elo_score")
        .eq("gender", genderFilter)
        .order("elo_score", { ascending: false })
        .limit(50);

      if (data) {
        setLeaders(data);
      }
      setIsLoading(false);
    };

    fetchLeaderboardAndUser();
  }, [activeGender]);

  // 3. Update the floating button condition near the bottom of your JSX:
  {/* ONLY SHOWS FOR GUESTS OR SPECTATORS */}
  {(isSpectator || !isLoggedIn) && (
    <Box position="absolute" bottom="85px" left="0" w="100%" px={6}>
      <Button
        w="100%" h="16" borderRadius="xl" fontSize="xl" fontWeight="bold" color="white"
        bgGradient="to-r" gradientFrom="orange.400" gradientTo="orange.500"
        boxShadow="0px 10px 20px rgba(221, 107, 32, 0.3)"
        _hover={{ opacity: 0.9, transform: "scale(0.98)" }}
        transition="all 0.2s"
        onClick={handleJoinRanking}
      >
        Join the Ranking 😎
      </Button>
    </Box>
  )}

  // 2. Smart Profile Click (Triggers the Wall for Guests)
  const handleProfileClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push('/profile');
    } else {
      setShowAuthWall(true);
    }
  };

  useEffect(() => {
    const fetchLeaderboardAndUser = async () => {
      setIsLoading(true);

      // Check user status to conditionally render the "Join Ranking" button
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setIsLoggedIn(true);

      const genderFilter = activeGender === "Girls" ? "Female" : "Male";

      // Fetch Top 50 users based on their Elo Score
      const { data, error } = await supabase
        .from("users")
        .select("id, name, photo_url, elo_score")
        .eq("gender", genderFilter)
        .order("elo_score", { ascending: false })
        .limit(50);

      if (data) {
        setLeaders(data);
      }
      setIsLoading(false);
    };

    fetchLeaderboardAndUser();
  }, [activeGender]);

  return (
    <Flex h="100dvh" w="100vw" bg="gray.50" direction="column" align="center">
      <Flex w="100%" maxW="md" h="100%" direction="column" bg="white" position="relative">
        
        {/* 1. Header with Logo & Profile Icon */}
        <Flex w="100%" justify="space-between" align="center" px={4} pt={10} pb={4}>
          <HStack cursor="pointer" onClick={() => router.push('/')}>
            <Icon as={FaRegHandPointer} color="pink.400" boxSize={5} />
            <Text fontSize="lg" fontWeight="bold" color="pink.400">
              Swipematch
            </Text>
          </HStack>
          <Flex 
            justify="center" align="center" w="10" h="10" 
            borderRadius="lg" border="1px solid" borderColor="gray.200"
            cursor="pointer" onClick={handleProfileClick} // <-- Smart redirect here
          >
            <Icon as={FaUser} color="gray.600" />
          </Flex>
        </Flex>

        {/* 2. Title & Gender Toggle Row */}
        <Flex w="100%" justify="space-between" align="center" px={4} pb={4}>
          <Text fontSize="2xl" fontWeight="900" color="black">
            Leaderboard
          </Text>

          {/* Segmented Control */}
          <Flex bg="white" border="1px solid" borderColor="gray.200" borderRadius="full" p={1} w="160px">
            <Flex
              flex={1} py={1} justify="center" align="center" borderRadius="full" cursor="pointer"
              bg={activeGender === "Girls" ? "pink.400" : "transparent"}
              color={activeGender === "Girls" ? "white" : "gray.500"}
              onClick={() => setActiveGender("Girls")}
            >
              <Text fontWeight="bold" fontSize="xs">Girls 👩🏼</Text>
            </Flex>
            <Flex
              flex={1} py={1} justify="center" align="center" borderRadius="full" cursor="pointer"
              bg={activeGender === "Boys" ? "transparent" : "transparent"}
              color={activeGender === "Boys" ? "gray.800" : "gray.500"}
              onClick={() => setActiveGender("Boys")}
            >
              <Text fontWeight="bold" fontSize="xs">Boys 👦🏾</Text>
            </Flex>
          </Flex>
        </Flex>

        {/* 3. The Scrollable Leaderboard List */}
        <Box flex={1} overflowY="auto" px={4} pb={32} css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
          {isLoading ? (
            <Flex justify="center" pt={10}>
              <Spinner color="pink.400" />
            </Flex>
          ) : (
            leaders.map((user, index) => {
              const isFirst = index === 0;
              const safeImageSrc = (user.photo_url && user.photo_url.trim() !== '') 
                ? user.photo_url 
                : 'https://images.unsplash.com/photo-1531123897727-8f129e1bfca8?w=500&q=80';
              
              return (
                <Flex
                  key={user.id}
                  bg="white"
                  p={3}
                  borderRadius="2xl"
                  boxShadow="0px 4px 12px rgba(0,0,0,0.05)"
                  align="center"
                  justify="space-between"
                  mb={4}
                  border={isFirst ? "2px solid" : "1px solid"}
                  borderColor={isFirst ? "pink.400" : "transparent"}
                >
                  <HStack gap={4}>
                    <Text fontSize="2xl" fontWeight="900" color={isFirst ? "pink.400" : "gray.800"} w="30px" textAlign="center">
                      {index + 1}
                    </Text>

                    {/* Bulletproof Avatar Image */}
                    <Box position="relative" w="50px" h="50px" borderRadius="xl" overflow="hidden">
                      <img 
                        src={safeImageSrc} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        alt={user.name}
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1531123897727-8f129e1bfca8?w=500&q=80'; }}
                      />
                      {isFirst && (
                        <Icon 
                          as={FaCrown} color="yellow.400" position="absolute" top="-10px" left="-8px" 
                          boxSize={7} transform="rotate(-20deg)" style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.3))" }}
                        />
                      )}
                    </Box>

                    <Text fontWeight="bold" fontSize="lg" color="gray.900">
                      {user.name}
                    </Text>
                  </HStack>

                  <HStack gap={1}>
                    <Icon as={FaFire} color="orange.500" />
                    <Text fontWeight="900" color="gray.800">{Math.round(user.elo_score)}</Text>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold">swipes</Text>
                  </HStack>
                </Flex>
              );
            })
          )}
        </Box>

        {/* 4. Floating "Join Ranking" Button (ONLY SHOWS FOR GUESTS) */}
        {!isLoggedIn && (
          <Box position="absolute" bottom="85px" left="0" w="100%" px={6}>
            <Button
              w="100%" h="16" borderRadius="xl" fontSize="xl" fontWeight="bold" color="white"
              bgGradient="to-r" gradientFrom="orange.400" gradientTo="orange.500"
              boxShadow="0px 10px 20px rgba(221, 107, 32, 0.3)"
              _hover={{ opacity: 0.9, transform: "scale(0.98)" }}
              transition="all 0.2s"
              onClick={handleJoinRanking}
            >
              Join the Ranking 😎
            </Button>
          </Box>
        )}

        {/* 5. Bottom Navigation */}
        <Flex w="100%" h="70px" bg="white" justify="space-around" align="center" borderTop="1px solid" borderColor="gray.100" position="absolute" bottom="0" zIndex={10}>
          <VStack gap={1} color="gray.400" cursor="pointer" onClick={() => router.push('/')}>
            <Icon as={FiHome} boxSize={6} />
            <Text fontSize="10px" fontWeight="bold">Home</Text>
          </VStack>
          <VStack gap={1} color="pink.400" cursor="pointer">
            <Icon as={FaTrophy} boxSize={6} />
            <Text fontSize="10px" fontWeight="bold">Live Ranking</Text>
          </VStack>
          <VStack gap={1} color="gray.400" cursor="pointer" onClick={handleProfileClick}> {/* <-- Smart redirect here */}
            <Icon as={FiUser} boxSize={6} />
            <Text fontSize="10px" fontWeight="bold">Profile</Text>
          </VStack>
        </Flex>

        {/* 6. The Auth Wall Dialog for Guests */}
        <WallDialog showWall={showAuthWall} />

      </Flex>
    </Flex>
  );
}