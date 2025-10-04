import AgentCard from "@/components/assistant/AgentCard";
import FilterBar from "@/components/assistant/FilterBar";
import SearchBar from "@/components/assistant/SearchBar";
import { supabase } from "@/config/SupabaseConfig";
import { AIAgent } from "@/types/assistant";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Predefined agents data
const PREDEFINED_AGENTS: AIAgent[] = [
  {
    id: "medicine-teller",
    name: "Medicine Identifier",
    description: "Upload medicine image and get detailed information",
    icon: "medical",
    type: "predefined",
    category: "medicine",
    system_prompt:
      "You are a medicine identification expert. Analyze medicine images and provide detailed information including name, uses, dosage, side effects, and precautions.",
    input_type: "image",
    output_type: "text",
  },
  {
    id: "medicine-suggester",
    name: "Medicine Suggester",
    description: "Describe symptoms and get medicine suggestions",
    icon: "bandage",
    type: "predefined",
    category: "medicine",
    system_prompt:
      "You are a medical assistant. Suggest possible OTC medicines based on symptoms, but always emphasize consulting a doctor for proper diagnosis.",
    input_type: "text",
    output_type: "text",
  },
  {
    id: "barcode-inspector",
    name: "Barcode Scanner",
    description: "Scan barcode to get medicine information",
    icon: "barcode",
    type: "predefined",
    category: "medicine",
    system_prompt:
      "You are a barcode and medicine verification expert. Provide detailed product information from barcode data.",
    input_type: "barcode",
    output_type: "medicine_form",
  },
  {
    id: "report-analyzer",
    name: "Report Analyzer",
    description: "Upload lab reports for detailed analysis",
    icon: "document",
    type: "predefined",
    category: "analysis",
    system_prompt:
      "You are a clinical lab analyst. Analyze lab reports and provide structured interpretation with normal/abnormal values and recommendations.",
    input_type: "file",
    output_type: "report",
  },
  {
    id: "drug-interaction",
    name: "Drug Interaction Checker",
    description: "Check interactions between multiple medicines",
    icon: "warning",
    type: "predefined",
    category: "medicine",
    system_prompt:
      "You are a pharmacology expert. Check and explain potential drug interactions with evidence-based information.",
    input_type: "text",
    output_type: "text",
  },
  {
    id: "prescription-helper",
    name: "Prescription Helper",
    description: "Get help with prescription information and alternatives",
    icon: "medkit",
    type: "predefined",
    category: "medicine",
    system_prompt:
      "You are a prescription assistance expert. Help users understand prescriptions and find alternatives if needed.",
    input_type: "text",
    output_type: "text",
  },
];

export default function AssistantScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userAgents, setUserAgents] = useState<AIAgent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "medicine" | "analysis" | "assistance" | "custom"
  >("all");

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError || !userData) {
        console.error("User not found:", userError);
        setUserAgents([]);
        return;
      }

      const userId = userData.id;

      // Fetch user's custom agents
      const { data: customAgents, error: agentsError } = await supabase
        .from("user_agents")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (agentsError) {
        console.error("Error fetching agents:", agentsError);
        setUserAgents([]);
        return;
      }

      // Transform to AIAgent format
      const transformedAgents: AIAgent[] = (customAgents || []).map(
        (agent) => ({
          id: agent.id,
          name: agent.name,
          description: agent.description || "",
          icon: agent.icon || "build",
          type: "custom" as const,
          category: agent.category || "custom",
          system_prompt: agent.system_prompt,
          input_type: agent.input_type || "text",
          output_type: agent.output_type || "text",
        })
      );

      setUserAgents(transformedAgents);
    } catch (error) {
      console.error("Error fetching assistant data:", error);
      Alert.alert("Error", "Failed to load assistant data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const allAgents = [...PREDEFINED_AGENTS, ...userAgents];

  const filteredAgents = allAgents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeFilter === "all" || agent.category === activeFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
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
            Loading AI Assistants...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI Assistants</Text>
          <Text style={styles.subtitle}>
            Get expert help with your medicines
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
          ]}
          onPress={() => router.push("/assistant/create-agent" as any)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search assistants..."
      />

      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {userAgents.length === 0 && (
        <TouchableOpacity
          style={[
            styles.createBanner,
            { backgroundColor: isDark ? "#1C1C1E" : "white" },
          ]}
          onPress={() => router.push("/assistant/create-agent" as any)}
        >
          <View style={styles.bannerContent}>
            <Ionicons
              name="sparkles"
              size={32}
              color={isDark ? "#5FD0D8" : "#007AFF"}
            />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Create Your Own AI Agent</Text>
              <Text style={styles.bannerDescription}>
                Customize an AI assistant for your specific needs
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#8E8E93" : "#666"}
            />
          </View>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredAgents}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.agentsGrid}
        renderItem={({ item }) => (
          <AgentCard
            agent={item}
            onPress={() => {
              router.push(
                `/assistant/chat/new-chat?agentType=${item.id}` as any
              );
            }}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="search"
              size={64}
              color={isDark ? "#38383A" : "#e5e5e5"}
            />
            <Text style={styles.emptyText}>No assistants found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filter
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

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
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
      marginTop: 2,
    },
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    createButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    createBanner: {
      margin: 16,
      marginTop: 8,
      padding: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    bannerContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    bannerText: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 2,
    },
    bannerDescription: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
    },
    agentsGrid: {
      justifyContent: "space-between",
      paddingHorizontal: 16,
      gap: 12,
    },
    listContent: {
      paddingTop: 8,
      paddingBottom: 32,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: 48,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginTop: 16,
      textAlign: "center",
    },
    emptySubtext: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
      marginTop: 4,
      textAlign: "center",
    },
  });
