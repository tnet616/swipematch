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
import {
  FaFire,
  FaTrophy,
  FaRegHandPointer,
  FaCrown,
  FaUser,
} from "react-icons/fa";
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // If they are logged in (Spectator), send them to Profile to flip the switch
      router.push("/profile");
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
  {
    /* ONLY SHOWS FOR GUESTS OR SPECTATORS */
  }
  {
    (isSpectator || !isLoggedIn) && (
      <Box position="absolute" bottom="85px" left="0" w="100%" h="70px" borderRadius="12px" px={6} borderColor="#D97C2B">
        <Button
          w="100%"
          h="16"
          borderRadius="xl"
          fontSize="xl"
          fontWeight="bold"
          color="white"
          bgGradient="to-r"
          gradientFrom="orange.400"
          gradientTo="orange.500"
          boxShadow="0px 10px 20px rgba(221, 107, 32, 0.3)"
          _hover={{ opacity: 0.9, transform: "scale(0.98)" }}
          transition="all 0.2s"
          onClick={handleJoinRanking}
        >
          Join the Ranking 😎
        </Button>
      </Box>
    );
  }

  // 2. Smart Profile Click (Triggers the Wall for Guests)
  const handleProfileClick = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      router.push("/profile");
    } else {
      setShowAuthWall(true);
    }
  };

  useEffect(() => {
    const fetchLeaderboardAndUser = async () => {
      setIsLoading(true);

      // Check user status to conditionally render the "Join Ranking" button
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      <Flex
        w="100%"
        maxW="md"
        h="100%"
        direction="column"
        bg="white"
        position="relative"
      >
        {/* 1. Header with Logo & Profile Icon */}
        <Flex
          w="100%"
          justify="space-between"
          align="center"
          px={4}
          pt={10}
          pb={4}
        >
          <HStack gap="8px" align="center">
            <Icon w="24px" h="24px">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M21.001 4.49905H15.001M21.001 4.49905C21.001 3.79909 19.0067 2.49134 18.501 2M21.001 4.49905C21.001 5.19901 19.0067 6.50675 18.501 6.9981"
                  stroke="#FF4D8D"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.8942 21.9884C16.8424 20.0751 16.9713 19.8448 17.1081 19.4191C17.2448 18.9935 18.2011 17.4587 18.5395 16.3621C19.6342 12.8141 18.6139 12.0595 17.2536 11.0534C15.7451 9.93759 12.8997 9.37252 11.4886 9.49486V3.74359C11.4886 2.78063 10.7077 2 9.74439 2C8.78106 2 8.00014 2.78063 8.00014 3.74359V14.0032L5.93997 11.8238C5.30035 11.1303 4.27243 11.06 3.5709 11.6908C2.90609 12.2886 2.80906 13.2953 3.34749 14.009L4.63984 15.722M4.63984 15.722C4.91814 16.0832 5.22966 16.4926 5.58372 16.973M4.63984 15.722L5.58372 16.973M4.63984 15.722C4.06847 14.9802 3.63715 14.4412 3.26531 13.9056M7.87078 22.0002L7.85125 20.9498C7.89419 19.7185 6.9982 18.9151 5.82962 17.3089C5.74542 17.1931 5.6635 17.0813 5.58372 16.973M5.58372 16.973L6.75315 18.5231"
                  stroke="#FF4D8D"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Icon>
            <Text
              fontSize="16px"
              color="primary.500"
              fontFamily="heading"
              fontWeight="500"
            >
              Swipematch
            </Text>
          </HStack>
          <Flex
            justify="center"
            align="center"
            w="10"
            h="10"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
            cursor="pointer"
            onClick={handleProfileClick} // <-- Smart redirect here
          >
            <Icon as={FaUser} color="gray.600" />
          </Flex>
        </Flex>

        {/* 2. Title & Gender Toggle Row */}
        <Flex w="100%" justify="space-between" align="center" px={4} pb={4}>
          <Text
            fontSize="22px"
            fontWeight="500"
            color="dark"
            fontFamily="body"
            line-Height={"22px"}
          >
            Leaderboard
          </Text>

          {/* Segmented Control */}
          <Flex
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="full"
            gap="14px"
            align="center"
            w="160px"
          >
            <Flex
              flex={1}
              py={1}
              w="96px"
              h="32px"
              justify="center"
              align="center"
              borderRadius="1.5px"
              borderColor="dark"
              cursor="pointer"
              bg={activeGender === "Girls" ? "pink.400" : "transparent"}
              color={activeGender === "Girls" ? "white" : "gray.500"}
              onClick={() => setActiveGender("Girls")}
            >
              <Text
                fontWeight="500"
                fontSize="14px"
                fontFamily="body"
                color="dark"
                line-Height="40px"
              >
                Girls 👩🏼
              </Text>
            </Flex>
            <Flex
              flex={1}
              py={1}
              w="96px"
              h="32px"
              justify="center"
              align="center"
              borderRadius="1.5px"
              cursor="pointer"
              opacity="0.8"
              borderColor={"#949494"}
              bg={activeGender === "Boys" ? "transparent" : "transparent"}
              color={activeGender === "Boys" ? "gray.800" : "gray.500"}
              onClick={() => setActiveGender("Boys")}
            >
              <Text
                fontWeight="500"
                fontSize="14px"
                fontFamily="body"
                color="#949494"
                line-Height="40px"
              >
                Boys 👦🏾
              </Text>
            </Flex>
          </Flex>
        </Flex>

        {/* 3. The Scrollable Leaderboard List */}
        <Box
          flex={1}
          overflowY="auto"
          px={4}
          pb={32}
          css={{ "&::-webkit-scrollbar": { display: "none" } }}
        >
          {isLoading ? (
            <Flex justify="center" pt={10}>
              <Spinner color="pink.400" />
            </Flex>
          ) : (
            leaders.map((user, index) => {
              const isFirst = index === 0;
              const safeImageSrc =
                user.photo_url && user.photo_url.trim() !== ""
                  ? user.photo_url
                  : "https://images.unsplash.com/photo-1531123897727-8f129e1bfca8?w=500&q=80";

              return (
                <Flex
                  key={user.id}
                  bg="white"
                  w="100%"
                  flex-direction="column"
                  align="flex-start"
                  gap="18px"
                  p={3}
                  borderRadius="2xl"
                  boxShadow="0px 4px 12px rgba(0,0,0,0.05)"
                  justify="space-between"
                  mb={4}
                  border={isFirst ? "2px solid" : "1px solid"}
                  borderColor={isFirst ? "pink.400" : "transparent"}
                >
                  <HStack
                    gap={4}
                    h="68px"
                    borderRadius={"12px"}
                    borderColor="#949494"
                    boxShadow={"0 4px 9px 2px rgba(0, 0, 0, 0.04)"}
                  >
                    <Text
                      fontSize="26px"
                      fontWeight="500"
                      fontFamily="body"
                      line-height="30px"
                      color={isFirst ? "primary.500" : "dark"}
                      
                      textAlign="center"
                    >
                      {index + 1}
                    </Text>

                    {/* Bulletproof Avatar Image */}
                    <Box
                      position="relative"
                      w="61px"
                      h="62px"
                      borderRadius="xl"
                      overflow="hidden"
                    >
                      <img
                        src={safeImageSrc}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        alt={user.name}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1531123897727-8f129e1bfca8?w=500&q=80";
                        }}
                      />
                      {isFirst && (
                        <Icon
                          as={FaCrown}
                          color="yellow.400"
                          position="absolute"
                          top="-10px"
                          left="-8px"
                          boxSize={7}
                          transform="rotate(-20deg)"
                          style={{
                            filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.3))",
                          }}
                        />
                      )}
                    </Box>

                    <Text
                      fontWeight="500"
                      fontSize="17px"
                      color="dark"
                      fontFamily="body"
                      line-Height="20px"
                    >
                      {user.name}
                    </Text>
                  </HStack>

                  <HStack gap={1}>
                    <Icon as={FaFire} color="orange.500" />
                    <Text
                      fontWeight="500"
                      color="dark"
                      fontSize="16px"
                      fontFamily="body"
                      line-Height="20px"
                    >
                      {Math.round(user.elo_score)} swipes
                    </Text>
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
              w="100%"
              h="16"
              borderRadius="xl"
              fontSize="xl"
              fontWeight="bold"
              color="white"
              bgGradient="to-r"
              gradientFrom="orange.400"
              gradientTo="orange.500"
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
        <Flex
          w="100%"
          h="70px"
          bg="white"
          justify="space-around"
          align="center"
          borderTop="1px solid"
          borderColor="gray.100"
          position="absolute"
          bottom="0"
          zIndex={10}
        >
          <VStack
            gap={1}
            color="gray.400"
            cursor="pointer"
            onClick={() => router.push("/")}
          >
            <Icon as={FiHome} boxSize={6} />
            <Text fontSize="10px" fontWeight="bold">
              Home
            </Text>
          </VStack>
          <VStack gap={1} color="pink.400" cursor="pointer">
            <Icon as={FaTrophy} boxSize={6} />
            <Text fontSize="10px" fontWeight="bold">
              Live Ranking
            </Text>
          </VStack>
          <VStack
            gap={1}
            color="gray.400"
            cursor="pointer"
            onClick={handleProfileClick}
          >
            {" "}
            {/* <-- Smart redirect here */}
            <Icon as={FiUser} boxSize={6} />
            <Text fontSize="10px" fontWeight="bold">
              Profile
            </Text>
          </VStack>
        </Flex>

        {/* 6. The Auth Wall Dialog for Guests */}
        <WallDialog showWall={showAuthWall} />
      </Flex>
    </Flex>
  );
}
