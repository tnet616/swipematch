"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  Button,
  Input,
  NativeSelect,
  Image,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import {
  FaImage,
  FaCheckCircle,
  FaEye,
  FaExclamationTriangle,
} from "react-icons/fa";
import { supabase } from "../../utils/supabase";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
// Import the toaster from your Chakra UI snippets folder
import { toaster } from "@/components/ui/toaster";

export default function OnboardingPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkExistingUser = async () => {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        setAuthError(
          "Authentication failed or was cancelled. Please try again.",
        );
        setIsCheckingUser(false);
        return;
      }

      if (user.email && !user.email.endsWith("@student.funaab.edu.ng")) {
        await supabase.auth.signOut();
        setAuthError(
          "Exclusive to FUNAAB! You must use your @student.funaab.edu.ng email to join the rankings.",
        );
        setIsCheckingUser(false);
        return;
      }

      const { data: penaltyRecord } = await supabase
        .from("account_deletions")
        .select("deleted_at")
        .eq("user_id", user.id)
        .single();

      if (penaltyRecord) {
        const deletedDate = new Date(penaltyRecord.deleted_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (deletedDate > thirtyDaysAgo) {
          await supabase.auth.signOut();
          setAuthError(
            "Account recently deleted. To prevent system abuse, you must wait 30 days from your deletion date to rejoin the rankings.",
          );
          setIsCheckingUser(false);
          return;
        } else {
          await supabase
            .from("account_deletions")
            .delete()
            .eq("user_id", user.id);
        }
      }

      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();
      if (data) {
        router.push("/");
        return;
      }

      setIsCheckingUser(false);
    };
    checkExistingUser();
  }, [router]);

  const formik = useFormik({
    initialValues: {
      nickname: "",
      gender: "",
      isSpectator: false,
      file: null as File | null,
    },
    validate: (values) => {
      const errors: any = {};

      if (!values.nickname) {
        errors.nickname = "Nickname is required.";
      } else if (values.nickname.length > 15) {
        errors.nickname = "Nickname must be 15 characters or less.";
      }

      if (!values.gender) {
        errors.gender = "Please select a gender.";
      }

      if (!values.isSpectator && !values.file) {
        errors.file = "Please upload a photo, or check 'Spectator Mode'.";
      }

      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found. Please log in again.");

        let finalPhotoUrl = user.user_metadata.avatar_url;

        if (values.file && !values.isSpectator) {
          const fileExt = values.file.name.split(".").pop();
          const fileName = `${user.id}-${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("profiles")
            .upload(fileName, values.file);

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("profiles")
              .getPublicUrl(fileName);
            finalPhotoUrl = publicUrlData.publicUrl;
          } else {
            throw new Error("Failed to upload image. Please try again.");
          }
        }

        const { error: insertError } = await supabase.from("users").upsert(
          {
            id: user.id,
            name: values.nickname,
            gender: values.gender,
            photo_url: values.isSpectator ? null : finalPhotoUrl,
            elo_score: values.isSpectator ? 0 : 1200,
            swipe_count: 30,
            is_approved: true,
          },
          { onConflict: "id" },
        );

        if (insertError) throw insertError;

        localStorage.removeItem("guestSwipeCount");
        localStorage.removeItem("guestPendingVotes");

        setIsSuccess(true);
      } catch (error: any) {
        // TRIGGER CHAKRA UI TOAST ON ERROR
        toaster.create({
          title: "Profile Setup Failed",
          description:
            error.message || "Something went wrong while saving your profile.",
          type: "error",
          duration: 5000,
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      formik.setFieldValue("file", selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      formik.setFieldValue("isSpectator", false);
    }
  };

  if (isCheckingUser) {
    return (
      <Flex h="100dvh" justify="center" align="center" bg="white">
        <Spinner color="pink.400" size="xl" />
      </Flex>
    );
  }

  if (authError) {
    return (
      <Flex
        h="100dvh"
        w="100vw"
        bg="white"
        justify="center"
        align="center"
        px={6}
      >
        <VStack w="100%" maxW="md" gap={6} textAlign="center">
          <Box bg="red.50" p={5} borderRadius="full">
            <Icon as={FaExclamationTriangle} color="red.500" boxSize={12} />
          </Box>
          <VStack gap={2}>
            <Text fontSize="2xl" fontWeight="900" color="gray.900">
              Access Denied
            </Text>
            <Text color="gray.500" fontSize="sm" lineHeight="1.6" px={4}>
              {authError}
            </Text>
          </VStack>
          <Button
            w="100%"
            h="14"
            borderRadius="xl"
            bg="gray.900"
            color="white"
            fontWeight="bold"
            mt={4}
            _hover={{ opacity: 0.9 }}
            onClick={() => router.push("/")}
          >
            Go Back & Try Again
          </Button>
        </VStack>
      </Flex>
    );
  }

  if (isSuccess) {
    return (
      <Flex
        h="100dvh"
        w="100vw"
        bg="white"
        justify="center"
        align="center"
        px={6}
      >
        <VStack w="100%" maxW="md" gap={8} textAlign="center">
          <Icon as={FaCheckCircle} color="pink.400" boxSize={20} />
          <VStack gap={2}>
            <Text fontSize="3xl" fontWeight="900" color="gray.900">
              You're in!
            </Text>
            <Text color="gray.500" fontSize="sm">
              {formik.values.isSpectator
                ? "You are in Spectator Mode. Go discover campus!"
                : "Your profile is live in the rankings."}
            </Text>
          </VStack>
          <Button
            w="100%"
            h="14"
            borderRadius="xl"
            bgGradient="to-r"
            gradientFrom="pink.400"
            gradientTo="pink.500"
            color="white"
            fontSize="lg"
            fontWeight="bold"
            mt={4}
            _hover={{ opacity: 0.9 }}
            onClick={() => router.push("/")}
          >
            Continue Swiping 🤩
          </Button>
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex
      h="100dvh"
      w="100vw"
      bg="white"
      justify="center"
      pt={10}
      px={6}
      overflowY="auto"
    >
      <form
        onSubmit={formik.handleSubmit}
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        <VStack w="100%" maxW="md" gap={6} pb={10}>
          <Text fontSize="2xl" fontWeight="900" color="gray.900">
            Setup Profile
          </Text>

          {formik.submitCount > 0 && formik.errors.file && (
            <Text color="red.500" fontSize="sm" fontWeight="500">
              {formik.errors.file as string}
            </Text>
          )}

          <Box
            w="200px"
            h="200px"
            bg="gray.50"
            border="2px dashed"
            borderColor={
              formik.errors.file && formik.submitCount > 0
                ? "red.400"
                : "gray.300"
            }
            borderRadius="2xl"
            overflow="hidden"
            position="relative"
            cursor={formik.values.isSpectator ? "not-allowed" : "pointer"}
            onClick={() =>
              !formik.values.isSpectator && fileInputRef.current?.click()
            }
            opacity={formik.values.isSpectator ? 0.5 : 1}
          >
            {previewUrl && !formik.values.isSpectator ? (
              <Image
                src={previewUrl}
                alt="Preview"
                objectFit="cover"
                w="100%"
                h="100%"
              />
            ) : (
              <Flex
                w="100%"
                h="100%"
                direction="column"
                justify="center"
                align="center"
                color="gray.400"
              >
                <Icon
                  as={formik.values.isSpectator ? FaEye : FaImage}
                  boxSize={8}
                  mb={2}
                />
                <Text fontSize="xs" fontWeight="bold">
                  {formik.values.isSpectator
                    ? "Spectator Mode"
                    : "Tap to upload photo"}
                </Text>
              </Flex>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </Box>

          <Flex
            w="100%"
            justify="center"
            align="center"
            gap={3}
            mt={-2}
            cursor="pointer"
            onClick={() =>
              formik.setFieldValue("isSpectator", !formik.values.isSpectator)
            }
          >
            <Box
              w="5"
              h="5"
              border="2px solid"
              borderColor={formik.values.isSpectator ? "pink.400" : "gray.300"}
              borderRadius="md"
              bg={formik.values.isSpectator ? "pink.400" : "transparent"}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {formik.values.isSpectator && (
                <Icon as={FaCheckCircle} color="white" boxSize={3} />
              )}
            </Box>
            <Text fontSize="sm" fontWeight="bold" color="gray.600">
              I just want to spectate (No photo)
            </Text>
          </Flex>

          <VStack w="100%" gap={4} mt={2} align="stretch">
            <Box>
              <Input
                id="nickname"
                name="nickname"
                placeholder="Your nickname"
                size="lg"
                bg="white"
                borderColor={
                  formik.touched.nickname && formik.errors.nickname
                    ? "red.400"
                    : "gray.300"
                }
                borderRadius="xl"
                value={formik.values.nickname}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.nickname && formik.errors.nickname ? (
                <Text
                  color="red.500"
                  fontSize="xs"
                  mt={1}
                  px={2}
                  fontWeight="500"
                >
                  {formik.errors.nickname as string}
                </Text>
              ) : null}
            </Box>

            <Box>
              <NativeSelect.Root>
                <NativeSelect.Field
                  id="gender"
                  name="gender"
                  placeholder="Gender"
                  value={formik.values.gender}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  bg="white"
                  borderColor={
                    formik.touched.gender && formik.errors.gender
                      ? "red.400"
                      : "gray.300"
                  }
                  borderRadius="xl"
                  h="12"
                  px={4}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
              {formik.touched.gender && formik.errors.gender ? (
                <Text
                  color="red.500"
                  fontSize="xs"
                  mt={1}
                  px={2}
                  fontWeight="500"
                >
                  {formik.errors.gender as string}
                </Text>
              ) : null}
            </Box>
          </VStack>

          <Button
            type="submit"
            w="100%"
            h="14"
            borderRadius="xl"
            bgGradient="to-r"
            gradientFrom="orange.400"
            gradientTo="orange.500"
            color="white"
            fontSize="lg"
            fontWeight="bold"
            mt={4}
            loading={formik.isSubmitting}
          >
            Save Profile
          </Button>
        </VStack>
      </form>
    </Flex>
  );
}
