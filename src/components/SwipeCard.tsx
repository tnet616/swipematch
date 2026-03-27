"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Box, Text, Flex, Icon, Image, Badge } from "@chakra-ui/react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  useAnimation,
  PanInfo,
} from "framer-motion";
import { FaRegHandPointer } from "react-icons/fa";

interface SwipeCardProps {
  profile: {
    id: string;
    name: string;
    photoUrl: string | null;
    isAd?: boolean;
  };
  onSwipe: (id: string, action: "fire" | "pass") => void;
  isTopCard: boolean;
  canSwipe: () => boolean; // NEW: Function to check if dragging is allowed
}

export interface SwipeCardHandle {
  triggerSwipe: (direction: "fire" | "pass") => void;
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  ({ profile, onSwipe, isTopCard, canSwipe }, ref) => {
    const x = useMotionValue(0);
    const controls = useAnimation();
    const [showTutorial, setShowTutorial] = useState(false);

    const rotate = useTransform(x, [-200, 200], [-10, 10]);

    // FIRE label: appears when swiping RIGHT
    const fireOpacity = useTransform(x, [0, 100], [0, 1]);
    // PASS label: appears when swiping LEFT
    const passOpacity = useTransform(x, [0, -100], [0, 1]);

    useImperativeHandle(ref, () => ({
      triggerSwipe: async (direction: "fire" | "pass") => {
        const targetX = direction === "fire" ? 500 : -500;
        await controls.start({
          x: targetX,
          opacity: 0,
          transition: { duration: 0.3, ease: "easeOut" },
        });
        onSwipe(profile.id, direction);
      },
    }));

    useEffect(() => {
      if (isTopCard) {
        try {
          const hasSeen = localStorage.getItem("hasSeenSwipeTutorial");
          if (!hasSeen) setShowTutorial(true);
        } catch {}
      }
    }, [isTopCard]);

    const dismissTutorial = () => {
      if (showTutorial) {
        setShowTutorial(false);
        try {
          localStorage.setItem("hasSeenSwipeTutorial", "true");
        } catch {}
      }
    };

    const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
    ) => {
      const swipeThreshold = 100;

      // NEW: Stop the swipe if they are out of swipes
      if (Math.abs(info.offset.x) > swipeThreshold) {
        if (!canSwipe()) {
          // Snap back immediately and don't trigger onSwipe
          controls.start({
            x: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 20 },
          });
          return;
        }
      }

      if (info.offset.x > swipeThreshold) {
        controls
          .start({
            x: 500,
            opacity: 0,
            transition: { duration: 0.25, ease: "easeOut" },
          })
          .then(() => onSwipe(profile.id, "fire"));
      } else if (info.offset.x < -swipeThreshold) {
        controls
          .start({
            x: -500,
            opacity: 0,
            transition: { duration: 0.25, ease: "easeOut" },
          })
          .then(() => onSwipe(profile.id, "pass"));
      } else {
        controls.start({
          x: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 300, damping: 20 },
        });
      }
    };

    const safeImageSrc =
      profile.photoUrl && profile.photoUrl.trim() !== ""
        ? profile.photoUrl
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=500`;

    return (
      <motion.div
        style={{
          x,
          rotate,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          cursor: isTopCard ? "grab" : "auto",
          willChange: "transform",
        }}
        animate={controls}
        drag={isTopCard ? "x" : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.6}
        onDragStart={dismissTutorial}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
      >
        <Box
          w="100%"
          h="100%"
          borderRadius="26px"
          overflow="hidden"
          bg="white"
          position="relative"
          transition="box-shadow 0.2s"
        >
          <Box h="100%" w="100%" position="relative" bg="gray.100">
            <AnimatePresence>
              {showTutorial && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    zIndex: 20,
                    pointerEvents: "none",
                  }}
                >
                  <motion.div
                    initial={{ x: 0, y: 0 }}
                    animate={{
                      x: [0, 80, 0, -80, 0],
                      rotate: [-15, 0, -15, -30, -15],
                    }}
                    transition={{
                      duration: 2.5,
                      ease: "easeInOut",
                      times: [0, 0.25, 0.5, 0.75, 1],
                    }}
                    onAnimationComplete={dismissTutorial}
                  >
                    <Box
                      bg="blackAlpha.700"
                      p={5}
                      borderRadius="full"
                      backdropFilter="blur(8px)"
                      transform="translate(-50%, -50%)"
                      boxShadow="lg"
                    >
                      <Icon as={FaRegHandPointer} boxSize={8} color="white" />
                    </Box>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FIRE Stamp */}
            <motion.div
              style={{
                opacity: fireOpacity,
                position: "absolute",
                top: "50px",
                left: "30px",
                zIndex: 10,
                transform: "rotate(-15deg)",
                pointerEvents: "none", // Ensure stamps don't block drags
              }}
            >
              <Box
                border="6px solid"
                borderColor="orange.400"
                borderRadius="lg"
                px={4}
                py={2}
                bg="transparent"
              >
                <Text
                  color="orange.400"
                  fontSize="4xl"
                  fontWeight="900"
                  letterSpacing="widest"
                  textTransform="uppercase"
                >
                  FIRE 🔥
                </Text>
              </Box>
            </motion.div>

            {/* PASS Stamp */}
            <motion.div
              style={{
                opacity: passOpacity,
                position: "absolute",
                top: "50px",
                right: "30px",
                zIndex: 10,
                transform: "rotate(15deg)",
                pointerEvents: "none",
              }}
            >
              <Box
                border="6px solid"
                borderColor="red.500"
                borderRadius="lg"
                px={4}
                py={2}
                bg="transparent"
              >
                <Text
                  color="red.500"
                  fontSize="4xl"
                  fontWeight="900"
                  letterSpacing="widest"
                  textTransform="uppercase"
                >
                  PASS ❌
                </Text>
              </Box>
            </motion.div>

            <Image
              src={safeImageSrc}
              alt={profile.isAd ? "Sponsored Content" : profile.name}
              draggable="false"
              w="100%"
              h="100%"
              objectFit="cover"
              loading={isTopCard ? "eager" : "lazy"}
              // IMAGE PROTECTION: Prevent saving/dragging on mobile and desktop
              onContextMenu={(e) => e.preventDefault()}
              userSelect="none"
              style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=500`;
              }}
            />

            {/* Gradient Overlay for Text Readability */}
            <Box
              position="absolute"
              bottom="0"
              left="0"
              w="100%"
              h="40%"
              bgGradient="linear(to-t, blackAlpha.900, transparent)"
              pointerEvents="none"
            />
          </Box>

          {/* User Info Container */}
          <Flex
            position="absolute"
            bottom="20px"
            left="20px"
            w="100%"
            maxW="300px"
            direction="column"
            align="flex-start"
            pointerEvents="none"
          >
            {/* CONDITIONAL RENDER based on isAd */}
            {profile.isAd ? (
              <Badge
                variant="solid"
                bg="grey"
                color="dark"
                fontFamily="body"
                fontSize="sm"
              >
                Sponsored
              </Badge>
            ) : (
              <Text
                color="white"
                fontFamily="heading"
                fontSize="32px"
                fontWeight="800"
                lineHeight="1"
                truncate
              >
                {profile.name}
              </Text>
            )}
          </Flex>
        </Box>
      </motion.div>
    );
  },
);

SwipeCard.displayName = "SwipeCard";
