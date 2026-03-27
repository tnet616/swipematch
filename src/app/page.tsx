"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Button,
  Icon,
} from "@chakra-ui/react";
import { FaFire, FaTrophy, FaTimes, FaRegHandPointer } from "react-icons/fa";
import { FiHome, FiUser } from "react-icons/fi";
import { SwipeCard, SwipeCardHandle } from "../components/SwipeCard";
import { useSwipeTracker } from "../hooks/useSwipeTracker";
import { WallDialog } from "../components/WallDialog";
import OutOfSwipeDialog from "@/components/OutOfSwipeDialog";
import { supabase } from "../utils/supabase";
import { useRouter } from "next/navigation";

// CHANGED: Replaced Unsplash with safe Placehold.co images to prevent CORB blocks
const SPONSORS = [
  {
    id: "ad_dominos",
    name: "Domino's Pizza 🍕 (Ad)",
    photoUrl: "https://placehold.co/500x800/ff9900/white?text=Dominos+Promo",
    isAd: true,
  },
  {
    id: "ad_spotify",
    name: "Spotify Student 🎧 (Ad)",
    photoUrl: "https://placehold.co/500x800/1DB954/white?text=Spotify+Student",
    isAd: true,
  },
  {
    id: "ad_mtn",
    name: "MTN Pulse 💛 (Ad)",
    photoUrl: "https://placehold.co/500x800/ffcc00/black?text=MTN+Pulse",
    isAd: true,
  },
];

export default function SwipePage() {
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState(false);
  const [activeGender, setActiveGender] = useState<"Girls" | "Boys">("Girls");

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [decks, setDecks] = useState<{ Girls: any[]; Boys: any[] }>({
    Girls: [],
    Boys: [],
  });
  const [loadingState, setLoadingState] = useState({
    Girls: false,
    Boys: false,
  });

  const fetchedIds = useRef<Set<string>>(new Set());
  const exhaustedDecks = useRef({ Girls: false, Boys: false });

  const [userSwipeCount, setUserSwipeCount] = useState<number | null>(null);
  const [showFireModal, setShowFireModal] = useState(false);
  const [showAuthWall, setShowAuthWall] = useState(false);

  const cardRefs = useRef<Map<string, SwipeCardHandle>>(new Map());
  const { remainingSwipes, showWall, setShowWall, recordSwipe } =
    useSwipeTracker();

  useEffect(() => {
    fetchedIds.current = new Set();
    exhaustedDecks.current = { Girls: false, Boys: false };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true);
        setHasStarted(true);
      } else {
        setIsLoggedIn(false);
      }
    });
  }, []);

  useEffect(() => {
    const fetchSwipes = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      try {
        // Fetch swipe_count instead of fire_count
        const { data, error } = await supabase
          .from("users")
          .select("swipe_count")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        if (data && typeof data.swipe_count === "number")
          setUserSwipeCount(data.swipe_count);
      } catch (error) {
        console.error("Failed to fetch swipe count:", error);
      }
    };
    if (hasStarted && isLoggedIn) fetchSwipes();
  }, [hasStarted, isLoggedIn]);

  const loadMoreProfiles = async (gender: "Girls" | "Boys") => {
    if (exhaustedDecks.current[gender] || loadingState[gender]) return;
    setLoadingState((prev) => ({ ...prev, [gender]: true }));

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const dbGender = gender === "Girls" ? "Female" : "Male";

    let query = supabase
      .from("users")
      .select("id, name, photo_url")
      .eq("gender", dbGender)
      // ✅ STRICT DB FILTER: Do not return users without photos
      .not("photo_url", "is", null)
      .neq("id", user?.id || "00000000-0000-0000-0000-000000000000");

    let excludeIds = Array.from(fetchedIds.current);

    if (user) {
      const { data: previousSwipes, error: swipeErr } = await supabase
        .from("swipes")
        .select("target_id")
        .eq("swiper_id", user.id);
      if (swipeErr)
        console.error("DB Error fetching previous swipes:", swipeErr);
      if (previousSwipes)
        previousSwipes.forEach((s) => excludeIds.push(s.target_id));
    }

    if (excludeIds.length > 0) {
      // FIX: The PGRST100 Error. Supabase explicitly requires parentheses around the joined list!
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data: rawDeck } = await query.limit(10);

    if (!rawDeck || rawDeck.length === 0) {
      exhaustedDecks.current[gender] = true;
    } else {
      const shuffledDeck = [...rawDeck].sort(() => Math.random() - 0.5);
      shuffledDeck.forEach((p) => fetchedIds.current.add(p.id));

      let formattedDeck = shuffledDeck.map((p) => ({
        id: p.id,
        name: p.name,
        // FIX: Stop forcing Unsplash! Pass exactly what the DB has (or null) so SwipeCard can handle it
        photoUrl: p.photo_url || null,
      }));

      if (formattedDeck.length > 3) {
        const randomSponsor =
          SPONSORS[Math.floor(Math.random() * SPONSORS.length)];
        const adCard = {
          ...randomSponsor,
          id: `${randomSponsor.id}_${Date.now()}`,
        };
        const insertIndex =
          Math.floor(Math.random() * (formattedDeck.length - 2)) + 1;
        formattedDeck.splice(insertIndex, 0, adCard);
      }

      setDecks((prev) => {
        const existingIds = new Set(prev[gender].map((card) => card.id));
        const safeNewDeck = formattedDeck.filter(
          (card) => !existingIds.has(card.id),
        );
        return {
          ...prev,
          [gender]: [...safeNewDeck.reverse(), ...prev[gender]],
        };
      });
    }

    setLoadingState((prev) => ({ ...prev, [gender]: false }));
  };

  useEffect(() => {
    if (hasStarted) {
      if (decks.Girls.length === 0) loadMoreProfiles("Girls");
      if (decks.Boys.length === 0) loadMoreProfiles("Boys");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

  const handleSwipe = async (targetId: string, action: "fire" | "pass") => {
    if (targetId.startsWith("ad_")) {
      setDecks((prev) => ({
        ...prev,
        [activeGender]: prev[activeGender].filter((p) => p.id !== targetId),
      }));
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const allowed = recordSwipe(targetId, action);
      if (!allowed) return;
    } else {
      // NEW LOGIC: Check limits for BOTH actions
      if (userSwipeCount !== null && userSwipeCount <= 0) {
        setShowFireModal(true); // Triggers your OutOfSwipesDialog
        return;
      }
      // Optimistically deduct 1 stamina
      setUserSwipeCount((prev) => (prev !== null ? prev - 1 : 0));
    }

    setDecks((prev) => {
      const updatedDeck = prev[activeGender].filter((p) => p.id !== targetId);
      if (updatedDeck.length <= 4 && !loadingState[activeGender])
        setTimeout(() => loadMoreProfiles(activeGender), 0);
      return { ...prev, [activeGender]: updatedDeck };
    });

    if (user) {
      supabase
        .rpc("handle_swipe", {
          p_swiper_id: user.id,
          p_target_id: targetId,
          p_is_fire: action === "fire",
        })
        .then(({ error }: any) => {
          if (error) {
            console.error(
              "CRITICAL: RPC handle_swipe failed to save to database!",
              error,
            );
            if (action === "fire")
              setUserSwipeCount((prev) => (prev !== null ? prev + 1 : 1));
            setDecks((prev) => ({
              ...prev,
              [activeGender]: [
                decks[activeGender][decks[activeGender].length - 1],
                ...prev[activeGender],
              ],
            }));
          }
        });
    }
  };

  const handleButtonSwipe = async (action: "fire" | "pass") => {
    const currentDeck = decks[activeGender];
    if (currentDeck.length === 0) return;

    const topCard = currentDeck[currentDeck.length - 1];

    if (!topCard.id.startsWith("ad_")) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && action === "fire") {
        if (userSwipeCount !== null && userSwipeCount <= 0) {
          setShowFireModal(true);
          return;
        }
      }
    }

    const cardRef = cardRefs.current.get(topCard.id);
    if (cardRef) cardRef.triggerSwipe(action);
    else handleSwipe(topCard.id, action);
  };

  const handleReward = async (amount: number) => {
    setUserSwipeCount((prev) => (prev !== null ? prev + amount : amount));
    setShowFireModal(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error: fetchError } = await supabase
          .from("users")
          .select("swipe_count")
          .eq("id", user.id)
          .single();
        if (fetchError) throw fetchError;
        if (data) {
          // Update swipe_count
          const { error: updateError } = await supabase
            .from("users")
            .update({ swipe_count: data.swipe_count + amount })
            .eq("id", user.id);
          if (updateError) throw updateError;
        }
      }
    } catch (error) {
      console.error("Failed to update swipe count:", error);
      setUserSwipeCount((prev) => (prev !== null ? prev - amount : 0));
    }
  };

  const displaySwipes =
    userSwipeCount !== null
      ? userSwipeCount
      : isLoggedIn === true
        ? "..."
        : remainingSwipes;
  const currentDeck = decks[activeGender];
  const isCurrentlyLoading = loadingState[activeGender];

  const handleProfileClick = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) router.push("/profile");
    else setShowAuthWall(true);
  };

  const handleJoinRanking = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();
      if (profile) router.push("/profile");
      else router.push("/onboarding");
    } else setShowAuthWall(true);
  };

  if (!hasStarted) {
    return (
      <Flex h="100dvh" w="100vw" bg="white" justify="center" align="center">
        <VStack
          w="100%"
          maxW="md"
          h="100%"
          justify="space-between"
          py="40px"
          px="20px"
        >
          <HStack w="100%" justify="flex-start">
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
              Who do you think is the Finest boy/girl on Campus?
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
              onClick={handleJoinRanking}
            >
              Join the Ranking 😎
            </Button>
          </VStack>
        </VStack>
        <WallDialog showWall={showAuthWall} />
      </Flex>
    );
  }

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
      <VStack w="100%" maxW="md" px={4} pt={10} gap={4}>
        <Flex w="100%" justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="900" color="black">
            Start Swiping
          </Text>
          <Text fontSize="lg" color="gray.400" fontWeight="bold">
            {"</>"}
          </Text>
        </Flex>
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
            transition="all 0.2s"
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
            bg={activeGender === "Boys" ? "blue.400" : "transparent"}
            color={activeGender === "Boys" ? "white" : "gray.500"}
            boxShadow={activeGender === "Boys" ? "sm" : "none"}
            transition="all 0.2s"
            onClick={() => setActiveGender("Boys")}
          >
            <Text fontWeight="bold" fontSize="sm">
              Boys 👦🏾
            </Text>
          </Flex>
        </Flex>
      </VStack>

      <Box w="100%" maxW="md" flex={1} position="relative" mt={4} px={4}>
        {isCurrentlyLoading && currentDeck.length === 0 ? (
          <Box
            w="100%"
            h="100%"
            borderRadius="3xl"
            bg="gray.100"
            overflow="hidden"
            position="absolute"
            top={0}
            left={0}
            css={{ animation: "pulse 1.5s infinite" }}
          >
            <Box w="100%" h="80%" bg="gray.200" />
            <Flex p={5} h="20%" align="center" bg="white">
              <Box w="60%" h="8" bg="gray.200" borderRadius="md" />
            </Flex>
          </Box>
        ) : (
          currentDeck.map((profile, index) => (
            <SwipeCard
              key={profile.id}
              ref={(el) => {
                if (el) cardRefs.current.set(profile.id, el);
                else cardRefs.current.delete(profile.id);
              }}
              profile={profile}
              onSwipe={handleSwipe}
              isTopCard={index === currentDeck.length - 1}
            />
          ))
        )}
        {!isCurrentlyLoading && currentDeck.length === 0 && (
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
          borderColor="red.200"
          boxShadow="md"
          cursor="pointer"
          _active={{ transform: "scale(0.92)" }}
          transition="transform 0.1s ease"
          onClick={() => handleButtonSwipe("pass")}
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
          {/* Clean, unified text */}
          <Text fontSize="xs" color="gray.500" fontWeight="bold" mt={1}>
            swipes left ⚡
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
          borderColor="orange.200"
          boxShadow="md"
          cursor="pointer"
          _active={{ transform: "scale(0.92)" }}
          transition="transform 0.1s ease"
          onClick={() => handleButtonSwipe("fire")}
        >
          <Icon as={FaFire} boxSize={8} color="#DD6B20" />
        </Flex>
      </HStack>

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

      <WallDialog showWall={showAuthWall || showWall} />
      <OutOfSwipeDialog
        isOpen={showFireModal}
        onClose={() => setShowFireModal(false)}
        onReward={handleReward}
      />
    </Flex>
  );
}
