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
import { WallDialog } from "@/components/WallDialog";

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeGender, setActiveGender] = useState<"Girls" | "Boys">("Girls");
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [showAuthWall, setShowAuthWall] = useState(false);

  // 1. Unified Data Fetcher
  useEffect(() => {
    const fetchLeaderboardAndUser = async () => {
      setIsLoading(true);

      // A. Check User & Spectator Status
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

        if (userData && Number(userData.elo_score) === 0) {
          setIsSpectator(true);
        } else {
          setIsSpectator(false);
        }
      } else {
        setIsLoggedIn(false);
        setIsSpectator(false);
      }

      // B. Fetch Leaderboard Data (STRICT: Only users with photos)
      const genderFilter = activeGender === "Girls" ? "Female" : "Male";

      const { data, error } = await supabase
        .from("users")
        .select("id, name, photo_url, elo_score")
        .eq("gender", genderFilter)
        // ✅ NEW: Strict filter - Only users with a non-null photo_url
        .not("photo_url", "is", null)
        .order("elo_score", { ascending: false })
        .limit(50);

      if (data) {
        setLeaders(data);
      }
      setIsLoading(false);
    };

    fetchLeaderboardAndUser();
  }, [activeGender]);

  // 2. Action Handlers
  const handleJoinRanking = () => {
    if (isLoggedIn) {
      router.push("/profile");
    } else {
      setShowAuthWall(true);
    }
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      router.push("/profile");
    } else {
      setShowAuthWall(true);
    }
  };

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
        {/* Header */}
        <Flex
          w="100%"
          justify="space-between"
          align="center"
          px={4}
          pt={10}
          pb={4}
        >
          <HStack cursor="pointer" onClick={() => router.push("/")}>
            <Icon as={FaRegHandPointer} color="pink.400" boxSize={5} />
            <Text fontSize="lg" fontWeight="bold" color="pink.400">
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
            onClick={handleProfileClick}
          >
            <Icon as={FaUser} color="gray.600" />
          </Flex>
        </Flex>

        {/* Title & Gender Toggle */}
        <Flex w="100%" justify="space-between" align="center" px={4} pb={4}>
          <Text fontSize="2xl" fontWeight="900" color="black">
            Leaderboard
          </Text>
          <Flex
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="full"
            p={1}
            w="160px"
          >
            <Flex
              flex={1}
              py={1}
              justify="center"
              align="center"
              borderRadius="full"
              cursor="pointer"
              bg={activeGender === "Girls" ? "pink.400" : "transparent"}
              color={activeGender === "Girls" ? "white" : "gray.500"}
              onClick={() => setActiveGender("Girls")}
            >
              <Text fontWeight="bold" fontSize="xs">
                Girls 👩🏼
              </Text>
            </Flex>
            <Flex
              flex={1}
              py={1}
              justify="center"
              align="center"
              borderRadius="full"
              cursor="pointer"
              bg={activeGender === "Boys" ? "blue.400" : "transparent"}
              color={activeGender === "Boys" ? "white" : "gray.500"}
              onClick={() => setActiveGender("Boys")}
            >
              <Text fontWeight="bold" fontSize="xs">
                Boys 👦🏾
              </Text>
            </Flex>
          </Flex>
        </Flex>

        {/* The Scrollable Leaderboard List */}
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
          ) : leaders.length === 0 ? (
            <Flex justify="center" pt={10}>
              <Text color="gray.500" fontWeight="bold">
                No ranked profiles found yet.
              </Text>
            </Flex>
          ) : (
            leaders.map((user, index) => {
              const isFirst = index === 0;
              // We know photo_url exists because of our strict DB filter, but we add a generic fallback just in case of image load failure
              const safeImageSrc =
                user.photo_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`;

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
                    <Text
                      fontSize="2xl"
                      fontWeight="900"
                      color={isFirst ? "pink.400" : "gray.800"}
                      w="30px"
                      textAlign="center"
                    >
                      {index + 1}
                    </Text>

                    <Box
                      position="relative"
                      w="50px"
                      h="50px"
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
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`;
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

                    <Text fontWeight="bold" fontSize="lg" color="gray.900">
                      {user.name}
                    </Text>
                  </HStack>

                  <HStack gap={1}>
                    <Icon as={FaFire} color="orange.500" />
                    <Text fontWeight="900" color="gray.800">
                      {Math.round(user.elo_score)}
                    </Text>
                  </HStack>
                </Flex>
              );
            })
          )}
        </Box>

        {/* Floating "Join Ranking" Button (Shows for Guests OR Spectators) */}
        {(isSpectator || !isLoggedIn) && (
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

        {/* Bottom Navigation */}
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
            <Icon as={FiUser} boxSize={6} />
            <Text fontSize="10px" fontWeight="bold">
              Profile
            </Text>
          </VStack>
        </Flex>

        <WallDialog
          showWall={showAuthWall}
          
        />
      </Flex>
    </Flex>
  );
}
