"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Image,
  Icon,
  Button,
  Spinner,
} from "@chakra-ui/react";
import {
  FaFire,
  FaTrophy,
  FaUser,
  FaCheckCircle,
  FaShareAlt,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaTrash,
  FaEye,
} from "react-icons/fa";
import { FiHome } from "react-icons/fi";
import { supabase } from "../../utils/supabase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareText, setShareText] = useState("Share Profile");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // We abstract this so we can call it to refresh the UI after changes
  const fetchMyProfile = async () => {
    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userData) {
      setProfile(userData);
      if (userData.elo_score > 0) {
        const { count } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("gender", userData.gender)
          .gt("elo_score", userData.elo_score);
        setRank((count || 0) + 1);
      } else {
        setRank(null);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMyProfile();
  }, []);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm(
      "Are you sure? This will permanently delete your profile and all your swipes. This cannot be undone.",
    );
    if (!isConfirmed) return;

    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Because we added Cascade Delete earlier, deleting the user wipes their swipes too!
      await supabase.from("users").delete().eq("id", user.id);
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  const handleToggleStatus = async () => {
    if (!profile) return;
    const isCurrentlySpectator = profile.elo_score === 0;

    if (isCurrentlySpectator) {
      // Trying to Join Ranking. Do they have a photo?
      if (!profile.photo_url) {
        alert(
          "You need to upload a photo to join the rankings! Tap your avatar above.",
        );
        fileInputRef.current?.click();
        return;
      }
      // They have a photo, set them to 1200
      setIsLoading(true);
      await supabase
        .from("users")
        .update({ elo_score: 1200 })
        .eq("id", profile.id);
      fetchMyProfile();
    } else {
      // Trying to hide (Become Spectator)
      const confirmHide = window.confirm(
        "Switching to Spectator Mode will hide you from the deck and reset your current rank. Continue?",
      );
      if (!confirmHide) return;
      setIsLoading(true);
      await supabase
        .from("users")
        .update({ elo_score: 0 })
        .eq("id", profile.id);
      fetchMyProfile();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profile) {
      setIsLoading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const newFileName = `${profile.id}-${Math.random()}.${fileExt}`;

      // ==========================================
      // 1. CLEANUP: Delete the old photo first!
      // ==========================================
      if (profile.photo_url && profile.photo_url.includes('supabase.co/storage')) {
        const oldFileName = profile.photo_url.split('/').pop();
        if (oldFileName) {
          const { error: deleteError } = await supabase.storage
            .from('profiles')
            .remove([oldFileName]);
          if (deleteError) console.error("Failed to delete old photo:", deleteError);
        }
      }

      // ==========================================
      // 2. UPLOAD: Save the new photo
      // ==========================================
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(newFileName, file);

      if (!uploadError) {
        const { data } = supabase.storage
          .from("profiles")
          .getPublicUrl(newFileName);
        
        // 3. Update the database with the new URL
        await supabase
          .from("users")
          .update({ photo_url: data.publicUrl })
          .eq("id", profile.id);
          
        fetchMyProfile(); // Refresh UI with new photo
      } else {
        setIsLoading(false);
        alert("Failed to upload photo.");
      }
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/leaderboard`;
    navigator.clipboard.writeText(
      `Check out my campus rank on Swipematch! ${url}`,
    );
    setShareText("Copied!");
    setTimeout(() => setShareText("Share Profile"), 2000);
  };

  // ==========================================
  // RENDER
  // ==========================================
  if (isLoading)
    return (
      <Flex h="100dvh" justify="center" align="center" bg="gray.50">
        <Spinner color="pink.400" size="xl" />
      </Flex>
    );
  if (!profile)
    return (
      <Flex h="100dvh" justify="center" align="center">
        <Text>Profile not found</Text>
      </Flex>
    );

  const isSpectator = profile.elo_score === 0;

  return (
    <Flex h="100dvh" w="100vw" bg="gray.50" direction="column" align="center">
      <Flex
        w="100%"
        maxW="md"
        h="100%"
        direction="column"
        bg="white"
        position="relative"
        pt={6}
      >
        {/* Hidden File Input for Avatar */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          style={{ display: "none" }}
        />

        {/* Status Banners */}
        {!profile.is_approved && !isSpectator && (
          <Box w="100%" bg="orange.100" p={2} textAlign="center">
            <Text fontSize="xs" fontWeight="bold" color="orange.800">
              <Icon as={FaExclamationTriangle} mr={2} /> Your profile is hidden
              and under review.
            </Text>
          </Box>
        )}

        {isSpectator && (
          <Box w="100%" bg="blue.50" p={2} textAlign="center">
            <Text fontSize="xs" fontWeight="bold" color="blue.800">
              <Icon as={FaEye} mr={2} /> Spectator Mode: You are not visible in
              the rankings.
            </Text>
          </Box>
        )}

        {/* Profile Info & Avatar */}
        <VStack gap={4} px={6} mt={6}>
          <Box
            position="relative"
            w="120px"
            h="120px"
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="md"
            bg="gray.100"
            cursor="pointer"
            onClick={() => fileInputRef.current?.click()}
            _hover={{ opacity: 0.9 }}
          >
            {profile.photo_url ? (
              <Image
                src={profile.photo_url}
                objectFit="cover"
                w="100%"
                h="100%"
              />
            ) : (
              <Flex w="100%" h="100%" align="center" justify="center">
                <Icon as={FaUser} boxSize={10} color="gray.300" />
              </Flex>
            )}
            <Flex
              position="absolute"
              bottom="0"
              w="100%"
              bg="blackAlpha.600"
              py={1}
              justify="center"
            >
              <Text fontSize="10px" color="white" fontWeight="bold">
                Tap to change
              </Text>
            </Flex>
          </Box>
          <Text fontSize="2xl" fontWeight="black" color="gray.900">
            {profile.name}
          </Text>
        </VStack>

        {/* Stats Row */}
        {!isSpectator && (
          <HStack w="100%" justify="space-evenly" mt={6} px={6}>
            <VStack
              bg="gray.50"
              p={4}
              borderRadius="2xl"
              flex={1}
              border="1px solid"
              borderColor="gray.100"
            >
              <Text fontSize="xs" color="gray.500" fontWeight="bold">
                Rank
              </Text>
              <Icon as={FaTrophy} color="orange.400" boxSize={6} my={1} />
              <Text fontSize="xl" fontWeight="900" color="gray.800">
                #{rank || "-"}
              </Text>
            </VStack>
            <VStack
              bg="gray.50"
              p={4}
              borderRadius="2xl"
              flex={1}
              border="1px solid"
              borderColor="gray.100"
            >
              <Text fontSize="xs" color="gray.500" fontWeight="bold">
                Elo Score
              </Text>
              <Icon as={FaFire} color="pink.400" boxSize={6} my={1} />
              <Text fontSize="xl" fontWeight="900" color="gray.800">
                {Math.round(profile.elo_score)}
              </Text>
            </VStack>
          </HStack>
        )}

        {/* Action Buttons (Scrollable so it doesn't overlap Bottom Nav) */}
        <VStack gap={3} mt={8} px={6} flex={1} overflowY="auto" pb={24}>
          {/* THE TOGGLE BUTTON */}
          {isSpectator ? (
            <Button
              w="100%"
              h="14"
              borderRadius="xl"
              bgGradient="to-r"
              gradientFrom="orange.400"
              gradientTo="orange.500"
              color="white"
              onClick={handleToggleStatus}
              boxShadow="md"
            >
              Join the Ranking 😎
            </Button>
          ) : (
            <Button
              w="100%"
              h="12"
              borderRadius="xl"
              variant="outline"
              color="gray.600"
              borderColor="gray.200"
              onClick={handleToggleStatus}
            >
              <Icon as={FaEye} mr={2} /> Hide me (Spectator Mode)
            </Button>
          )}

          {!isSpectator && (
            <Button
              w="100%"
              h="14"
              borderRadius="xl"
              bg="gray.900"
              color="white"
              onClick={handleShare}
            >
              <Icon as={FaShareAlt} mr={2} /> {shareText}
            </Button>
          )}

          <Button
            w="100%"
            h="14"
            borderRadius="xl"
            bgGradient="to-r"
            gradientFrom="pink.400"
            gradientTo="pink.500"
            color="white"
            onClick={() => router.push("/")}
          >
            Continue Swiping
          </Button>

          <Flex w="100%" justify="space-between" mt={6}>
            <Button
              variant="ghost"
              color="gray.500"
              onClick={handleLogout}
              _hover={{ bg: "transparent" }}
            >
              <Icon as={FaSignOutAlt} mr={2} /> Log Out
            </Button>
            <Button
              variant="ghost"
              color="red.500"
              onClick={handleDeleteAccount}
              _hover={{ bg: "transparent" }}
            >
              <Icon as={FaTrash} mr={2} /> Delete Account
            </Button>
          </Flex>
        </VStack>

        {/* Bottom Nav */}
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
          <VStack gap={1} color="pink.400" cursor="pointer">
            <Icon as={FaUser} boxSize={6} />
            <Text fontSize="10px" fontWeight="bold">
              Profile
            </Text>
          </VStack>
        </Flex>
      </Flex>
    </Flex>
  );
}