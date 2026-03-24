"use client";

import { Box, Image, Text, Flex } from "@chakra-ui/react";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface SwipeCardProps {
  // 1. Changed to camelCase to match what page.tsx is passing
  profile: { id: string; name: string; photoUrl: string };
  onSwipe: (id: string, action: "fire" | "pass") => void;
  isTopCard: boolean;
}

export const SwipeCard = ({ profile, onSwipe, isTopCard }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      onSwipe(profile.id, "fire");
    } else if (info.offset.x < -swipeThreshold) {
      onSwipe(profile.id, "pass");
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        cursor: isTopCard ? "grab" : "auto",
      }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
    >
      <Box
        w="100%"
        h="100%"
        borderRadius="3xl"
        overflow="hidden"
        bg="white"
        boxShadow="0px 10px 40px rgba(0,0,0,0.15)"
        border="1px solid"
        borderColor="gray.100"
      >
        <Box h="80%" w="100%" position="relative" bg="gray.100">
          <Image
            // 2. Updated to use the camelCase property
            src={
              profile.photoUrl ||
              "https://images.unsplash.com/photo-1531123897727-8f129e1bfca8?w=500&q=80"
            }
            alt={profile.name}
            objectFit="cover"
            w="100%"
            h="100%"
            draggable="false"
          />
        </Box>
        <Flex p={5} h="20%" align="center" bg="white">
          <Text fontSize="3xl" fontWeight="900" color="black">
            {profile.name}
          </Text>
        </Flex>
      </Box>
    </motion.div>
  );
};
