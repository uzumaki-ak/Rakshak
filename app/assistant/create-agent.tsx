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

const CATEGORIES = [
  { key: "medicine", label: "Medicine", icon: "medical" },
  { key: "analysis", label: "Analysis", icon: "analytics" },
  { key: "assistance", label: "Assistance", icon: "help" },
  { key: "custom", label: "Custom", icon: "build" },
];

const INPUT_TYPES = [
  { key: "text", label: "Text", icon: "text" },
  { key: "image", label: "Image", icon: "image" },
  { key: "barcode", label: "Barcode", icon: "barcode" },
  { key: "file", label: "File", icon: "document" },
  { key: "mixed", label: "Mixed", icon: "options" },
];

export default function CreateAgentScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructions: "",
    category: "custom" as "medicine" | "analysis" | "assistance" | "custom",
    input_type: "text" as "text" | "image" | "barcode" | "file" | "mixed",
    output_type: "text" as "text" | "structured" | "medicine_form" | "report",
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateAgent = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Agent name is required");
      return;
    }

    if (!formData.instructions.trim()) {
      Alert.alert("Error", "Instructions are required");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }

    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError || !userData) {
        console.error("User not found:", userError);
        Alert.alert("Error", "User not found in database");
        return;
      }

      const { data, error } = await supabase
        .from("user_agents")
        .insert([
          {
            user_id: userData.id,
            name: formData.name.trim(),
            description: formData.description.trim(),
            category: formData.category,
            system_prompt: formData.instructions.trim(),
            input_type: formData.input_type,
            output_type: formData.output_type,
            icon: "build",
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      Alert.alert("Success", "AI Agent created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error creating agent:", error);
      Alert.alert("Error", "Failed to create agent");
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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="close" size={24} color={styles.secondary.color} />
          </TouchableOpacity>
          <Text style={styles.title}>Create AI Agent</Text>
          <TouchableOpacity
            onPress={handleCreateAgent}
            style={styles.saveButton}
            disabled={loading}
          >
            <Text style={styles.saveText}>
              {loading ? "Creating..." : "Create"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Agent Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateField("name", value)}
                placeholder="e.g., Medicine Expert"
                placeholderTextColor={styles.placeholder.color}
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateField("description", value)}
                placeholder="Describe what this agent does..."
                placeholderTextColor={styles.placeholder.color}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.optionsGrid}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.optionButton,
                      formData.category === category.key && [
                        styles.optionButtonActive,
                        { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
                      ],
                    ]}
                    onPress={() => updateField("category", category.key)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={20}
                      color={
                        formData.category === category.key
                          ? "white"
                          : styles.secondary.color
                      }
                    />
                    <Text
                      style={[
                        styles.optionText,
                        formData.category === category.key &&
                          styles.optionTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Input Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsRow}>
                  {INPUT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.optionButton,
                        styles.horizontalOption,
                        formData.input_type === type.key && [
                          styles.optionButtonActive,
                          { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
                        ],
                      ]}
                      onPress={() => updateField("input_type", type.key)}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={16}
                        color={
                          formData.input_type === type.key
                            ? "white"
                            : styles.secondary.color
                        }
                      />
                      <Text
                        style={[
                          styles.optionText,
                          formData.input_type === type.key &&
                            styles.optionTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions *</Text>
            <Text style={styles.sectionSubtitle}>
              Define how the AI should behave and respond
            </Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.largeTextArea]}
                value={formData.instructions}
                onChangeText={(value) => updateField("instructions", value)}
                placeholder="You are an expert in... Your role is to... Always remember to..."
                placeholderTextColor={styles.placeholder.color}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? "#000000" : "#ffffff",
    },
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000000" : "#ffffff",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#38383A" : "#e5e5e5",
    },
    backButton: {
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
    },
    saveButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    saveText: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#0A84FF" : "#007AFF",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#8E8E93" : "#666",
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? "#1C1C1E" : "#f5f5f5",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#e5e5e5",
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    largeTextArea: {
      minHeight: 120,
      textAlignVertical: "top",
    },
    optionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    optionsRow: {
      flexDirection: "row",
      gap: 8,
    },
    optionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: isDark ? "#1C1C1E" : "#f5f5f5",
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#e5e5e5",
    },
    horizontalOption: {
      minWidth: 100,
    },
    optionButtonActive: {
      borderColor: "transparent",
    },
    optionText: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
      fontWeight: "500",
    },
    optionTextActive: {
      color: "white",
    },
    secondary: {
      color: isDark ? "#8E8E93" : "#666",
    },
    placeholder: {
      color: isDark ? "#636366" : "#999",
    },
  });
