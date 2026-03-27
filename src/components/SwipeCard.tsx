"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Box, Text, Flex, Icon } from "@chakra-ui/react";
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
  profile: { id: string; name: string; photoUrl: string | null };
  onSwipe: (id: string, action: "fire" | "pass") => void;
  isTopCard: boolean;
}

export interface SwipeCardHandle {
  triggerSwipe: (direction: "fire" | "pass") => void;
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  ({ profile, onSwipe, isTopCard }, ref) => {
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
        try { localStorage.setItem("hasSeenSwipeTutorial", "true"); } catch {}
      }
    };

    const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
    ) => {
      const swipeThreshold = 100;
      if (info.offset.x > swipeThreshold) {
        controls
          .start({ x: 500, opacity: 0, transition: { duration: 0.25, ease: "easeOut" } })
          .then(() => onSwipe(profile.id, "fire"));
      } else if (info.offset.x < -swipeThreshold) {
        controls
          .start({ x: -500, opacity: 0, transition: { duration: 0.25, ease: "easeOut" } })
          .then(() => onSwipe(profile.id, "pass"));
      } else {
        controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } });
      }
    };

    // FIX: Clean, foolproof avatar generation! If photo is empty, it makes a cool initial-based image instantly.
    const safeImageSrc = profile.photoUrl && profile.photoUrl.trim() !== ""
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
        <Box w="100%" h="100%" borderRadius="3xl" overflow="hidden" bg="white" boxShadow="0px 10px 40px rgba(0,0,0,0.15)" border="1px solid" borderColor="gray.100" position="relative">
          <Box h="80%" w="100%" position="relative" bg="gray.100">
            <AnimatePresence>
              {showTutorial && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", top: "50%", left: "50%", zIndex: 20, pointerEvents: "none" }}>
                  <motion.div initial={{ x: 0, y: 0 }} animate={{ x: [0, 80, 0, -80, 0], rotate: [-15, 0, -15, -30, -15] }} transition={{ duration: 2.5, ease: "easeInOut", times: [0, 0.25, 0.5, 0.75, 1] }} onAnimationComplete={dismissTutorial}>
                    <Box bg="blackAlpha.600" p={4} borderRadius="full" boxShadow="xl" backdropFilter="blur(4px)" transform="translate(-50%, -50%)">
                      <Icon as={FaRegHandPointer} boxSize={8} color="white" />
                    </Box>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div style={{ opacity: fireOpacity, position: "absolute", top: "40px", left: "30px", zIndex: 10, transform: "rotate(-15deg)" }}>
              <Box border="4px solid" borderColor="#DD6B20" borderRadius="md" px={4} py={1} bg="whiteAlpha.400" backdropFilter="blur(2px)">
                <Text color="#DD6B20" fontSize="4xl" fontWeight="900" letterSpacing="widest">FIRE 🔥</Text>
              </Box>
            </motion.div>

            <motion.div style={{ opacity: passOpacity, position: "absolute", top: "40px", right: "30px", zIndex: 10, transform: "rotate(15deg)" }}>
              <Box border="4px solid" borderColor="#E53E3E" borderRadius="md" px={4} py={1} bg="whiteAlpha.400" backdropFilter="blur(2px)">
                <Text color="#E53E3E" fontSize="4xl" fontWeight="900" letterSpacing="widest">PASS ❌</Text>
              </Box>
            </motion.div>

            <img
              src={safeImageSrc}
              alt={profile.name}
              draggable="false"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              loading={isTopCard ? "eager" : "lazy"} 
              onError={(e) => { 
                // Final safety net just in case the provided image URL is broken
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=500`; 
              }}
            />
          </Box>
          <Flex p={5} h="20%" align="center" bg="white">
            <Text fontSize="3xl" fontWeight="900" color="black">{profile.name}</Text>
          </Flex>
        </Box>
      </motion.div>
    );
  },
);

SwipeCard.displayName = "SwipeCard";