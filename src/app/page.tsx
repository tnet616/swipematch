"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Button,
  IconButton,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import { FaFire, FaTrophy, FaTimes, FaRegHandPointer } from "react-icons/fa";
import { FiHome, FiUser } from "react-icons/fi";
import { SwipeCard } from "../components/SwipeCard";
import { useSwipeTracker } from "../hooks/useSwipeTracker";
import { WallDialog } from "../components/WallDialog";
import { OutOfFiresDialog } from "../components/OutOfFiresDialog";
import { supabase } from "../utils/supabase";
import { useRouter } from "next/navigation";

// 1. A mock sponsored card to inject into the live deck
const SPONSORED_CARD = {
  id: "ad_dominos_01",
  name: "Domino's Pizza 🍕 (Ad)",
  photoUrl:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80",
  isAd: true,
};

export default function SwipePage() {
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeGender, setActiveGender] = useState<"Girls" | "Boys">("Girls");

  // Phase 5 State Additions
  const [isLoading, setIsLoading] = useState(true);
  const [userFireCount, setUserFireCount] = useState<number | null>(null);
  const [showFireModal, setShowFireModal] = useState(false);

  const { remainingSwipes, showWall, recordSwipe } = useSwipeTracker();

  // ==========================================
  // FETCH LIVE DATA FROM SUPABASE
  // ==========================================
  useEffect(() => {
    const fetchLiveDeck = async () => {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch their current Fire stash
        const { data: userData } = await supabase
          .from("users")
          .select("fire_count")
          .eq("id", user.id)
          .single();
        if (userData) setUserFireCount(userData.fire_count);
      }

      // Map UI toggle to database values
      const genderFilter = activeGender === "Girls" ? "Female" : "Male";

      // Fetch 10 random profiles from the database
      const { data: rawDeck, error } = await supabase
        .from("users")
        .select("id, name, photo_url")
        .eq("gender", genderFilter)
        .neq("id", user?.id || "00000000-0000-0000-0000-000000000000") // Don't show themselves
        .limit(10);

      if (rawDeck && rawDeck.length > 0) {
        let formattedDeck = rawDeck.map((p) => ({
          id: p.id,
          name: p.name,
          photoUrl:
            p.photo_url ||
            "https://images.unsplash.com/photo-1531123897727-8f129e1bfca8?w=500&q=80", // fallback
        }));

        // Inject the Sponsored Card at index 1 so they see it early
        if (formattedDeck.length > 1) {
          formattedDeck.splice(1, 0, SPONSORED_CARD);
        }

        // Reverse so the first item in the array renders on TOP of the visual stack
        setProfiles(formattedDeck.reverse());
      } else {
        setProfiles([]);
      }
      setIsLoading(false);
    };

    if (hasStarted) {
      fetchLiveDeck();
    }
  }, [activeGender, hasStarted]);

  // ==========================================
  // SECURE SWIPE LOGIC
  // ==========================================
  const handleSwipe = async (targetId: string, action: "fire" | "pass") => {
    // Is it the Sponsored Card?
    if (targetId.startsWith("ad_")) {
      if (action === "fire") {
        console.log("User Fired the Ad! Redirecting to promo code...");
      }
      setProfiles((prev) => prev.filter((p) => p.id !== targetId));
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // GUEST FLOW
      const allowed = recordSwipe(targetId, action);
      if (allowed) setProfiles((prev) => prev.filter((p) => p.id !== targetId));
    } else {
      // AUTHENTICATED FLOW
      if (action === "fire") {
        if (userFireCount !== null && userFireCount <= 0) {
          setShowFireModal(true); // Trigger Paywall
          return; // Stop the swipe from happening!
        }
        setUserFireCount((prev) => (prev || 0) - 1); // Optimistic UI update
      }

      setProfiles((prev) => prev.filter((p) => p.id !== targetId));

      // Fire off to the database silently
      supabase
        .rpc("handle_swipe", {
          p_swiper_id: user.id,
          p_target_id: targetId,
          p_is_fire: action === "fire",
        })
        .then(({ error }) => {
          if (error) console.error("Swipe failed:", error);
        });
    }
  };

  const handleWatchAd = () => {
    console.log("Playing Video Ad...");
    setTimeout(() => {
      setUserFireCount((prev) => (prev || 0) + 5);
      setShowFireModal(false);
    }, 2000);
  };

  const displaySwipes =
    userFireCount !== null ? userFireCount : remainingSwipes;

  // ==========================================
  // VIEW 1: LANDING PAGE
  // ==========================================
  if (!hasStarted) {
    return (
      <Flex h="100dvh" w="100vw" bg="white" justify="center" align="center">
        <Flex
          w="100%"
          maxW="md"
          h="100%"
          direction="column"
          p={6}
          justify="space-between"
        >
          <HStack pt={4}>
            <Icon as={FaRegHandPointer} color="pink.400" boxSize={5} />
            <Text fontSize="lg" fontWeight="bold" color="pink.400">
              Swipematch
            </Text>
          </HStack>

          <VStack gap={6} textAlign="center" px={2}>
            <Text
              fontSize="3xl"
              fontWeight="900"
              color="black"
              lineHeight="1.2"
            >
              Who do you think is the Finest boy/girl on Campus ?
            </Text>
            <HStack gap={4} fontSize="sm" fontWeight="medium" color="gray.600">
              <Text>Swipe 🤩</Text>
              <Text>Rank 👩🏼</Text>
              <Text>Flex 👦🏾</Text>
            </HStack>
          </VStack>

          <VStack gap={4} pb={10}>
            <Button
              w="100%"
              h="16"
              borderRadius="xl"
              fontSize="xl"
              fontWeight="bold"
              color="white"
              bgGradient="to-r"
              gradientFrom="pink.400"
              gradientTo="pink.500"
              _hover={{ opacity: 0.9 }}
              onClick={() => setHasStarted(true)}
            >
              Start Swiping 🤩
            </Button>
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
              _hover={{ opacity: 0.9 }}
              onClick={() => router.push("/onboarding")}
            >
              Join the Ranking 😎
            </Button>
          </VStack>
        </Flex>
      </Flex>
    );
  }

  // ==========================================
  // VIEW 2: SWIPE DECK
  // ==========================================
  return (
    <Flex
      h="100dvh"
      w="100vw"
      bg="white"
      direction="column"
      align="center"
      justify="space-between"
      pb={6}
    >
      {/* Header & Toggle */}
      <VStack w="100%" maxW="md" px={4} pt={10} gap={6}>
        <Flex
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="full"
          p={1}
          w="100%"
        >
          <Flex
            flex={1}
            py={3}
            justify="center"
            align="center"
            borderRadius="full"
            cursor="pointer"
            bg={activeGender === "Girls" ? "pink.400" : "transparent"}
            color={activeGender === "Girls" ? "white" : "gray.500"}
            boxShadow={activeGender === "Girls" ? "sm" : "none"}
            onClick={() => setActiveGender("Girls")}
          >
            <Text fontWeight="bold" fontSize="sm">
              Girls 👩🏼
            </Text>
          </Flex>
          <Flex
            flex={1}
            py={3}
            justify="center"
            align="center"
            borderRadius="full"
            cursor="pointer"
            bg={activeGender === "Boys" ? "transparent" : "transparent"}
            color={activeGender === "Boys" ? "gray.800" : "gray.500"}
            onClick={() => setActiveGender("Boys")}
          >
            <Text fontWeight="bold" fontSize="sm">
              Boys 👦🏾
            </Text>
          </Flex>
        </Flex>
      </VStack>

      {/* The Card Stack */}
      <Box w="100%" maxW="md" flex={1} position="relative" mt={6} px={4}>
        {isLoading ? (
          <Flex
            h="100%"
            align="center"
            justify="center"
            direction="column"
            gap={4}
          >
            <Spinner color="pink.400" size="xl" />
            <Text color="gray.500" fontWeight="bold">
              Loading live campus deck...
            </Text>
          </Flex>
        ) : (
          profiles.map((profile, index) => (
            <SwipeCard
              key={profile.id}
              profile={profile}
              onSwipe={handleSwipe}
              isTopCard={index === profiles.length - 1}
            />
          ))
        )}
        {!isLoading && profiles.length === 0 && (
          <Flex
            h="100%"
            align="center"
            justify="center"
            textAlign="center"
            px={6}
          >
            <Text color="gray.500" fontWeight="bold">
              No more profiles found! Check back later or switch genders.
            </Text>
          </Flex>
        )}
      </Box>

      {/* The Action Row */}
      <HStack
        w="100%"
        maxW="md"
        justify="space-evenly"
        align="center"
        pt={6}
        pb={4}
      >
        <Flex
          justify="center"
          align="center"
          w="65px"
          h="65px"
          bg="white"
          borderRadius="full"
          border="2px solid"
          borderColor="gray.200"
          boxShadow="md"
          cursor="pointer"
          _active={{ transform: "scale(0.95)" }}
          transition="0.1s"
          onClick={() => {
            if (profiles.length > 0)
              handleSwipe(profiles[profiles.length - 1].id, "pass");
          }}
        >
          <Icon as={FaTimes} boxSize={8} color="#E53E3E" />
        </Flex>

        <VStack gap={0}>
          <Flex
            justify="center"
            align="center"
            bg="gray.100"
            borderRadius="full"
            w="50px"
            h="50px"
          >
            <Text fontSize="xl" fontWeight="black" color="gray.700">
              {displaySwipes}
            </Text>
          </Flex>
          <Text fontSize="xs" color="gray.500" fontWeight="bold" mt={1}>
            swipes left
          </Text>
        </VStack>

        <Flex
          justify="center"
          align="center"
          w="65px"
          h="65px"
          bg="white"
          borderRadius="full"
          border="2px solid"
          borderColor="gray.200"
          boxShadow="md"
          cursor="pointer"
          _active={{ transform: "scale(0.95)" }}
          transition="0.1s"
          onClick={() => {
            if (profiles.length > 0)
              handleSwipe(profiles[profiles.length - 1].id, "fire");
          }}
        >
          <Icon as={FaFire} boxSize={8} color="#DD6B20" />
        </Flex>
      </HStack>

      {/* Bottom Navigation */}
      <Flex
        w="100%"
        maxW="md"
        justify="space-around"
        align="center"
        pt={4}
        borderTop="1px solid"
        borderColor="gray.100"
      >
        <VStack gap={1} color="pink.400" cursor="pointer">
          <Icon as={FiHome} boxSize={6} />
          <Text fontSize="10px" fontWeight="bold">
            Home
          </Text>
        </VStack>
        <VStack
          gap={1}
          color="gray.400"
          cursor="pointer"
          onClick={() => router.push("/leaderboard")}
        >
          <Icon as={FaTrophy} boxSize={6} />
          <Text fontSize="10px" fontWeight="bold">
            Live Ranking
          </Text>
        </VStack>
        <VStack gap={1} color="gray.400" cursor="pointer">
          <Icon as={FiUser} boxSize={6} />
          <Text fontSize="10px" fontWeight="bold">
            Profile
          </Text>
        </VStack>
      </Flex>

      {/* Modals */}
      <WallDialog showWall={showWall} />
      <OutOfFiresDialog
        isOpen={showFireModal}
        onClose={() => setShowFireModal(false)}
        onWatchAd={handleWatchAd}
      />
    </Flex>
  );
}
