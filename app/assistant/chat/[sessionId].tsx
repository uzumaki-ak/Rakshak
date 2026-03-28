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
import { UploadService } from "@/services/media/uploadService";
import * as ImagePicker from "expo-image-picker";
import color from "@/shared/color";
import { Image } from "react-native";

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
  const [customPrompt, setCustomPrompt] = useState<string | undefined>(undefined);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

      // If it's a custom agent, fetch the system prompt
      if (sessionData.agent_id) {
        const { data: agentData } = await supabase
          .from("user_agents")
          .select("system_prompt")
          .eq("id", sessionData.agent_id)
          .single();
        
        if (agentData) {
          setCustomPrompt(agentData.system_prompt);
        }
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from("ai_chat_messages")
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || sending) return;

    const userMessageContent = newMessage.trim();
    const imageToUpload = selectedImage;
    
    setNewMessage("");
    setSelectedImage(null);
    setSending(true);

    const tempUserMsg: any = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: userMessageContent,
      metadata: imageToUpload ? { image_url: imageToUpload } : null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      let uploadedUrl = null;
      if (imageToUpload) {
        setUploading(true);
        uploadedUrl = await UploadService.getInstance().uploadImage(imageToUpload);
        setUploading(false);
      }

      // 1. Save user message to DB
      const { data: savedUserMsg, error: userMsgErr } = await supabase
        .from("ai_chat_messages")
        .insert([{
          session_id: sessionId,
          role: "user",
          content: userMessageContent,
          metadata: uploadedUrl ? { image_url: uploadedUrl } : null
        }])
        .select()
        .single();

      if (userMsgErr) throw userMsgErr;

      // 2. Prepare AI Context
      const history = messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'model' as any,
        parts: [{ text: m.content }]
      }));

      // 3. Call AI Service
      const medicineContext = session?.context_data?.medicine || null;
      const aiResult = await chatService.askAboutMedicine(
        medicineContext as any, 
        userMessageContent, 
        history as any, 
        customPrompt,
        imageToUpload || undefined
      );

      // 4. Save Assistant message to DB
      const { data: savedAiMsg, error: aiMsgErr } = await supabase
        .from("ai_chat_messages")
        .insert([{
          session_id: sessionId,
          role: "assistant",
          content: aiResult.answer,
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
          <View style={[styles.msgWrapper, item.role === "user" ? styles.msgRight : styles.msgLeft]}>
            {item.role === "assistant" && (
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color="white" />
              </View>
            )}
            <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAi]}>
              {item.metadata?.image_url && (
                <Image 
                  source={{ uri: item.metadata.image_url }} 
                  style={styles.messageImage} 
                  resizeMode="cover"
                />
              )}
              <Text style={[styles.msgText, item.role === "user" ? styles.msgTextUser : styles.msgTextAi]}>
                {item.content}
              </Text>
              {item.role === "assistant" && (
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
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removePreview} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close-circle" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color={color.PRIMARY} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7" }]}
            placeholder="Ask anything or upload a report..."
            placeholderTextColor="#8E8E93"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { opacity: (newMessage.trim() || selectedImage) ? 1 : 0.5 }]} 
            onPress={sendMessage}
            disabled={sending || (!newMessage.trim() && !selectedImage)}
          >
            {sending || uploading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={20} color="white" />}
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
  attachBtn: {
    padding: 4,
  },
  previewContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: isDark ? "#1C1C1E" : "#F2F4F7",
    borderTopWidth: 1,
    borderTopColor: isDark ? "#2C2C2E" : "#ECEEF2",
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removePreview: {
    position: 'absolute',
    top: 5,
    left: 55,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
});
