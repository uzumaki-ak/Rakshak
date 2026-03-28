import AgentCard from "@/components/assistant/AgentCard";
import FilterBar from "@/components/assistant/FilterBar";
import SearchBar from "@/components/assistant/SearchBar";
import { supabase } from "@/config/SupabaseConfig";
import { AIAgent } from "@/types/assistant";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Alert,
} from "react-native";
import { useUserSync } from "@/hooks/useUserSync";
import color from "@/shared/color";

const PREDEFINED_AGENTS: AIAgent[] = [
  {
    id: "medicine-teller",
    name: "Medicine Identifier",
    description: "Scan medicine labels for detailed info",
    icon: "medical",
    type: "predefined",
    category: "medicine",
    system_prompt: "You are a medicine identification expert...",
    input_type: "image",
    output_type: "text",
  },
  {
    id: "medicine-suggester",
    name: "Health Consultant",
    description: "AI-powered OTC and symptom guidance",
    icon: "bandage",
    type: "predefined",
    category: "medicine",
    system_prompt: "You are a medical assistant...",
    input_type: "text",
    output_type: "text",
  },
  {
    id: "drug-interaction",
    name: "Interaction Check",
    description: "Verify safety with multiple meds",
    icon: "warning",
    type: "predefined",
    category: "medicine",
    system_prompt: "You are a pharmacology expert...",
    input_type: "text",
    output_type: "text",
  },
  {
    id: "report-analyzer",
    name: "Report Analyzer",
    description: "Decode complex medical lab results",
    icon: "document-text",
    type: "predefined",
    category: "analysis",
    system_prompt: "You are a clinical lab analyst...",
    input_type: "file",
    output_type: "report",
  },
];

/**
 * AssistantScreen
 * Discovery hub for AI-powered health assistants.
 * Refactored for premium UI consistency and reliable synchronization.
 */
export default function AssistantScreen() {
  const { user } = useUser();
  const { isSynced } = useUserSync();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userAgents, setUserAgents] = useState<AIAgent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "medicine" | "analysis" | "assistance" | "custom">("all");

  const fetchUserData = useCallback(async () => {
    if (!user || !isSynced) return;

    try {
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!dbUser) return;

      const { data: agents, error: agentsErr } = await supabase
        .from("user_agents")
        .select("*")
        .eq("user_id", dbUser.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (agentsErr) throw agentsErr;

      const formattedAgents: AIAgent[] = (agents || []).map(a => ({
        id: a.id,
        name: a.name,
        description: a.description || "",
        icon: a.icon || "sparkles",
        type: "custom",
        category: a.category || "custom",
        system_prompt: a.system_prompt,
        input_type: a.input_type || "text",
        output_type: a.output_type || "text",
        created_at: a.created_at,
        user_id: a.user_id,
      }));

      setUserAgents(formattedAgents);
    } catch (error) {
      console.error("Assistant Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isSynced]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const allAgents = [...PREDEFINED_AGENTS, ...userAgents];
  const filteredAgents = allAgents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeFilter === "all" || agent.category === activeFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading || !isSynced) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
        <Text style={styles.loadingText}>Awakening AI Assistants...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI Assistants</Text>
          <Text style={styles.subtitle}>Smart health insights on demand</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push("/assistant/create-agent")}
        >
          <Ionicons name="sparkles" size={18} color="white" />
          <Text style={styles.createBtnText}>New Agent</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search AI capabilities..."
        />
        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter as any} />
      </View>

      <FlatList
        data={filteredAgents}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <AgentCard
            agent={item}
            onPress={() => {
              if (item.type === 'custom') {
                router.push(`/assistant/chat/new-chat?agentId=${item.id}` as any);
              } else {
                router.push(`/assistant/chat/new-chat?agentType=${item.id}` as any);
              }
            }}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.PRIMARY} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search" size={60} color={isDark ? "#2C2C2E" : "#E5E5E7"} />
            <Text style={styles.emptyText}>No matches found</Text>
            <Text style={styles.emptySubtext}>Try a different search term or category.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" },
    center: { justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 16, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
    title: { fontSize: 28, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "#FFFFFF" : "#1A1A1E" },
    subtitle: { fontSize: 14, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366", marginTop: 2 },
    createBtn: { flexDirection: "row", alignItems: "center", backgroundColor: color.PRIMARY, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, gap: 6, shadowColor: color.PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    createBtnText: { color: "white", fontFamily: "PoppinsRegular", fontWeight: "600", fontSize: 13 },
    searchBox: { paddingHorizontal: 16, gap: 12, marginBottom: 8 },
    columnWrapper: { justifyContent: "flex-start", paddingHorizontal: 14, gap: 12 },
    listContent: { paddingBottom: 100 },
    emptyState: { alignItems: "center", marginTop: 80 },
    emptyText: { fontSize: 18, fontFamily: "PoppinsRegular", fontWeight: "600", color: isDark ? "#FFFFFF" : "#1A1A1E", marginTop: 20 },
    emptySubtext: { fontSize: 14, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366", textAlign: "center", marginTop: 8 },
  });
