import { supabase } from "@/config/SupabaseConfig";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
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
import color from "@/shared/color";

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
};

/**
 * NewChatScreen
 * Refactored to initiate premium AI chat sessions.
 * Standardized with Poppins fonts and primary styling.
 */
export default function NewChatScreen() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const agentType = params.agentType as string;
  const agentId = params.agentId as string;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);
 
  const [loading, setLoading] = useState(false);
  const [fetchingAgent, setFetchingAgent] = useState(true);
  const [agentConfig, setAgentConfig] = useState<any>(null);
 
  const loadAgentConfig = useCallback(async () => {
    if (!agentType && !agentId) {
      router.back();
      return;
    }
 
    if (agentId) {
      try {
        const { data, error } = await supabase
          .from("user_agents")
          .select("*")
          .eq("id", agentId)
          .single();
 
        if (error || !data) throw error;
 
        setAgentConfig({
          id: data.id,
          name: data.name,
          description: data.description,
          icon: data.icon,
          inputType: data.input_type,
          sessionType: "custom",
          isCustom: true,
        });
      } catch (err) {
        console.error("Error fetching custom agent:", err);
        router.back();
      }
    } else {
      const config = PREDEFINED_AGENT_CONFIGS[agentType as keyof typeof PREDEFINED_AGENT_CONFIGS];
      if (config) {
        setAgentConfig(config);
      } else {
        router.back();
      }
    }
    setFetchingAgent(false);
  }, [agentType, agentId, router]);
 
  useEffect(() => {
    loadAgentConfig();
  }, [loadAgentConfig]);
 
  const createChatSession = async () => {
    if (!user || !agentConfig) return;
 
    setLoading(true);
    try {
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();
 
      if (!dbUser) throw new Error("User disconnected.");
 
      const { data: session, error: sessErr } = await supabase
        .from("ai_chat_sessions")
        .insert([{
          user_id: dbUser.id,
          agent_id: agentConfig.isCustom ? agentConfig.id : null,
          title: agentConfig.name,
          session_type: agentConfig.sessionType,
          is_active: true,
          last_message_at: new Date().toISOString(),
        }])
        .select()
        .single();
 
      if (sessErr) throw sessErr;
 
      router.replace(`/assistant/chat/${session.id}` as any);
    } catch (error) {
      console.error("Session creation error:", error);
      Alert.alert("Error", "We couldn't start a new session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingAgent) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={isDark ? "white" : "black"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assistant Config</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.agentOverview}>
          <View style={styles.agentIconWrap}>
            {agentConfig.isCustom ? (
              <Text style={{ fontSize: 40 }}>{agentConfig.icon}</Text>
            ) : (
              <Ionicons name={agentConfig.icon} size={36} color="white" />
            )}
          </View>
          <Text style={styles.agentName}>{agentConfig.name}</Text>
          <Text style={styles.agentDesc}>{agentConfig.description}</Text>
        </View>

        <View style={styles.optionsWrap}>
          <Text style={styles.optionsTitle}>Preferred Input Method</Text>
          <TouchableOpacity style={[styles.optionItem, { backgroundColor: isDark ? "#1C1C1E" : "white" }]} onPress={createChatSession} disabled={loading}>
            <View style={styles.itemIconWrap}>
              <Ionicons name="chatbubbles-outline" size={20} color={color.PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Multi-turn Conversation</Text>
              <Text style={styles.itemSub}>Direct text dialogue with context-aware AI.</Text>
            </View>
            {loading ? <ActivityIndicator size="small" color={color.PRIMARY} /> : <Ionicons name="chevron-forward" size={18} color="#8E8E93" />}
          </TouchableOpacity>
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="shield-checkmark" size={16} color="#FF9500" />
          <Text style={styles.disclaimerText}>
            Medical Intelligence is for informational use only. Consult a doctor for any specific health concerns.
          </Text>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={createChatSession} disabled={loading}>
          <Text style={styles.startBtnText}>{loading ? "Initializing..." : "Proceed to Assistant"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "PoppinsRegular",
    fontWeight: "bold",
    color: isDark ? "white" : "#1A1A1E",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  agentOverview: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  agentIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: color.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: color.PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  agentName: {
    fontSize: 24,
    fontFamily: "PoppinsRegular",
    fontWeight: "bold",
    color: isDark ? "white" : "#1A1A1E",
    marginBottom: 8,
  },
  agentDesc: {
    fontSize: 15,
    fontFamily: "PoppinsRegular",
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  optionsWrap: {
    gap: 16,
  },
  optionsTitle: {
    fontSize: 15,
    fontFamily: "PoppinsRegular",
    fontWeight: "bold",
    color: isDark ? "white" : "#1A1A1E",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: isDark ? "#2C2C2E" : "#ECEEF2",
  },
  itemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: color.PRIMARY + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: "PoppinsRegular",
    fontWeight: "600",
    color: isDark ? "white" : "#1A1A1E",
  },
  itemSub: {
    fontSize: 12,
    fontFamily: "PoppinsRegular",
    color: "#8E8E93",
  },
  disclaimer: {
    flexDirection: "row",
    backgroundColor: "#FF9500" + "10",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "PoppinsRegular",
    color: "#FF9500",
    lineHeight: 18,
  },
  startBtn: {
    backgroundColor: color.PRIMARY,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: color.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startBtnText: {
    color: "white",
    fontSize: 18,
    fontFamily: "PoppinsRegular",
    fontWeight: "bold",
  },
});
