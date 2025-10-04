import { supabase } from "@/config/SupabaseConfig";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COMMON_SYMPTOMS = [
  "Headache",
  "Fever",
  "Cough",
  "Cold",
  "Sore throat",
  "Stomach pain",
  "Body ache",
  "Allergy",
  "Indigestion",
  "Nausea",
  "Diarrhea",
  "Constipation",
  "Insomnia",
];

export default function MedicineSuggesterAgent() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">(
    "mild"
  );
  const [loading, setLoading] = useState(false);

  const addSymptom = (symptom: string) => {
    if (symptoms.includes(symptom)) return;

    setSymptoms((prev) => (prev ? `${prev}, ${symptom}` : symptom));
  };

  const startSuggestionChat = async () => {
    if (!symptoms.trim()) {
      Alert.alert("Error", "Please describe your symptoms");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }

    setLoading(true);

    try {
      // Get user UUID
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userData) return;

      // Create new chat session
      const { data: session, error: sessionError } = await supabase
        .from("ai_chat_sessions")
        .insert([
          {
            user_id: userData.id,
            title: "Medicine Suggestions",
            session_type: "medicine_suggester",
            is_active: true,
            last_message_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create detailed symptom message
      const symptomDetails = `Symptoms: ${symptoms}\nDuration: ${
        duration || "Not specified"
      }\nSeverity: ${severity}`;

      const { error: messageError } = await supabase
        .from("chat_messages")
        .insert([
          {
            session_id: session.id,
            sender: "user",
            content: symptomDetails,
            message_type: "text",
            created_at: new Date().toISOString(),
          },
        ]);

      if (messageError) throw messageError;

      // Navigate to chat session
      router.replace(`/assistant/chat/${session.id}` as any);
    } catch (error) {
      console.error("Error starting suggestion chat:", error);
      Alert.alert("Error", "Failed to start chat session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Ionicons
              name="bandage"
              size={48}
              color={isDark ? "#FF6B6B" : "#FF3B30"}
            />
            <Text style={styles.title}>Medicine Suggester</Text>
            <Text style={styles.description}>
              Describe your symptoms to get suggestions for possible
              over-the-counter medicines and home remedies.
            </Text>
          </View>

          {/* Symptoms Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Describe Your Symptoms</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: isDark ? "#1C1C1E" : "white" },
              ]}
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder="e.g., headache, fever, cough, stomach pain..."
              placeholderTextColor={isDark ? "#636366" : "#999"}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Common Symptoms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Symptoms</Text>
            <View style={styles.symptomsGrid}>
              {COMMON_SYMPTOMS.map((symptom) => (
                <TouchableOpacity
                  key={symptom}
                  style={[
                    styles.symptomButton,
                    { backgroundColor: isDark ? "#1C1C1E" : "white" },
                  ]}
                  onPress={() => addSymptom(symptom)}
                >
                  <Text style={styles.symptomText}>{symptom}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details</Text>

            <Text style={styles.label}>
              How long have you had these symptoms?
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.smallInput,
                { backgroundColor: isDark ? "#1C1C1E" : "white" },
              ]}
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g., 2 days, 1 week..."
              placeholderTextColor={isDark ? "#636366" : "#999"}
            />

            <Text style={styles.label}>Severity</Text>
            <View style={styles.severityOptions}>
              {(["mild", "moderate", "severe"] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.severityButton,
                    { backgroundColor: isDark ? "#1C1C1E" : "white" },
                    severity === level && [
                      styles.severityButtonActive,
                      { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
                    ],
                  ]}
                  onPress={() => setSeverity(level)}
                >
                  <Text
                    style={[
                      styles.severityText,
                      severity === level && styles.severityTextActive,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor:
                  loading || !symptoms.trim()
                    ? isDark
                      ? "#38383A"
                      : "#e5e5e5"
                    : isDark
                    ? "#2D89FF"
                    : "#007AFF",
              },
            ]}
            onPress={startSuggestionChat}
            disabled={loading || !symptoms.trim()}
          >
            <Text style={styles.actionButtonText}>
              {loading ? "Starting Chat..." : "Get Medicine Suggestions"}
            </Text>
          </TouchableOpacity>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Ionicons name="warning" size={20} color="#FF9500" />
            <View style={styles.disclaimerContent}>
              <Text style={styles.disclaimerTitle}>Important Disclaimer</Text>
              <Text style={styles.disclaimerText}>
                This AI provides general information and suggestions only. It is
                not a substitute for professional medical advice. Always consult
                a healthcare provider for proper diagnosis and treatment.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    },
    scrollView: {
      flex: 1,
      padding: 20,
    },
    header: {
      alignItems: "center",
      paddingVertical: 24,
      marginBottom: 8,
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
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 12,
    },
    textInput: {
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#e5e5e5",
    },
    smallInput: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#8E8E93" : "#666",
      marginBottom: 8,
    },
    symptomsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    symptomButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#e5e5e5",
    },
    symptomText: {
      fontSize: 14,
      color: isDark ? "#FFFFFF" : "#1a1a1a",
    },
    severityOptions: {
      flexDirection: "row",
      gap: 8,
    },
    severityButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#e5e5e5",
    },
    severityButtonActive: {
      borderColor: "transparent",
    },
    severityText: {
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#8E8E93" : "#666",
    },
    severityTextActive: {
      color: "white",
    },
    actionButton: {
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 24,
    },
    actionButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    disclaimer: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 16,
      backgroundColor: isDark
        ? "rgba(255, 149, 0, 0.1)"
        : "rgba(255, 149, 0, 0.1)",
      borderRadius: 8,
      gap: 12,
    },
    disclaimerContent: {
      flex: 1,
    },
    disclaimerTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#FFB86B" : "#FF9500",
      marginBottom: 4,
    },
    disclaimerText: {
      fontSize: 12,
      color: isDark ? "#FFB86B" : "#FF9500",
      lineHeight: 16,
    },
  });
