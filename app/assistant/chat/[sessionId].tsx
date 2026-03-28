import { supabase } from "@/config/SupabaseConfig";
import { AIChatSession, ChatMessage } from "@/types/assistant";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MedicineChatService } from "@/services/ai/medicineChatService";
import color from "@/shared/color";

/**
 * ChatSessionScreen
 * Modernized chat interface for interacting with the AI Health Assistant.
 * Uses the updated Gemini-powered MedicineChatService for intelligent responses.
 */
export default function ChatSessionScreen() {
  const { sessionId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const flatListRef = useRef<FlatList>(null);
  const chatService = MedicineChatService.getInstance();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AIChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const fetchSessionData = useCallback(async () => {
    if (!user || !sessionId) return;

    try {
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!dbUser) return;

      const { data: sessionData, error: sessionError } = await supabase
        .from("ai_chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", dbUser.id)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const userMessageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const tempUserMsg: any = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      sender: "user",
      content: userMessageContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      // 1. Save user message to DB
      const { data: savedUserMsg, error: userMsgErr } = await supabase
        .from("chat_messages")
        .insert([{
          session_id: sessionId,
          sender: "user",
          content: userMessageContent,
          message_type: "text"
        }])
        .select()
        .single();

      if (userMsgErr) throw userMsgErr;

      // 2. Prepare AI Context
      const history = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // 3. Call AI Service
      // Mocking a default medicine context if none found in session
      // In a real scenario, sessions would be linked to specific medicine IDs
      const medicineContext = session?.context_data?.medicine || { name: "Medicine" };
      const aiResult = await chatService.askAboutMedicine(medicineContext as any, userMessageContent, history as any);

      // 4. Save Assistant message to DB
      const { data: savedAiMsg, error: aiMsgErr } = await supabase
        .from("chat_messages")
        .insert([{
          session_id: sessionId,
          sender: "assistant",
          content: aiResult.answer,
          message_type: "text"
        }])
        .select()
        .single();

      if (aiMsgErr) throw aiMsgErr;

      setMessages((prev) => [...prev.filter(m => m.id !== tempUserMsg.id), savedUserMsg, savedAiMsg]);
      
      await supabase
        .from("ai_chat_sessions")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", sessionId);

    } catch (error) {
      console.error("Send Error:", error);
      Alert.alert("Connection Lost", "Failed to reach AI assistant. Please check your internet.");
    } finally {
      setSending(false);
    }
  };

  const handleSpeech = async (messageId: string, content: string) => {
    if (speakingId === messageId) {
      await chatService.stopSpeaking();
      setSpeakingId(null);
    } else {
      setSpeakingId(messageId);
      await chatService.speakAnswer(content);
      // Logic for onDone is tricky with global service, but suffice for now
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={isDark ? "white" : "black"} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{session?.title || "Assistant"}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Rakshak AI Active</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={isDark ? "white" : "black"} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.msgWrapper, item.sender === "user" ? styles.msgRight : styles.msgLeft]}>
            {item.sender === "assistant" && (
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color="white" />
              </View>
            )}
            <View style={[styles.bubble, item.sender === "user" ? styles.bubbleUser : styles.bubbleAi]}>
              <Text style={[styles.msgText, item.sender === "user" ? styles.msgTextUser : styles.msgTextAi]}>
                {item.content}
              </Text>
              {item.sender === "assistant" && (
                <TouchableOpacity onPress={() => handleSpeech(item.id, item.content)} style={styles.speakBtn}>
                  <Ionicons name={speakingId === item.id ? "pause-circle" : "volume-medium-outline"} size={18} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={10}>
        <View style={styles.inputBar}>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7" }]}
            placeholder="Ask anything about your health..."
            placeholderTextColor="#8E8E93"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { opacity: newMessage.trim() ? 1 : 0.5 }]} 
            onPress={sendMessage}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={20} color="white" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "PoppinsRegular",
    fontWeight: "600",
    color: isDark ? "white" : "#1A1A1E",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34C759",
  },
  statusText: {
    fontSize: 11,
    fontFamily: "PoppinsRegular",
    color: "#8E8E93",
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  msgWrapper: {
    flexDirection: "row",
    maxWidth: "85%",
    alignItems: "flex-end",
    gap: 8,
  },
  msgLeft: {
    alignSelf: "flex-start",
  },
  msgRight: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: color.PRIMARY,
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: isDark ? "#1C1C1E" : "white",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: isDark ? "#2C2C2E" : "#ECEEF2",
  },
  msgText: {
    fontSize: 15,
    fontFamily: "PoppinsRegular",
    lineHeight: 22,
  },
  msgTextUser: {
    color: "white",
  },
  msgTextAi: {
    color: isDark ? "#D1D1D6" : "#1A1A1E",
  },
  speakBtn: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: isDark ? "#1C1C1E" : "#ECEEF2",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    fontFamily: "PoppinsRegular",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
});
