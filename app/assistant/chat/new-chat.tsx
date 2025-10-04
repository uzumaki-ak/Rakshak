import { supabase } from "@/config/SupabaseConfig";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PREDEFINED_AGENT_CONFIGS = {
  "medicine-teller": {
    name: "Medicine Identifier",
    description: "Upload a medicine image to get detailed information",
    icon: "medical",
    inputType: "image" as const,
    sessionType: "medicine-teller",
  },
  "medicine-suggester": {
    name: "Medicine Suggester",
    description: "Describe your symptoms for medicine suggestions",
    icon: "bandage",
    inputType: "text" as const,
    sessionType: "medicine-suggester",
  },
  "barcode-inspector": {
    name: "Barcode Scanner",
    description: "Scan barcode or upload barcode image",
    icon: "barcode",
    inputType: "barcode" as const,
    sessionType: "barcode-inspector",
  },
  "report-analyzer": {
    name: "Report Analyzer",
    description: "Upload lab reports for analysis",
    icon: "document",
    inputType: "file" as const,
    sessionType: "report-analyzer",
  },
  "drug-interaction": {
    name: "Drug Interaction Checker",
    description: "Check interactions between multiple medicines",
    icon: "warning",
    inputType: "text" as const,
    sessionType: "general",
  },
  "prescription-helper": {
    name: "Prescription Helper",
    description: "Get help with prescription information",
    icon: "medkit",
    inputType: "text" as const,
    sessionType: "general",
  },
};

export default function NewChatScreen() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const agentType = params.agentType as string;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [loading, setLoading] = useState(false);
  const [fetchingAgent, setFetchingAgent] = useState(true);
  const [agentConfig, setAgentConfig] = useState<any>(null);

  useEffect(() => {
    loadAgentConfig();
  }, [agentType]);

  const loadAgentConfig = async () => {
    if (!agentType) {
      Alert.alert("Error", "Agent type not specified");
      router.back();
      return;
    }

    // Check if it's a predefined agent
    if (
      PREDEFINED_AGENT_CONFIGS[
        agentType as keyof typeof PREDEFINED_AGENT_CONFIGS
      ]
    ) {
      setAgentConfig(
        PREDEFINED_AGENT_CONFIGS[
          agentType as keyof typeof PREDEFINED_AGENT_CONFIGS
        ]
      );
      setFetchingAgent(false);
      return;
    }

    // Otherwise, fetch custom agent from database
    try {
      if (!user) {
        Alert.alert("Error", "User not found");
        router.back();
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userData) {
        Alert.alert("Error", "User not found");
        router.back();
        return;
      }

      const { data: customAgent, error } = await supabase
        .from("user_agents")
        .select("*")
        .eq("id", agentType)
        .eq("user_id", userData.id)
        .single();

      if (error || !customAgent) {
        console.error("Custom agent not found:", error);
        Alert.alert("Error", "Agent not found");
        router.back();
        return;
      }

      // Transform custom agent to config format
      setAgentConfig({
        name: customAgent.name,
        description: customAgent.description || "",
        icon: customAgent.icon || "build",
        inputType: customAgent.input_type || "text",
        sessionType: "custom",
        systemPrompt: customAgent.system_prompt,
        agentId: customAgent.id,
      });
      setFetchingAgent(false);
    } catch (error) {
      console.error("Error loading custom agent:", error);
      Alert.alert("Error", "Failed to load agent");
      router.back();
    }
  };

  const createChatSession = async (
    initialMessage?: string,
    attachments?: string[]
  ) => {
    if (!user || !agentConfig) return;

    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError || !userData) {
        console.error("User not found:", userError);
        return;
      }

      // Use sessionType for the session type field
      const sessionType = agentConfig.sessionType || agentType;

      const { data: session, error: sessionError } = await supabase
        .from("ai_chat_sessions")
        .insert([
          {
            user_id: userData.id,
            title: agentConfig.name,
            session_type: sessionType,
            context_data: {
              agent_type: agentType,
              agent_id: agentConfig.agentId,
              system_prompt: agentConfig.systemPrompt,
            },
            is_active: true,
            last_message_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      if (initialMessage) {
        const { error: messageError } = await supabase
          .from("chat_messages")
          .insert([
            {
              session_id: session.id,
              sender: "user",
              content: initialMessage,
              message_type: "text",
              attachments: attachments,
              created_at: new Date().toISOString(),
            },
          ]);

        if (messageError) throw messageError;
      }

      router.replace(`/assistant/chat/${session.id}` as any);
    } catch (error) {
      console.error("Error creating chat session:", error);
      Alert.alert("Error", "Failed to create chat session");
    } finally {
      setLoading(false);
    }
  };

  const handleInputType = (inputType: string) => {
    createChatSession();
  };

  if (fetchingAgent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#5FD0D8" : "#007AFF"}
          />
          <Text
            style={[styles.loadingText, { color: isDark ? "#ccc" : "#666" }]}
          >
            Loading agent...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!agentConfig) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Ionicons
            name="alert-circle"
            size={64}
            color={isDark ? "#FF6B6B" : "#FF3B30"}
          />
          <Text style={styles.errorText}>Agent not found</Text>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={styles.primary.color} />
        </TouchableOpacity>
        <Text style={styles.title}>New Chat</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.agentInfo}>
        <View
          style={[
            styles.agentIcon,
            { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
          ]}
        >
          <Ionicons name={agentConfig.icon as any} size={32} color="white" />
        </View>
        <Text style={styles.agentName}>{agentConfig.name}</Text>
        <Text style={styles.agentDescription}>{agentConfig.description}</Text>
      </View>

      <View style={styles.inputOptions}>
        <Text style={styles.optionsTitle}>How would you like to start?</Text>

        <TouchableOpacity
          style={[
            styles.optionCard,
            { backgroundColor: isDark ? "#1C1C1E" : "white" },
          ]}
          onPress={() => handleInputType(agentConfig.inputType)}
          disabled={loading}
        >
          <View style={styles.optionContent}>
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
              ]}
            >
              <Ionicons
                name={getInputTypeIcon(agentConfig.inputType)}
                size={24}
                color="white"
              />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>
                {getInputTypeLabel(agentConfig.inputType)}
              </Text>
              <Text style={styles.optionSubtitle}>
                {getInputTypeDescription(agentConfig.inputType)}
              </Text>
            </View>
          </View>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={isDark ? "#5FD0D8" : "#007AFF"}
            />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#8E8E93" : "#666"}
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="warning" size={16} color="#FF9500" />
        <Text style={styles.disclaimerText}>
          AI assistants provide informational support only. Always consult
          healthcare professionals for medical advice.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const getInputTypeIcon = (inputType: string) => {
  switch (inputType) {
    case "text":
      return "chatbubble";
    case "image":
      return "image";
    case "barcode":
      return "barcode";
    case "file":
      return "document";
    default:
      return "chatbubble";
  }
};

const getInputTypeLabel = (inputType: string) => {
  switch (inputType) {
    case "text":
      return "Start Chat";
    case "image":
      return "Upload Image";
    case "barcode":
      return "Scan Barcode";
    case "file":
      return "Upload File";
    default:
      return "Start Chat";
  }
};

const getInputTypeDescription = (inputType: string) => {
  switch (inputType) {
    case "text":
      return "Begin conversation with text input";
    case "image":
      return "Upload medicine image for identification";
    case "barcode":
      return "Scan barcode or upload barcode image";
    case "file":
      return "Upload documents for analysis";
    default:
      return "Begin conversation";
  }
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? "#050507" : "#fbfbfc",
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
    },
    errorText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginTop: 16,
      marginBottom: 20,
      textAlign: "center",
    },
    backButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
    },
    backButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    backBtn: {
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
    },
    primary: {
      color: isDark ? "#0A84FF" : "#007AFF",
    },
    agentInfo: {
      alignItems: "center",
      padding: 32,
      paddingTop: 16,
    },
    agentIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    agentName: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 8,
      textAlign: "center",
    },
    agentDescription: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#666",
      textAlign: "center",
      lineHeight: 22,
    },
    inputOptions: {
      padding: 20,
    },
    optionsTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 16,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    optionContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    optionText: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 2,
    },
    optionSubtitle: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
    },
    disclaimer: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 20,
      margin: 20,
      marginTop: "auto",
      backgroundColor: isDark
        ? "rgba(255, 149, 0, 0.1)"
        : "rgba(255, 149, 0, 0.1)",
      borderRadius: 8,
      gap: 8,
    },
    disclaimerText: {
      flex: 1,
      fontSize: 12,
      color: isDark ? "#FFB86B" : "#FF9500",
      lineHeight: 16,
    },
  });
