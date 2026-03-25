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
import { SwipeCard } from "../components/SwipeCard";
import { useSwipeTracker } from "../hooks/useSwipeTracker";
import { WallDialog } from "../components/WallDialog";
import OutOfFiresDialog from "@/components/OutOfFiresDialog";
import { supabase } from "../utils/supabase";
import { useRouter } from "next/navigation";

// 1. DYNAMIC AD ENGINE DATA
const SPONSORS = [
  {
    id: "ad_dominos",
    name: "Domino's Pizza 🍕 (Ad)",
    photoUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80",
    isAd: true,
  },
  {
    id: "ad_spotify",
    name: "Spotify Student 🎧 (Ad)",
    photoUrl:
      "https://images.unsplash.com/photo-1611339555312-e607c83ce7f7?w=500&q=80",
    isAd: true,
  },
  {
    id: "ad_mtn",
    name: "MTN Pulse 💛 (Ad)",
    photoUrl:
      "https://images.unsplash.com/photo-1534080532213-92c2db237196?w=500&q=80",
    isAd: true,
  },
];

export default function SwipePage() {
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState(false);
  const [activeGender, setActiveGender] = useState<"Girls" | "Boys">("Girls");

  // 2. DUAL-DECK STATE (For instant tab switching)
  const [decks, setDecks] = useState<{ Girls: any[]; Boys: any[] }>({
    Girls: [],
    Boys: [],
  });
  const [loadingState, setLoadingState] = useState({
    Girls: false,
    Boys: false,
  });

  const fetchedIds = useRef<Set<string>>(new Set()); // Prevents fetching duplicates
  const exhaustedDecks = useRef({ Girls: false, Boys: false }); // Stops fetching if DB is empty
  const lastKnownFireCount = useRef<number | null>(null); // Track last confirmed fire count from DB

  const [userFireCount, setUserFireCount] = useState<number | null>(null);
  const [showFireModal, setShowFireModal] = useState(false);
  const [showAuthWall, setShowAuthWall] = useState(false);

  const { remainingSwipes, showWall, setShowWall, recordSwipe } =
    useSwipeTracker();

  // Check Login Status on Mount and reset refs
  useEffect(() => {
    // Clear refs on mount to start fresh
    fetchedIds.current = new Set();
    exhaustedDecks.current = { Girls: false, Boys: false };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setHasStarted(true);
    });
  }, []);

  // Fetch Fire Count and Subscribe to Real-Time Updates
  useEffect(() => {
    let subscription: any = null;

    const setupFireCountSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Initial fetch
      try {
        const { data, error } = await supabase
          .from("users")
          .select("fire_count")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        if (data) {
          setUserFireCount(data.fire_count);
          lastKnownFireCount.current = data.fire_count;
        }
      } catch (error) {
        console.error("Failed to fetch fire count:", error);
      }

      // Subscribe to real-time updates
      subscription = supabase
        .channel(`user_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "users",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new && typeof payload.new.fire_count === "number") {
              // Only update if the server value changed, ensuring UI doesn't revert optimistic updates
              if (payload.new.fire_count !== lastKnownFireCount.current) {
                setUserFireCount(payload.new.fire_count);
                lastKnownFireCount.current = payload.new.fire_count;
              }
            }
          },
        )
        .subscribe();
    };

    if (hasStarted) {
      setupFireCountSubscription();
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [hasStarted]);

  // ==========================================
  // THE PRELOAD ENGINE
  // ==========================================
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
      .neq("id", user?.id || "00000000-0000-0000-0000-000000000000");

    let excludeIds = Array.from(fetchedIds.current);

    if (user) {
      const { data: previousSwipes } = await supabase
        .from("swipes")
        .select("target_id")
        .eq("swiper_id", user.id);
      if (previousSwipes)
        previousSwipes.forEach((s) => excludeIds.push(s.target_id));
    }

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data: rawDeck } = await query.limit(10);

    if (!rawDeck || rawDeck.length === 0) {
      exhaustedDecks.current[gender] = true;
    } else {
      // Shuffle the deck to randomize order
      const shuffledDeck = [...rawDeck].sort(() => Math.random() - 0.5);
      shuffledDeck.forEach((p) => fetchedIds.current.add(p.id));

      let formattedDeck = shuffledDeck.map((p) => ({
        id: p.id,
        name: p.name,
        photoUrl:
          p.photo_url ||
          "https://images.unsplash.com/photo-1531123897727-8f129e1bfca8?w=500&q=80",
      }));

      // 3. THE SMART AD ALGORITHM
      // Only inject an ad if the batch is large enough, and put it in a random spot
      if (formattedDeck.length > 3) {
        const randomSponsor =
          SPONSORS[Math.floor(Math.random() * SPONSORS.length)];
        const adCard = {
          ...randomSponsor,
          id: `${randomSponsor.id}_${Date.now()}`,
        }; // Unique ID so React doesn't crash on duplicates
        const insertIndex =
          Math.floor(Math.random() * (formattedDeck.length - 2)) + 1; // Never the very top card
        formattedDeck.splice(insertIndex, 0, adCard);
      }

      // Add new cards to the BOTTOM of the deck (which is the start of the array in our visual stack)
      setDecks((prev) => {
        // DEDUPLICATION FIX: Extract IDs currently in the deck
        const existingIds = new Set(prev[gender].map((card) => card.id));

        // Filter out any incoming cards that are already in the state
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

  // Initial Load of BOTH decks in the background
  useEffect(() => {
    if (hasStarted) {
      if (decks.Girls.length === 0) loadMoreProfiles("Girls");
      if (decks.Boys.length === 0) loadMoreProfiles("Boys");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

  // ==========================================
  // SECURE SWIPE LOGIC
  // ==========================================
  const handleSwipe = async (targetId: string, action: "fire" | "pass") => {
    // 1. Is it an Ad?
    if (targetId.startsWith("ad_")) {
      if (action === "fire") console.log("User Fired the Ad! Redirecting...");
      setDecks((prev) => ({
        ...prev,
        [activeGender]: prev[activeGender].filter((p) => p.id !== targetId),
      }));
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 2. Auth Limits Check
    if (!user) {
      const allowed = recordSwipe(targetId, action);
      if (!allowed) return;
    } else {
      if (action === "fire") {
        if (userFireCount !== null && userFireCount <= 0) {
          setShowFireModal(true);
          return;
        }
        // Optimistically decrement and track it
        const newCount = (userFireCount || 0) - 1;
        setUserFireCount(newCount);
        lastKnownFireCount.current = newCount;
      }
    }

    // 3. Optimistic UI Update & Preload Trigger
    setDecks((prev) => {
      const updatedDeck = prev[activeGender].filter((p) => p.id !== targetId);

      // If they are down to their last 4 cards, fetch more in the background!
      if (updatedDeck.length <= 4 && !loadingState[activeGender]) {
        setTimeout(() => loadMoreProfiles(activeGender), 0);
      }

      return { ...prev, [activeGender]: updatedDeck };
    });

    // 4. Database Call
    if (user) {
      supabase
        .rpc("handle_swipe", {
          p_swiper_id: user.id,
          p_target_id: targetId,
          p_is_fire: action === "fire",
        })
        .then(async ({ error }: any) => {
          if (error) {
            console.error("Swipe failed:", error);
            // Revert optimistic UI update on failure
            if (action === "fire") {
              const oldCount = (lastKnownFireCount.current || 0) + 1;
              setUserFireCount(oldCount);
              lastKnownFireCount.current = oldCount;
            }
            setDecks((prev) => ({
              ...prev,
              [activeGender]: [
                decks[activeGender][decks[activeGender].length - 1],
                ...prev[activeGender],
              ],
            }));
          } else if (action === "fire") {
            // On success, verify the fire count was decremented in DB
            try {
              const { data } = await supabase
                .from("users")
                .select("fire_count")
                .eq("id", user.id)
                .single();
              if (data && typeof data.fire_count === "number") {
                lastKnownFireCount.current = data.fire_count;
                setUserFireCount(data.fire_count);
              }
            } catch (err) {
              console.error("Failed to verify fire count:", err);
            }
          }
        });
    }
  };

  const handleReward = async (amount: number) => {
    // 1. Optimistic UI update instantly gives them the fires
    setUserFireCount((prev) => (prev || 0) + amount);
    setShowFireModal(false);

    // 2. Securely update the database in the background
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error: fetchError } = await supabase
          .from("users")
          .select("fire_count")
          .eq("id", user.id)
          .single();
        if (fetchError) throw fetchError;
        if (data) {
          const { error: updateError } = await supabase
            .from("users")
            .update({ fire_count: data.fire_count + amount })
            .eq("id", user.id);
          if (updateError) throw updateError;
        }
      }
    } catch (error) {
      console.error("Failed to update fire count:", error);
      // Revert optimistic update on failure
      setUserFireCount((prev) => (prev || 0) - amount);
    }
  };

  const displaySwipes =
    userFireCount !== null ? userFireCount : remainingSwipes;
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

  // ==========================================
  // VIEW 1: LANDING PAGE
  // ==========================================
  if (!hasStarted) {
    return (
      <VStack h="100dvh" w="100vw" bg="white" justify="center" align="center">
        <VStack
          w="100%"
          maxW="md"
          h="100%"
          px="20px"
          py="40px"
          justify="space-between"
          align="center"
        >
          <VStack w="100%" align={"start"}>
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
          </VStack>

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
              onClick={handleJoinRanking}
            >
              Join the Ranking 😎
            </Button>
          </VStack>
        </VStack>
        <WallDialog showWall={showAuthWall} />
      </VStack>
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
            bg={activeGender === "Boys" ? "blue.400" : "transparent"}
            color={activeGender === "Boys" ? "white" : "gray.500"}
            boxShadow={activeGender === "Boys" ? "sm" : "none"}
            onClick={() => setActiveGender("Boys")}
          >
            <Text fontWeight="bold" fontSize="sm">
              Boys 👦🏾
            </Text>
          </Flex>
        </Flex>
      </VStack>

      <Box w="100%" maxW="md" flex={1} position="relative" mt={6} px={4}>
        {/* THE NEW SKELETON LOADER */}
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
              profile={profile}
              onSwipe={handleSwipe}
              isTopCard={index === currentDeck.length - 1}
            />
          ))
        )}

        {/* EMPTY STATE */}
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
          borderColor="gray.200"
          boxShadow="md"
          cursor="pointer"
          _active={{ transform: "scale(0.95)" }}
          transition="0.1s"
          onClick={() => {
            if (currentDeck.length > 0)
              handleSwipe(currentDeck[currentDeck.length - 1].id, "pass");
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
            {userFireCount !== null ? "fires left 🔥" : "swipes left"}
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
            if (currentDeck.length > 0)
              handleSwipe(currentDeck[currentDeck.length - 1].id, "fire");
          }}
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

      <WallDialog showWall={showWall || showAuthWall} />
      <OutOfFiresDialog
        isOpen={showFireModal}
        onClose={() => setShowFireModal(false)}
        onReward={handleReward}
      />
    </Flex>
  );
}
