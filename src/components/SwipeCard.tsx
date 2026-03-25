'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Flex, Icon } from '@chakra-ui/react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { FaRegHandPointer } from 'react-icons/fa';

interface SwipeCardProps {
  profile: { id: string; name: string; photoUrl: string };
  onSwipe: (id: string, action: 'fire' | 'pass') => void;
  isTopCard: boolean;
}

export const SwipeCard = ({ profile, onSwipe, isTopCard }: SwipeCardProps) => {
  const x = useMotionValue(0);
  
  // Smart Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);

  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const fireOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [0, -100], [0, 1]);

  // SMART LOGIC: Only show if it's the top card AND they haven't seen it before
  useEffect(() => {
    if (isTopCard) {
      const hasSeen = localStorage.getItem('hasSeenSwipeTutorial');
      if (!hasSeen) {
        setShowTutorial(true);
      }
    }
  }, [isTopCard]);

  const handleDragStart = () => {
    // If they touch the card, kill the tutorial instantly and save it
    if (showTutorial) {
      setShowTutorial(false);
      localStorage.setItem('hasSeenSwipeTutorial', 'true');
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      onSwipe(profile.id, 'fire');
    } else if (info.offset.x < -swipeThreshold) {
      onSwipe(profile.id, 'pass');
    }
  };

  const safeImageSrc = (profile.photoUrl && profile.photoUrl.trim() !== '') 
    ? profile.photoUrl 
    : 'https://images.unsplash.com/photo-1531123897727-8f129e1bfca8?w=500&q=80';

  return (
    <motion.div
      style={{
        x, rotate, opacity, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        cursor: isTopCard ? 'grab' : 'auto',
      }}
      drag={isTopCard ? 'x' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.6}
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      <Box
        w="100%" h="100%" borderRadius="3xl" overflow="hidden" bg="white"
        boxShadow="0px 10px 40px rgba(0,0,0,0.15)" border="1px solid" borderColor="gray.100" position="relative"
      >
        <Box h="80%" w="100%" position="relative" bg="gray.100">
          
          {/* ========================================== */}
          {/* THE SMART ONE-TIME TUTORIAL */}
          {/* ========================================== */}
          <AnimatePresence>
            {showTutorial && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 20, pointerEvents: 'none' }}
              >
                {/* Hand slides right, then left, then hides */}
                <motion.div
                  initial={{ x: 0, y: 0 }}
                  animate={{ 
                    x: [0, 80, 0, -80, 0], 
                    rotate: [-15, 0, -15, -30, -15] 
                  }}
                  transition={{ 
                    duration: 2.5, 
                    ease: "easeInOut",
                    times: [0, 0.25, 0.5, 0.75, 1], // Controls pacing
                  }}
                  onAnimationComplete={() => {
                    setShowTutorial(false);
                    localStorage.setItem('hasSeenSwipeTutorial', 'true');
                  }}
                >
                  <Box bg="blackAlpha.600" p={4} borderRadius="full" boxShadow="xl" backdropFilter="blur(4px)" transform="translate(-50%, -50%)">
                    <Icon as={FaRegHandPointer} boxSize={8} color="white" />
                  </Box>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div style={{ opacity: fireOpacity, position: 'absolute', top: '40px', left: '30px', zIndex: 10, transform: 'rotate(-15deg)' }}>
            <Box border="4px solid" borderColor="#DD6B20" borderRadius="md" px={4} py={1} bg="whiteAlpha.400" backdropFilter="blur(2px)">
              <Text color="#DD6B20" fontSize="4xl" fontWeight="900" letterSpacing="widest">FIRE 🔥</Text>
            </Box>
          </motion.div>

          <motion.div style={{ opacity: passOpacity, position: 'absolute', top: '40px', right: '30px', zIndex: 10, transform: 'rotate(15deg)' }}>
            <Box border="4px solid" borderColor="#E53E3E" borderRadius="md" px={4} py={1} bg="whiteAlpha.400" backdropFilter="blur(2px)">
              <Text color="#E53E3E" fontSize="4xl" fontWeight="900" letterSpacing="widest">PASS ❌</Text>
            </Box>
          </motion.div>

          <img
            src={safeImageSrc} alt={profile.name} draggable="false"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1531123897727-8f129e1bfca8?w=500&q=80'; }}
          />
        </Box>
        
        <Flex p={5} h="20%" align="center" bg="white">
          <Text fontSize="3xl" fontWeight="900" color="black">{profile.name}</Text>
        </Flex>
      </Box>
    </motion.div>
  );
};