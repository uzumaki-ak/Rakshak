import { supabase } from "@/config/SupabaseConfig";
import { AIChatSession, ChatMessage } from "@/types/assistant";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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

export default function ChatSessionScreen() {
  const { sessionId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  const flatListRef = useRef<FlatList>(null);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AIChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch session and messages
  const fetchSessionData = async () => {
    if (!user || !sessionId) return;

    try {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userData) return;

      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from("ai_chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", userData.id)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error) {
      console.error("Error fetching chat session:", error);
      Alert.alert("Error", "Failed to load chat session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [sessionId, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async (content?: string, attachments?: string[]) => {
    const messageContent = content || newMessage;
    if (!messageContent.trim() && (!attachments || attachments.length === 0))
      return;

    const userMessage: Omit<ChatMessage, "id"> = {
      session_id: session!.id,
      sender: "user",
      content: messageContent,
      message_type: attachments && attachments.length > 0 ? "image" : "text",
      attachments: attachments || [],
      is_flagged: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [
      ...prev,
      { ...userMessage, id: `temp-${Date.now()}` } as ChatMessage,
    ]);
    if (!content) setNewMessage("");
    setSending(true);

    try {
      // Save user message to database
      const { data: savedMessage, error: messageError } = await supabase
        .from("chat_messages")
        .insert([userMessage])
        .select()
        .single();

      if (messageError) throw messageError;

      // Update messages with saved message (to get real ID)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === `temp-${Date.now()}` ? savedMessage : msg
        )
      );

      // Call AI service based on session type
      await callAIService(savedMessage);

      // Update session last message time
      await supabase
        .from("ai_chat_sessions")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", session!.id);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const callAIService = async (userMessage: ChatMessage) => {
    // Create temporary AI message
    const tempAiMessage: Omit<ChatMessage, "id"> = {
      session_id: session!.id,
      sender: "assistant",
      content: "Thinking...",
      message_type: "text",
      is_flagged: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [
      ...prev,
      { ...tempAiMessage, id: `temp-ai-${Date.now()}` } as ChatMessage,
    ]);

    try {
      // Prepare context based on session type
      const context = {
        session_type: session?.session_type,
        previous_messages: messages.slice(-10), // Last 10 messages for context
        user_message: userMessage,
      };

      // Call your AI service (this is a placeholder - implement based on your AI provider)
      const aiResponse = await generateAIResponse(context);

      // Save AI response to database
      const { data: savedAiMessage, error: aiError } = await supabase
        .from("chat_messages")
        .insert([
          {
            ...tempAiMessage,
            content: aiResponse.content,
            model_used: aiResponse.model_used,
            confidence_score: aiResponse.confidence_score,
          },
        ])
        .select()
        .single();

      if (aiError) throw aiError;

      // Update messages with real AI message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === `temp-ai-${Date.now()}` ? savedAiMessage : msg
        )
      );
    } catch (error) {
      console.error("Error calling AI service:", error);
      // Update with error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === `temp-ai-${Date.now()}`
            ? {
                ...msg,
                content: "Sorry, I encountered an error. Please try again.",
              }
            : msg
        )
      );
    }
  };

  // Placeholder for AI response generation
  const generateAIResponse = async (context: any) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_EURI_API_KEY;
      if (!apiKey) {
        throw new Error("Euron API key not configured");
      }

      // Prepare messages for the API
      const messages = [
        // System message based on agent type
        {
          role: "system",
          content: getSystemPrompt(context.session_type),
        },
        // Previous messages for context (last 5 messages)
        ...context.previous_messages.slice(-5).map((msg: any) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        // Current user message
        {
          role: "user",
          content: context.user_message.content,
        },
      ];

      const response = await fetch(
        "https://api.euron.one/api/v1/euri/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            messages: messages,
            model: "gpt-4.1-nano",
            max_tokens: 1000,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      return {
        content:
          data.choices[0]?.message?.content ||
          "I apologize, but I couldn't generate a response.",
        model_used: data.model || "gpt-4.1-nano",
        confidence_score: 0.9, // You might get this from the API if available
      };
    } catch (error) {
      console.error("Error calling Euron AI API:", error);
      throw error;
    }
  };

  // Helper function to get system prompts based on agent type
  const getSystemPrompt = (sessionType: string) => {
    const prompts: { [key: string]: string } = {
      medicine_teller: `You are a medicine identification expert. Analyze medicine images and provide detailed information including:
- Medicine name and generic name
- Primary uses and indications
- Typical dosage and administration
- Common side effects and precautions
- Storage requirements
- Important warnings

Always include a disclaimer: "This information is for educational purposes only. Consult a healthcare professional for medical advice."`,

      medicine_suggester: `You are a medical assistant that suggests possible over-the-counter medicines based on symptoms. 
Provide:
- Possible OTC options with reasoning
- Home remedies and self-care tips
- When to see a doctor (red flags)
- General precautions

IMPORTANT: Always emphasize this is not medical advice and users should consult healthcare professionals.`,

      barcode_inspector: `You are a barcode and medicine verification expert. Provide detailed product information from barcode data including:
- Product identification
- Manufacturer details
- Active ingredients
- Regulatory information
- Safety information

If barcode is not recognized, ask for the product name and try to identify it.`,

      report_analyzer: `You are a clinical lab analyst. Analyze medical reports and provide:
- Summary of key findings
- Identification of abnormal values with reference ranges
- Clinical significance of abnormalities
- Recommendations for follow-up
- When to seek immediate medical attention

Always state that this is informational and not a substitute for professional medical interpretation.`,

      general: `You are a helpful AI assistant specialized in medicine and healthcare. Provide accurate, helpful information while always reminding users to consult healthcare professionals for medical advice.`,
    };

    return prompts[sessionType] || prompts["general"];
  };

  const speakMessage = (message: string) => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      Speech.speak(message, {
        language: "en",
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "We need access to your photos to upload images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadImage = async (uri: string) => {
    if (!session) return;

    setUploading(true);

    try {
      // Fetch the local file URI as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create a filename
      const fileName = `chat-${session.id}-${Date.now()}.jpg`;

      // Upload the blob directly to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("rak-ai")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          // optionally: cacheControl, upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("rak-ai").getPublicUrl(fileName);

      // Send message with image URL
      await sendMessage("I uploaded this image:", [publicUrl]);
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }; // <-- CLOSES uploadImage

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === "user";

    return (
      <View
        style={[
          styles.messageContainer,
          isUser
            ? styles.userMessageContainer
            : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Ionicons name="sparkles" size={16} color="white" />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {/* Render attachments if any */}
          {item.attachments &&
            item.attachments.map((attachment, index) => (
              <Image
                key={index}
                source={{ uri: attachment }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            ))}

          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {item.content}
          </Text>

          {!isUser && (
            <TouchableOpacity
              onPress={() => speakMessage(item.content)}
              style={styles.speakButton}
            >
              <Ionicons
                name={speaking ? "pause" : "volume-medium"}
                size={16}
                color={isDark ? "#8E8E93" : "#666"}
              />
            </TouchableOpacity>
          )}
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={16} color="white" />
          </View>
        )}
      </View>
    );
  };

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
            Loading chat...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Chat session not found</Text>
          <TouchableOpacity
            style={[
              //@ts-ignore
              styles.backButtonFull,
              { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
            ]}
            onPress={() => router.back()}
          >
            <Text
              //@ts-ignore
              style={styles.backButtonText}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? "#1C1C1E" : "white" },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#FFFFFF" : "#1a1a1a"}
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>
            {session.title}
          </Text>
          <Text style={styles.sessionType}>
            {session.session_type?.replace("_", " ")}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            // Handle menu options
          }}
          style={styles.menuButton}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={isDark ? "#FFFFFF" : "#1a1a1a"}
          />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubble"
              size={64}
              color={isDark ? "#38383A" : "#e5e5e5"}
            />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation with the AI assistant
            </Text>
          </View>
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          styles.inputContainer,
          { backgroundColor: isDark ? "#1C1C1E" : "white" },
        ]}
      >
        <TouchableOpacity
          style={styles.attachButton}
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={isDark ? "#8E8E93" : "#666"} />
          ) : (
            <Ionicons name="image" size={24} color={isDark ? "#8E8E93" : "#666"} />
          )}
        </TouchableOpacity>

        <TextInput
          style={[
            styles.textInput,
            { backgroundColor: isDark ? "#2C2C2E" : "#f5f5f5" },
          ]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          placeholderTextColor={isDark ? "#636366" : "#999"}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor:
                sending || !newMessage.trim()
                  ? isDark
                    ? "#38383A"
                    : "#e5e5e5"
                  : isDark
                  ? "#2D89FF"
                  : "#007AFF",
            },
          ]}
          onPress={() => sendMessage()}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={20} color="white" />}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? "#050507" : "#fbfbfc" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
    },
    errorText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 20,
      textAlign: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#38383A" : "#e5e5e5",
    },
    backButton: {
      padding: 4,
      marginRight: 8,
    },
    headerContent: {
      flex: 1,
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
    },
    sessionType: {
      fontSize: 12,
      color: isDark ? "#8E8E93" : "#666",
      marginTop: 2,
      textTransform: "capitalize",
    },
    menuButton: {
      padding: 4,
      marginLeft: 8,
    },
    messagesList: {
      flex: 1,
    },
    messagesContent: {
      padding: 16,
      paddingBottom: 8,
    },
    messageContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: 16,
    },
    userMessageContainer: {
      justifyContent: "flex-end",
    },
    assistantMessageContainer: {
      justifyContent: "flex-start",
    },
    userAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "#2D89FF" : "#007AFF",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8,
    },
    assistantAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "#34C759" : "#32D74B",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    messageBubble: {
      maxWidth: "70%",
      padding: 12,
      borderRadius: 18,
    },
    userBubble: {
      backgroundColor: isDark ? "#2D89FF" : "#007AFF",
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: isDark ? "#1C1C1E" : "white",
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#e5e5e5",
    },
    messageText: {
      fontSize: 16,
      lineHeight: 20,
    },
    userMessageText: {
      color: "white",
    },
    assistantMessageText: {
      color: isDark ? "#FFFFFF" : "#1a1a1a",
    },
    messageImage: {
      width: 200,
      height: 150,
      borderRadius: 8,
      marginBottom: 8,
    },
    speakButton: {
      padding: 4,
      marginTop: 4,
      alignSelf: "flex-start",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      padding: 16,
      paddingBottom: Platform.OS === "ios" ? 34 : 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#38383A" : "#e5e5e5",
    },
    attachButton: {
      padding: 8,
      marginRight: 8,
    },
    textInput: {
      flex: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8,
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
}
