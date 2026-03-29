import { supabase } from "@/config/SupabaseConfig";
import { useAuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MedicineTellerAgent() {
  const { user } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "We need access to your photos to upload medicine images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
       mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await processMedicineImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "We need camera access to take photos of medicines."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await processMedicineImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const processMedicineImage = async (uri: string) => {
    if (!user) return;

    setUploading(true);

    try {
      // Create new chat session
      const { data: session, error: sessionError } = await supabase
        .from("ai_chat_sessions")
        .insert([
          {
            user_id: user.id,
            title: "Medicine Identification",
            session_type: "medicine_teller",
            is_active: true,
            last_message_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Convert image to base64 for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase storage
      const fileName = `medicine-${session.id}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("rak-ai")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("rak-ai").getPublicUrl(fileName);

      // Create message with image
      const { error: messageError } = await supabase
        .from("chat_messages")
        .insert([
          {
            session_id: session.id,
            sender: "user",
            content:
              "Please identify this medicine and tell me about its uses, dosage, and precautions.",
            message_type: "image",
            attachments: [publicUrl],
            created_at: new Date().toISOString(),
          },
        ]);

      if (messageError) throw messageError;

      // Navigate to chat session
      router.replace(`/assistant/chat/${session.id}` as any);
    } catch (error) {
      console.error("Error processing medicine image:", error);
      Alert.alert("Error", "Failed to process medicine image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons
            name="medical"
            size={48}
            color={isDark ? "#5FD0D8" : "#007AFF"}
          />
          <Text style={styles.title}>Medicine Identifier</Text>
          <Text style={styles.description}>
            Upload a clear image of your medicine to get detailed information
            about its uses, dosage, side effects, and precautions.
          </Text>
        </View>

        <View style={styles.options}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              { backgroundColor: isDark ? "#1C1C1E" : "white" },
            ]}
            onPress={takePhoto}
            disabled={uploading}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
              ]}
            >
              <Ionicons name="camera" size={24} color="white" />
            </View>
            <Text style={styles.optionTitle}>Take Photo</Text>
            <Text style={styles.optionDescription}>
              Use your camera to capture medicine packaging or pills
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              { backgroundColor: isDark ? "#1C1C1E" : "white" },
            ]}
            onPress={pickImage}
            disabled={uploading}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: isDark ? "#34C759" : "#32D74B" },
              ]}
            >
              <Ionicons name="image" size={24} color="white" />
            </View>
            <Text style={styles.optionTitle}>Choose from Gallery</Text>
            <Text style={styles.optionDescription}>
              Select an existing photo of your medicine
            </Text>
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={styles.uploading}>
            <Text style={styles.uploadingText}>
              Processing medicine image...
            </Text>
          </View>
        )}

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips for best results:</Text>
          <View style={styles.tipItem}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={isDark ? "#34C759" : "#32D74B"}
            />
            <Text style={styles.tipText}>Ensure good lighting</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={isDark ? "#34C759" : "#32D74B"}
            />
            <Text style={styles.tipText}>Focus on text and branding</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={isDark ? "#34C759" : "#32D74B"}
            />
            <Text style={styles.tipText}>Include expiry date if visible</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? "#050507" : "#fbfbfc",
    },
    container: {
      flex: 1,
      padding: 20,
    },
    header: {
      alignItems: "center",
      paddingVertical: 32,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginTop: 16,
      marginBottom: 8,
      textAlign: "center",
    },
    description: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#666",
      textAlign: "center",
      lineHeight: 22,
    },
    options: {
      gap: 16,
      marginBottom: 32,
    },
    optionCard: {
      padding: 20,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
      lineHeight: 18,
    },
    uploading: {
      alignItems: "center",
      padding: 16,
    },
    uploadingText: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
    },
    tips: {
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
      padding: 16,
      borderRadius: 8,
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 12,
    },
    tipItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    tipText: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
      marginLeft: 8,
    },
  });
