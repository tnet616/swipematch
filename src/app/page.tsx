"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  HStack,
  VStack,
  Button,
  Icon,
} from "@chakra-ui/react";
import { FiUsers, FiSliders } from "react-icons/fi";
import { SwipeCard, SwipeCardHandle } from "../components/SwipeCard";
import { useSwipeTracker } from "../hooks/useSwipeTracker";
import { WallDialog } from "../components/WallDialog";
import OutOfSwipeDialog from "@/components/OutOfSwipeDialog";
import { supabase } from "../utils/supabase";
import { useRouter } from "next/navigation";

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
        photoUrl: p.photo_url || null,
        isAd: false, // Ensure normal profiles have this flag
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

  // THIS IS CRUCIAL: Determine if the user is allowed to swipe BEFORE the action happens
  const canSwipe = () => {
    if (isLoggedIn === false && remainingSwipes <= 0) {
      setShowAuthWall(true);
      return false;
    }
    if (isLoggedIn === true && userSwipeCount !== null && userSwipeCount <= 0) {
      setShowFireModal(true);
      return false;
    }
    return true;
  };

  const handleSwipe = async (targetId: string, action: "fire" | "pass") => {
    // 1. Double check permission just in case
    if (!canSwipe()) return;

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
      if (!allowed) {
        setShowAuthWall(true);
        return;
      }
    } else {
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
      if (!canSwipe()) return; // Stop if no swipes left
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
      <VStack h="100dvh" w="100vw" bg="white" justify="center" align="center">
         {/* ... (Your existing startup screen code remains unchanged) ... */}
         <VStack
          w="100%"
          maxW="md"
          h="100%"
          px="20px"
          py="40px"
          justify="space-between"
          align="center"
        >
          <VStack w="100%" align="start">
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
                color="primary.500"
                fontFamily="heading"
                fontSize="20px"
                fontWeight="500"
              >
                Swipematch
              </Text>
            </HStack>
          </VStack>

          <VStack w="100%" gap="50px" textAlign="center" align="center">
            <Text
              fontSize="22px"
              fontWeight="700"
              color="dark"
              lineHeight="32px"
              fontFamily="heading"
            >
              Who do you think is the Finest boy/girl on Campus ?
            </Text>
            <HStack
              gap="24px"
              align="center"
              fontSize="16px"
              fontWeight="500"
              color="dark"
              fontFamily="body"
            >
              <HStack gap="10px" align="center">
                <Text>Swipe</Text>
                <Box
                  w="30px"
                  h="30px"
                  bg="#E9E9E9"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  rounded="100%"
                >
                  <Text fontSize="16px">🤩</Text>
                </Box>
              </HStack>
              <HStack gap="10px" align="center">
                <Text>Rank</Text>
                <Box
                  w="30px"
                  h="30px"
                  bg="#E9E9E9"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  rounded="100%"
                >
                  <Text fontSize="16px">👱🏾‍♀️</Text>
                </Box>
              </HStack>
              <HStack gap="10px" align="center">
                <Text>Flex</Text>
                <Box
                  w="30px"
                  h="30px"
                  bg="#E9E9E9"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  rounded="100%"
                >
                  <Text fontSize="16px">👦🏾</Text>
                </Box>
              </HStack>
            </HStack>
          </VStack>
          <VStack w="100%" gap="20px">
            <Button
              w="100%"
              h="70px"
              borderRadius="12px"
              fontSize="28px"
              fontWeight="500"
              color="white"
              bgGradient="to-r"
              gradientFrom="primary.400"
              gradientTo="primary.500"
              borderWidth="3px"
              borderColor="primary.900"
              fontFamily={"heading"}
              _hover={{ opacity: 0.9 }}
              onClick={() => setHasStarted(true)}
            >
              Start Swiping 🤩
            </Button>
            <Button
              w="100%"
              h="70px"
              borderRadius="12px"
              fontSize="28px"
              fontWeight="500"
              color="white"
              bgGradient="to-r"
              borderWidth="3px"
              borderColor="primary.900"
              fontFamily={"heading"}
              gradientFrom="orange.400"
              gradientTo="#D97C2B"
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

  return (
    <VStack
      h="100dvh"
      w="100vw"
      bg="white"
      align="center"
      justify="space-between"
      gap="0"
    >
      {/* ... (Your header logic remains unchanged) ... */}
       <VStack w="100%" h="100%" maxW="md" align="center" gap="40px" px="20px">
        <Flex
          w="100%"
          maxW="md"
          justify="space-between"
          align="center"
          gap="20px"
          pt="20px"
        >
          <Flex
            flex={1}
            h="32px"
            justify="center"
            align="center"
            borderRadius="14px"
            cursor="pointer"
            bg={activeGender === "Girls" ? "primary.500" : "transparent"}
            borderWidth="1px"
            borderColor={activeGender === "Girls" ? "primary.500" : "#949494"}
            opacity={activeGender === "Girls" ? "1" : "0.8"}
            transition="all 0.2s"
            onClick={() => setActiveGender("Girls")}
          >
            <Text
              color={activeGender === "Girls" ? "white" : "gray.500"}
              fontFamily="body"
              fontSize="14px"
              fontWeight="500"
            >
              Girls 👱🏾‍♀️
            </Text>
          </Flex>
          <Flex
            flex={1}
            h="32px"
            justify="center"
            align="center"
            borderRadius="14px"
            cursor="pointer"
            bg={activeGender === "Boys" ? "primary.900" : "transparent"}
            borderWidth="1px"
            borderColor={activeGender === "Boys" ? "primary.900" : "#949494"}
            opacity={activeGender === "Boys" ? "1" : "0.8"}
            transition="all 0.2s"
            onClick={() => setActiveGender("Boys")}
          >
            <Text
              color={activeGender === "Boys" ? "white" : "#949494"}
              fontFamily="body"
              fontSize="14px"
              fontWeight="500"
            >
              Boys 👦🏾
            </Text>
          </Flex>
        </Flex>

        <Box w="100%" maxW="md" flex={1} position="relative">
          {isCurrentlyLoading && currentDeck.length === 0 ? (
            <Box
              w="100%"
              h="100%"
              bg="grey"
              borderRadius="26px"
              overflow="hidden"
              position="absolute"
              top={0}
              left={0}
              css={{ animation: "pulse 1.5s infinite" }}
            >
              <Box w="100%" h="100%" bg="gray.200" />
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
                // Pass down the validation function so the card knows if it's allowed to move
                canSwipe={canSwipe} 
              />
            ))
          )}
          
          {!isCurrentlyLoading && currentDeck.length === 0 && (
            <VStack
            h="100%"
            align="center"
            justify="center"
            textAlign="center"
            gap="40px"
          >
            <VStack bg="#E9E9E9" p={4} borderRadius="full" color="gray.400">
              <Icon as={FiUsers} boxSize={8} />
            </VStack>

            <VStack gap="20px">
              <Heading as="h3" size="md" color="dark" fontWeight="600">
                You're all caught up!
              </Heading>
              <Text color="gray" fontFamily="body" maxW="sm">
                We couldn't find any more profiles right now. Try switching your
                gender tab or check back a little later.
              </Text>
            </VStack>
          </VStack>
          )}
        </Box>

        {/* ... (Your footer buttons remain unchanged) ... */}
         <HStack w="100%" maxW="md" justify="space-evenly" align="flex-start">
          <Flex
            justify="center"
            align="center"
            w="50px"
            h="50px"
            bg="#E9E9E9"
            borderRadius="full"
            border="2px solid"
            borderColor="dark"
            cursor="pointer"
            _active={{ transform: "scale(0.92)" }}
            transition="transform 0.1s ease"
            onClick={() => handleButtonSwipe("pass")}
          >
            <Icon w="24px" h="24px">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M18 6L6.00081 17.9992M17.9992 18L6 6.00085"
                  stroke="#EF3F01"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Icon>
          </Flex>
          <VStack gap={0} opacity="0.7">
            <Flex
              justify="center"
              align="center"
              bg="#E9E9E9"
              borderRadius="full"
              w="50px"
              h="50px"
            >
              <Text
                color="dark"
                fontFamily="body"
                fontSize="20px"
                fontWeight="700"
              >
                {displaySwipes}
              </Text>
            </Flex>
            <Text
              color="dark"
              fontSize="14px"
              fontFamily="body"
              fontWeight="500"
            >
              swipes left
            </Text>
          </VStack>
          <Flex
            justify="center"
            align="center"
            w="50px"
            h="50px"
            bg="#E9E9E9"
            borderRadius="full"
            border="2px solid"
            borderColor="dark"
            cursor="pointer"
            _active={{ transform: "scale(0.92)" }}
            transition="transform 0.1s ease"
            onClick={() => handleButtonSwipe("fire")}
          >
            <Text fontSize="25px">🔥</Text>
          </Flex>
        </HStack>
      </VStack>
      
      {/* ... (Your nav bar remains unchanged) ... */}
       <Flex w="100%" maxW="md" justify="space-between" align="center" p="20px">
        <VStack gap={1} cursor="pointer">
          <Icon w="28px" h="28px">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
            >
              <path
                d="M2.74345 15.4158C2.33159 12.7356 2.12567 11.3956 2.63236 10.2077C3.13904 9.01968 4.2632 8.20688 6.51149 6.58128L8.19132 5.36671C10.9882 3.34449 12.3866 2.33337 14.0001 2.33337C15.6138 2.33337 17.0121 3.34449 19.809 5.36671L21.4889 6.58128C23.7371 8.20688 24.8613 9.01968 25.368 10.2077C25.8747 11.3956 25.6688 12.7356 25.2568 15.4158L24.9057 17.7012C24.3219 21.5004 24.0299 23.4001 22.6673 24.5334C21.3048 25.6667 19.3128 25.6667 15.3287 25.6667H12.6715C8.68756 25.6667 6.69556 25.6667 5.333 24.5334C3.97043 23.4001 3.67851 21.5004 3.09466 17.7012L2.74345 15.4158Z"
                fill="#FF4D8D"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M14 21V17.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Icon>
          <Text
            color="primary.500"
            fontFamily="body"
            fontSize="12px"
            fontWeight="500"
          >
            Home
          </Text>
        </VStack>
        <VStack
          gap={1}
          color="gray.400"
          cursor="pointer"
          onClick={() => router.push("/leaderboard")}
        >
          <Icon w="28px" h="28px">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
            >
              <path
                d="M4.08325 21C4.08325 19.3501 4.08325 18.5251 4.59582 18.0125C5.10838 17.5 5.93334 17.5 7.58325 17.5H8.16659C9.26653 17.5 9.8165 17.5 10.1582 17.8417C10.4999 18.1834 10.4999 18.7334 10.4999 19.8333V25.6667H4.08325V21Z"
                stroke="#BFBFBF"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.5 22.1667C17.5 21.0668 17.5 20.5168 17.8417 20.1751C18.1834 19.8334 18.7334 19.8334 19.8333 19.8334H20.4167C22.0666 19.8334 22.8915 19.8334 23.4041 20.3459C23.9167 20.8585 23.9167 21.6835 23.9167 23.3334V25.6667H17.5V22.1667Z"
                stroke="#BFBFBF"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.33325 25.6666H25.6666"
                stroke="#BFBFBF"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.5 18.6666C10.5 17.0167 10.5 16.1918 11.0126 15.6791C11.5251 15.1666 12.3501 15.1666 14 15.1666C15.6499 15.1666 16.4749 15.1666 16.9875 15.6791C17.5 16.1918 17.5 17.0167 17.5 18.6666V25.6666H10.5V18.6666Z"
                stroke="#BFBFBF"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.8062 3.00733L15.6274 4.66339C15.7394 4.89392 16.038 5.11504 16.29 5.15738L17.7785 5.40673C18.7304 5.56669 18.9544 6.26299 18.2684 6.94988L17.1112 8.11665C16.9153 8.31425 16.808 8.69533 16.8686 8.9682L17.1999 10.4125C17.4612 11.5558 16.8593 11.998 15.8561 11.4005L14.4609 10.5678C14.2089 10.4172 13.7937 10.4172 13.537 10.5678L12.1418 11.4005C11.1432 11.998 10.5366 11.5511 10.7979 10.4125L11.1292 8.9682C11.1899 8.69533 11.0826 8.31425 10.8866 8.11665L9.72938 6.94988C9.04812 6.26299 9.26743 5.56669 10.2193 5.40673L11.7078 5.15738C11.9551 5.11504 12.2538 4.89392 12.3658 4.66339L13.187 3.00733C13.635 2.10872 14.3629 2.10872 14.8062 3.00733Z"
                stroke="#BFBFBF"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Icon>
          <Text color="#BFBFBF" fontFamily="body" fontSize="12px">
            Live Ranking
          </Text>
        </VStack>
        <VStack gap={1} cursor="pointer" onClick={handleProfileClick}>
          <Icon w="28px" h="28px">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
            >
              <path
                d="M19.8334 9.91671C19.8334 6.69505 17.2217 4.08337 14.0001 4.08337C10.7784 4.08337 8.16675 6.69505 8.16675 9.91671C8.16675 13.1383 10.7784 15.75 14.0001 15.75C17.2217 15.75 19.8334 13.1383 19.8334 9.91671Z"
                stroke="#BFBFBF"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22.1666 23.9167C22.1666 19.4063 18.5103 15.75 13.9999 15.75C9.4896 15.75 5.83325 19.4063 5.83325 23.9167"
                stroke="#BFBFBF"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Icon>
          <Text color="#BFBFBF" fontFamily="body" fontSize="12px">
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
    </VStack>
  );
}