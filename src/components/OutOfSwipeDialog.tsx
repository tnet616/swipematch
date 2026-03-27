"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  Text,
  VStack,
  HStack,
  Icon,
  Box,
  Input,
  Spinner,
  Image,
  Flex,
} from "@chakra-ui/react";
import { FaPlay, FaPoll, FaClock, FaCheckCircle } from "react-icons/fa";
import { supabase } from "../utils/supabase";
import { ECONOMY } from "../config/economy";

interface OutOfFiresDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: (amount: number) => void;
}

// ==========================================
// YOUR AD INVENTORY
// ==========================================
const AD_CAMPAIGNS = [
  {
    id: "funaab_shawarma",
    type: "image",
    src: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=500&q=80",
    duration: 5,
  },
  {
    id: "mtn_pulse_promo",
    type: "video",
    src: "https://cdn.coverr.co/videos/coverr-a-person-scrolling-on-their-phone-2849/1080p.mp4",
    duration: 10,
  },
  {
    id: "google_adsense_fallback",
    type: "adsense",
    duration: 5,
  },
];

// ==========================================
// THE SUPPS-Q MICRO-SURVEY ENGINE
// ==========================================
type QuestionType = "text" | "radio" | "checkbox" | "rank";

interface SurveyQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  maxSelect?: number;
}

const SURVEYS = [
  // --- POLL 1: Demographics ---
  {
    id: "supps_q_demographics",
    reward: ECONOMY.POLL_REWARD,
    title: "Socio-Demographic Data",
    questions: [
      {
        id: "q1",
        type: "radio",
        text: "1. Gender",
        options: ["Male", "Female"],
      },
      {
        id: "q2",
        type: "radio",
        text: "2. Age Group",
        options: [
          "16-19 years",
          "20-23 years",
          "24-27 years",
          "Above 27 years",
        ],
      },
      {
        id: "q3",
        type: "radio",
        text: "3. College (Faculty)",
        options: [
          "COLNAS",
          "COLENG",
          "COLANIM",
          "COLPLANT",
          "COLERM",
          "COLFHEC",
          "COLAMRUD",
          "COLVET",
          "COLMAS",
          "COLPHYS",
          "COLCOM",
          "OTHERS",
        ],
      },
      {
        id: "q4",
        type: "radio",
        text: "4. Level of Study",
        options: ["100L", "200L", "300L", "400L", "500L/600L"],
      },
      {
        id: "q5",
        type: "radio",
        text: "5. Mode of Residence",
        options: ["On-Campus (Hostel)", "Off-Campus"],
      },
    ] as SurveyQuestion[],
  },

  // --- POLL 2: Habits & Utilization ---
  {
    id: "supps_q_utilization",
    reward: 15,
    title: "Campus Habits",
    questions: [
      {
        id: "q6",
        type: "checkbox",
        text: "6. Are you aware of the following public spaces? (Tick ALL that apply)",
        options: [
          "University Library",
          "Student Centre / SUB",
          "College Common Rooms",
          "Sports Centre",
          "Motion Ground / Parks",
          "Religious Centres",
          "Cafeterias",
        ],
      },
      {
        id: "q7",
        type: "radio",
        text: "7. Which public space do you visit MOST frequently?",
        options: [
          "Library",
          "SUB",
          "Common Rooms",
          "Sports Centre",
          "Open Parks",
          "Religious Centres",
        ],
      },
      {
        id: "q8",
        type: "radio",
        text: "8. How often do you use this space?",
        options: [
          "Daily",
          "2-3 times a week",
          "Once a week",
          "Occasionally",
          "Never",
        ],
      },
      {
        id: "q9",
        type: "radio",
        text: "9. What time of day do you typically use these spaces?",
        options: [
          "Morning (8am-12pm)",
          "Afternoon (12pm-4pm)",
          "Evening (4pm-7pm)",
          "Night (After 7pm)",
        ],
      },
      {
        id: "q10",
        type: "radio",
        text: "10. On average, how long do you spend per visit?",
        options: [
          "Less than 30 mins",
          "30 mins - 1 hour",
          "1-2 hours",
          "More than 2 hours",
        ],
      },
    ] as SurveyQuestion[],
  },

  // --- POLL 3: Purpose & Satisfaction ---
  {
    id: "supps_q_satisfaction",
    reward: 15,
    title: "Campus Satisfaction",
    questions: [
      {
        id: "q11",
        type: "radio",
        text: "11. PRIMARY reason for visiting public spaces?",
        options: [
          "Academic Study",
          "Relaxation/Sleeping",
          "Socializing",
          "Waiting for lecture",
          "Eating/Refreshment",
          "Charging Devices",
        ],
      },
      {
        id: "q12",
        type: "radio",
        text: "12. MAJOR barrier preventing you from using spaces more?",
        options: [
          "Overcrowding",
          "Noise",
          "Dirtiness",
          "Lack of Power",
          "Poor Ventilation",
          "Security",
          "None",
        ],
      },
      {
        id: "q13",
        type: "rank",
        text: "13. Rate your satisfaction with public spaces (1 = Very Dissatisfied, 5 = Very Satisfied)",
        options: [
          "Cleanliness",
          "Availability of seats",
          "Lighting",
          "Ventilation",
          "Noise control",
          "Security",
          "Internet/Wi-Fi",
        ],
      },
    ] as SurveyQuestion[],
  },

  // --- POLL 4: Needs & Preferences ---
  {
    id: "supps_q_preferences",
    reward: 20,
    title: "Space Preferences",
    questions: [
      {
        id: "q14",
        type: "checkbox",
        text: "14. Which AMENITIES would you prioritize most? (Select strictly 3)",
        maxSelect: 3,
        options: [
          "Power Sockets",
          "High-Speed Wi-Fi",
          "Comfortable Sofas",
          "Active Cooling",
          "Group Tables",
          "Quiet Cubicles",
          "Recreation (Games)",
          "Access to Food",
        ],
      },
      {
        id: "q15",
        type: "rank",
        text: "15. Rank these new space types (1 = Best, 4 = Worst):",
        options: [
          "Strictly Quiet Zone",
          "Collaborative Hub",
          "Social Lounge",
          "Nature Park",
        ],
      },
      {
        id: "q16",
        type: "radio",
        text: "16. How important is 'Aesthetics' compared to 'Functionality'?",
        options: [
          "Very Important",
          "Moderately Important",
          "Not Important (Function only)",
        ],
      },
    ] as SurveyQuestion[],
  },
];

export default function OutOfSwipeDialog({
  isOpen,
  onClose,
  onReward,
}: OutOfFiresDialogProps) {
  const [view, setView] = useState<"menu" | "ad" | "poll">("menu");
  const [timeLeft, setTimeLeft] = useState("");

  const [activeAd, setActiveAd] = useState<any>(null);
  const [adCountdown, setAdCountdown] = useState(0);

  const [completedSurveyIds, setCompletedSurveyIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<
    Record<string, string | string[] | Record<string, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSurveys, setIsCheckingSurveys] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${h}h ${m}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === "ad" && adCountdown > 0) {
      timer = setTimeout(() => setAdCountdown(adCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [view, adCountdown]);

  // THE RANDOMIZER TRIGGER
  const triggerAd = () => {
    const randomAd =
      AD_CAMPAIGNS[Math.floor(Math.random() * AD_CAMPAIGNS.length)];
    setActiveAd(randomAd);
    setAdCountdown(randomAd.duration);
    setView("ad");
  };

  const handleClose = () => {
    setView("menu");
    setActiveAd(null);
    onClose();
  };

  useEffect(() => {
    const fetchCompleted = async () => {
      if (!isOpen) return;
      setIsCheckingSurveys(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("survey_responses")
          .select("survey_id")
          .eq("user_id", user.id);
        if (data) {
          setCompletedSurveyIds(data.map((row) => row.survey_id));
        }
      }
      setIsCheckingSurveys(false);
    };
    fetchCompleted();
  }, [isOpen]);

  const availableSurvey = SURVEYS.find(
    (s) => !completedSurveyIds.includes(s.id),
  );

  const isPollComplete = availableSurvey?.questions.every((q) => {
    const answer = answers[q.id];
    if (q.type === "checkbox") {
      return Array.isArray(answer) && answer.length > 0;
    } else if (q.type === "rank") {
      const rankObj = (
        typeof answer === "object" && !Array.isArray(answer) ? answer : {}
      ) as Record<string, string>;
      return Object.values(rankObj).every((v) => v !== "");
    } else {
      return typeof answer === "string" && answer.trim() !== "";
    }
  });

  const submitPoll = async () => {
    if (!availableSurvey || !isPollComplete) return;
    setIsSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("survey_responses").insert([
        {
          user_id: user.id,
          survey_id: availableSurvey.id,
          answers: answers,
        },
      ]);
    }

    setIsSubmitting(false);
    onReward(availableSurvey.reward);
    handleClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
      <Dialog.Backdrop backdropFilter="blur(8px)" bg="blackAlpha.600" />
      <Dialog.Positioner>
        <Dialog.Content
          p={6}
          textAlign="center"
          borderRadius="3xl"
          mx={4}
          bg="white"
          w="calc(100vw - 32px)"
          maxW="sm"
        >
          {/* ========================================== */}
          {/* VIEW 1: THE MAIN MENU */}
          {/* ========================================== */}
          {view === "menu" && (
            <>
              <Dialog.Header pt={2}>
                <Dialog.Title fontSize="2xl" fontWeight="900" color="gray.900">
                  Out of Swipes ⚡
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body pb={2}>
                <Text mb={6} color="gray.500" fontWeight="medium" fontSize="sm">
                  You've used your daily allowance! Refill your stamina to keep
                  discovering campus.
                </Text>

                <VStack gap={3} w="100%">
                  <Button
                    w="100%"
                    h="14"
                    borderRadius="xl"
                    bg="gray.900"
                    color="white"
                    _hover={{ bg: "gray.800", transform: "scale(0.98)" }}
                    onClick={triggerAd}
                  >
                    <Icon as={FaPlay} color="pink.400" mr={3} />
                    Watch Ad (+{ECONOMY.AD_REWARD} ⚡)
                  </Button>

                  <Button
                    w="100%"
                    h="14"
                    borderRadius="xl"
                    bg="gray.100"
                    color={availableSurvey ? "gray.800" : "gray.400"}
                    _hover={
                      availableSurvey
                        ? { bg: "gray.200", transform: "scale(0.98)" }
                        : {}
                    }
                    onClick={() => setView("poll")}
                    disabled={!availableSurvey || isCheckingSurveys}
                  >
                    <Icon
                      as={FaPoll}
                      color={availableSurvey ? "blue.400" : "gray.400"}
                      mr={3}
                    />
                    {/* Updated Reward logic */}
                    {isCheckingSurveys
                      ? "Checking Polls..."
                      : availableSurvey
                        ? `Take Campus Poll (+${availableSurvey.reward} ⚡)`
                        : "No more polls available"}
                  </Button>

                  <HStack
                    mt={4}
                    color="gray.400"
                    fontSize="xs"
                    fontWeight="bold"
                    justify="center"
                  >
                    <Icon as={FaClock} />
                    <Text>Free refill in {timeLeft}</Text>
                  </HStack>
                </VStack>
              </Dialog.Body>
            </>
          )}

          {/* ========================================== */}
          {/* VIEW 2: THE AD VIEWER */}
          {/* ========================================== */}
          {view === "ad" && activeAd && (
            <VStack gap={4}>
              <Text fontSize="lg" fontWeight="900">
                Sponsor Message
              </Text>

              <Box
                w="100%"
                h="250px"
                borderRadius="xl"
                overflow="hidden"
                position="relative"
                bg="gray.100"
              >
                {/* RENDER IMAGE */}
                {activeAd.type === "image" && (
                  <Image
                    src={activeAd.src}
                    objectFit="cover"
                    w="100%"
                    h="100%"
                  />
                )}

                {/* RENDER VIDEO */}
                {activeAd.type === "video" && (
                  <video
                    src={activeAd.src}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}

                {/* RENDER ADSENSE (Placeholder logic) */}
                {activeAd.type === "adsense" && (
                  <Flex
                    w="100%"
                    h="100%"
                    align="center"
                    justify="center"
                    direction="column"
                    bg="gray.50"
                  >
                    <Text color="gray.400" fontSize="sm">
                      Google AdSense Space
                    </Text>
                  </Flex>
                )}

                {/* OVERLAY TIMER */}
                <Flex
                  position="absolute"
                  top={2}
                  right={2}
                  bg="blackAlpha.700"
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {adCountdown > 0
                    ? `Reward in ${adCountdown}s`
                    : "Reward Unlocked!"}
                </Flex>
              </Box>

              {adCountdown > 0 ? (
                <Button
                  w="100%"
                  h="14"
                  borderRadius="xl"
                  bg="gray.200"
                  color="gray.400"
                  disabled
                >
                  <Spinner size="sm" mr={2} /> Please wait...
                </Button>
              ) : (
                <Button
                  w="100%"
                  h="14"
                  borderRadius="xl"
                  bgGradient="to-r"
                  gradientFrom="pink.400"
                  gradientTo="pink.500"
                  color="white"
                  // Inside the AD VIEWER VIEW where they click "Claim":
                  onClick={() => {
                    onReward(ECONOMY.AD_REWARD);
                    handleClose();
                  }}
                >
                  <Icon as={FaCheckCircle} mr={2} /> Claim 5 🔥
                </Button>
              )}
            </VStack>
          )}

          {/* ========================================== */}
          {/* VIEW 3: THE DYNAMIC POLL ENGINE */}
          {/* ========================================== */}
          {view === "poll" && availableSurvey && (
            <VStack
              gap={5}
              textAlign="left"
              w="100%"
              maxH="60vh"
              overflowY="auto"
              px={1}
              css={{ "&::-webkit-scrollbar": { display: "none" } }}
            >
              <Text
                fontSize="xl"
                fontWeight="900"
                textAlign="center"
                w="100%"
                position="sticky"
                top={0}
                bg="white"
                zIndex={2}
                py={2}
              >
                {availableSurvey.title}
              </Text>

              {availableSurvey.questions.map((q) => (
                <Box
                  w="100%"
                  key={q.id}
                  bg="gray.50"
                  p={4}
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Text fontSize="sm" fontWeight="bold" color="gray.800" mb={3}>
                    {q.text}
                  </Text>

                  {/* TYPE: TEXT */}
                  {q.type === "text" && (
                    <Input
                      bg="white"
                      borderRadius="xl"
                      value={String(
                        typeof answers[q.id] === "string" ? answers[q.id] : "",
                      )}
                      onChange={(e) =>
                        setAnswers({ ...answers, [q.id]: e.target.value })
                      }
                    />
                  )}

                  {/* TYPE: RADIO */}
                  {q.type === "radio" && (
                    <Flex wrap="wrap" gap={2}>
                      {q.options?.map((opt) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <Box
                            key={opt}
                            px={4}
                            py={2}
                            borderRadius="lg"
                            cursor="pointer"
                            fontSize="xs"
                            fontWeight="bold"
                            transition="all 0.2s"
                            bg={isSelected ? "pink.400" : "white"}
                            color={isSelected ? "white" : "gray.600"}
                            border="1px solid"
                            borderColor={isSelected ? "pink.400" : "gray.200"}
                            onClick={() =>
                              setAnswers({ ...answers, [q.id]: opt })
                            }
                          >
                            {opt}
                          </Box>
                        );
                      })}
                    </Flex>
                  )}

                  {/* TYPE: CHECKBOX */}
                  {q.type === "checkbox" && (
                    <Flex direction="column" gap={2}>
                      {q.options?.map((opt) => {
                        const currentSelections: string[] = (
                          Array.isArray(answers[q.id]) ? answers[q.id] : []
                        ) as string[];
                        const isSelected = currentSelections.includes(opt);
                        const isMaxedOut =
                          q.maxSelect &&
                          currentSelections.length >= q.maxSelect &&
                          !isSelected;

                        return (
                          <Flex
                            key={opt}
                            w="100%"
                            p={3}
                            borderRadius="xl"
                            cursor={isMaxedOut ? "not-allowed" : "pointer"}
                            bg={isSelected ? "blue.50" : "white"}
                            border="1px solid"
                            borderColor={isSelected ? "blue.400" : "gray.200"}
                            align="center"
                            transition="all 0.2s"
                            opacity={isMaxedOut ? 0.5 : 1}
                            onClick={() => {
                              if (isMaxedOut) return;
                              let newSelections = [...currentSelections];
                              if (isSelected)
                                newSelections = newSelections.filter(
                                  (item) => item !== opt,
                                );
                              else newSelections.push(opt);
                              setAnswers({ ...answers, [q.id]: newSelections });
                            }}
                          >
                            <Box
                              w={4}
                              h={4}
                              borderRadius="sm"
                              border="2px solid"
                              borderColor={isSelected ? "blue.500" : "gray.300"}
                              bg={isSelected ? "blue.500" : "transparent"}
                              mr={3}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {isSelected && (
                                <Icon
                                  as={FaCheckCircle}
                                  color="white"
                                  boxSize={3}
                                />
                              )}
                            </Box>
                            <Text
                              fontSize="xs"
                              fontWeight="bold"
                              color={isSelected ? "blue.900" : "gray.700"}
                            >
                              {opt}
                            </Text>
                          </Flex>
                        );
                      })}
                    </Flex>
                  )}

                  {/* TYPE: RANKING */}
                  {q.type === "rank" && (
                    <VStack gap={2} w="100%">
                      {q.options?.map((opt) => {
                        const rankState: Record<string, string> = (
                          typeof answers[q.id] === "object" &&
                          !Array.isArray(answers[q.id])
                            ? answers[q.id]
                            : {}
                        ) as Record<string, string>;
                        const currentRank = rankState[opt] || "";

                        return (
                          <Flex
                            key={opt}
                            w="100%"
                            justify="space-between"
                            align="center"
                            bg="white"
                            p={2}
                            borderRadius="xl"
                            border="1px solid"
                            borderColor="gray.200"
                          >
                            <Text
                              fontSize="xs"
                              fontWeight="bold"
                              color="gray.700"
                              w="60%"
                            >
                              {opt}
                            </Text>
                            <select
                              style={{
                                padding: "8px",
                                borderRadius: "8px",
                                border: "1px solid #E2E8F0",
                                fontSize: "12px",
                                fontWeight: "bold",
                                width: "35%",
                                backgroundColor: "#F7FAFC",
                              }}
                              value={currentRank}
                              onChange={(e) => {
                                const newRankState: Record<string, string> = {
                                  ...rankState,
                                  [opt]: e.target.value,
                                };
                                setAnswers({
                                  ...answers,
                                  [q.id]: newRankState,
                                });
                              }}
                            >
                              <option value="">Rank...</option>
                              <option value="1">1st Choice</option>
                              <option value="2">2nd Choice</option>
                              <option value="3">3rd Choice</option>
                              <option value="4">4th Choice</option>
                            </select>
                          </Flex>
                        );
                      })}
                    </VStack>
                  )}
                </Box>
              ))}

              <Button
                w="100%"
                h="14"
                borderRadius="xl"
                bg="blue.500"
                color="white"
                mt={4}
                flexShrink={0}
                mb={4}
                loading={isSubmitting}
                onClick={submitPoll}
              >
                Submit & Claim {availableSurvey.reward} 🔥
              </Button>
            </VStack>
          )}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
