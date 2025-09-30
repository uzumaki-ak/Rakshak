// import { supabase } from "@/config/SupabaseConfig";
// import { Medicine } from "@/types/medicine";
// import { useUser } from "@clerk/clerk-expo";
// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// export default function MedicineDetailScreen() {
//   const { id } = useLocalSearchParams();
//   const { user } = useUser();
//   const router = useRouter();
//   const [medicine, setMedicine] = useState<Medicine | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchMedicine();
//   }, [id]);

//   const fetchMedicine = async () => {
//     if (!user || !id) return;

//     try {
//       // First, get the user's UUID from the database
//       const { data: userData, error: userError } = await supabase
//         .from("users")
//         .select("id")
//         .eq("clerk_user_id", user.id)
//         .single();

//       if (userError || !userData) {
//         console.error("User not found in database:", userError);
//         Alert.alert("Error", "User not found in database");
//         return;
//       }

//       // Now fetch the medicine using the UUID
//       const { data, error } = await supabase
//         .from("medicines")
//         .select("*")
//         .eq("id", id)
//         .eq("user_id", userData.id) // Use UUID instead of user.id
//         .single();

//       if (error) throw error;
//       setMedicine(data);
//     } catch (error) {
//       console.error("Error fetching medicine:", error);
//       Alert.alert("Error", "Failed to load medicine details");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const deleteMedicine = async () => {
//     // Get user UUID first, then use it in the delete query
//     const { data: userData } = await supabase
//       .from("users")
//       .select("id")
//       .eq("clerk_user_id", user?.id)
//       .single();

//     if (!userData) return;

//     const { error } = await supabase
//       .from("medicines")
//       .delete()
//       .eq("id", id)
//       .eq("user_id", userData.id); // Use UUID
//   };
//   const getExpiryStatus = () => {
//     if (!medicine?.expiry_date) return "unknown";

//     const expiry = new Date(medicine.expiry_date);
//     const today = new Date();
//     const thirtyDaysFromNow = new Date(
//       today.getTime() + 30 * 24 * 60 * 60 * 1000
//     );

//     if (expiry < today) return "expired";
//     if (expiry <= thirtyDaysFromNow) return "expiring";
//     return "good";
//   };

//   const formatDate = (dateString?: string) => {
//     if (!dateString) return "Not specified";
//     return new Date(dateString).toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "long",
//       year: "numeric",
//     });
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//       </View>
//     );
//   }

//   if (!medicine) {
//     return (
//       <View style={styles.center}>
//         <Text>Medicine not found</Text>
//       </View>
//     );
//   }

//   const expiryStatus = getExpiryStatus();
//   const statusColor =
//     expiryStatus === "expired"
//       ? "#FF3B30"
//       : expiryStatus === "expiring"
//       ? "#FF9500"
//       : "#34C759";

//   return (
//     <ScrollView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={styles.backButton}
//         >
//           <Ionicons name="arrow-back" size={24} color="#007AFF" />
//         </TouchableOpacity>
//         <Text style={styles.title}>Medicine Details</Text>
//         <TouchableOpacity
//           onPress={() =>
//             router.push(`/medicines/edit?id=${medicine.id}` as any)
//           }
//         >
//           <Ionicons name="create-outline" size={24} color="#007AFF" />
//         </TouchableOpacity>
//       </View>

//       {/* Medicine Info Card */}
//       <View style={styles.card}>
//         <Text style={styles.medicineName}>{medicine.name}</Text>

//         {medicine.generic_name && (
//           <Text style={styles.genericName}>{medicine.generic_name}</Text>
//         )}

//         <View style={styles.detailSection}>
//           <DetailRow
//             icon="fitness"
//             label="Strength"
//             value={medicine.strength}
//           />
//           <DetailRow
//             icon="cube"
//             label="Quantity"
//             value={`${medicine.current_quantity} ${
//               medicine.unit_type || "units"
//             }`}
//           />
//           <DetailRow
//             icon="calendar"
//             label="Expiry Date"
//             value={formatDate(medicine.expiry_date)}
//             valueColor={statusColor}
//           />
//           <DetailRow
//             icon="business"
//             label="Manufacturer"
//             value={medicine.manufacturer}
//           />
//           <DetailRow
//             icon="barcode"
//             label="Batch Number"
//             value={medicine.batch_number}
//           />
//         </View>
//       </View>

//       {/* Additional Details */}
//       {(medicine.dosage_instructions || medicine.notes) && (
//         <View style={styles.card}>
//           <Text style={styles.sectionTitle}>Additional Information</Text>

//           {medicine.dosage_instructions && (
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Dosage Instructions</Text>
//               <Text style={styles.infoValue}>
//                 {medicine.dosage_instructions}
//               </Text>
//             </View>
//           )}

//           {medicine.notes && (
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Notes</Text>
//               <Text style={styles.infoValue}>{medicine.notes}</Text>
//             </View>
//           )}
//         </View>
//       )}

//       {/* Actions */}
//       <View style={styles.actions}>
//         <TouchableOpacity
//           style={[styles.actionButton, styles.deleteButton]}
//           onPress={deleteMedicine}
//         >
//           <Ionicons name="trash-outline" size={20} color="#FF3B30" />
//           <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const DetailRow = ({
//   icon,
//   label,
//   value,
//   valueColor,
// }: {
//   icon: string;
//   label: string;
//   value?: string;
//   valueColor?: string;
// }) =>
//   value ? (
//     <View style={styles.detailRow}>
//       <Ionicons name={icon as any} size={20} color="#666" />
//       <Text style={styles.detailLabel}>{label}:</Text>
//       <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>
//         {value}
//       </Text>
//     </View>
//   ) : null;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//   },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingTop: 60,
//     paddingBottom: 20,
//     backgroundColor: "white",
//   },
//   backButton: {
//     padding: 4,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1a1a1a",
//   },
//   card: {
//     backgroundColor: "white",
//     margin: 16,
//     padding: 20,
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   medicineName: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#1a1a1a",
//     marginBottom: 4,
//   },
//   genericName: {
//     fontSize: 16,
//     color: "#666",
//     fontStyle: "italic",
//     marginBottom: 16,
//   },
//   detailSection: {
//     marginTop: 8,
//   },
//   detailRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   detailLabel: {
//     fontSize: 16,
//     color: "#666",
//     marginLeft: 8,
//     marginRight: 4,
//     width: 100,
//   },
//   detailValue: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#1a1a1a",
//     flex: 1,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1a1a1a",
//     marginBottom: 16,
//   },
//   infoItem: {
//     marginBottom: 16,
//   },
//   infoLabel: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#666",
//     marginBottom: 4,
//   },
//   infoValue: {
//     fontSize: 16,
//     color: "#1a1a1a",
//     lineHeight: 22,
//   },
//   actions: {
//     padding: 16,
//   },
//   actionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#e5e5e5",
//   },
//   deleteButton: {
//     borderColor: "#FF3B30",
//   },
//   actionText: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginLeft: 8,
//   },
//   deleteText: {
//     color: "#FF3B30",
//   },
// });

//
// import { supabase } from "@/config/SupabaseConfig";
// import { Medicine } from "@/types/medicine";
// import { useUser } from "@clerk/clerk-expo";
// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   useColorScheme,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function MedicineDetailScreen() {
//   const { id } = useLocalSearchParams();
//   const { user } = useUser();
//   const router = useRouter();
//   const colorScheme = useColorScheme() as "light" | "dark" | null;
//   const styles = createStyles(colorScheme);
//   const [medicine, setMedicine] = useState<Medicine | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchMedicine();
//   }, [id]);

//   const fetchMedicine = async () => {
//     if (!user || !id) return;

//     try {
//       // First, get the user's UUID from the database
//       const { data: userData, error: userError } = await supabase
//         .from("users")
//         .select("id")
//         .eq("clerk_user_id", user.id)
//         .single();

//       if (userError || !userData) {
//         console.error("User not found in database:", userError);
//         Alert.alert("Error", "User not found in database");
//         return;
//       }

//       // Now fetch the medicine using the UUID
//       const { data, error } = await supabase
//         .from("medicines")
//         .select("*")
//         .eq("id", id)
//         .eq("user_id", userData.id)
//         .single();

//       if (error) throw error;
//       setMedicine(data);
//     } catch (error) {
//       console.error("Error fetching medicine:", error);
//       Alert.alert("Error", "Failed to load medicine details");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteMedicine = async () => {
//     // Get user UUID first, then use it in the delete query
//     const { data: userData } = await supabase
//       .from("users")
//       .select("id")
//       .eq("clerk_user_id", user?.id)
//       .single();

//     if (!userData) return;

//     const { error } = await supabase
//       .from("medicines")
//       .delete()
//       .eq("id", id)
//       .eq("user_id", userData.id);
//   };

//   const getExpiryStatus = () => {
//     if (!medicine?.expiry_date) return "unknown";

//     const expiry = new Date(medicine.expiry_date);
//     const today = new Date();
//     const thirtyDaysFromNow = new Date(
//       today.getTime() + 30 * 24 * 60 * 60 * 1000
//     );

//     if (expiry < today) return "expired";
//     if (expiry <= thirtyDaysFromNow) return "expiring";
//     return "good";
//   };

//   const formatDate = (dateString?: string) => {
//     if (!dateString) return "Not specified";
//     return new Date(dateString).toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "long",
//       year: "numeric",
//     });
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.center}>
//           <ActivityIndicator size="large" color={styles.primary.color} />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (!medicine) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.center}>
//           <Text style={styles.errorText}>Medicine not found</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const expiryStatus = getExpiryStatus();
//   const statusColor =
//     expiryStatus === "expired"
//       ? "#FF3B30"
//       : expiryStatus === "expiring"
//       ? "#FF9500"
//       : "#34C759";

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView style={styles.container}>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity
//             onPress={() => router.back()}
//             style={styles.backButton}
//           >
//             <Ionicons
//               name="arrow-back"
//               size={24}
//               color={styles.primary.color}
//             />
//           </TouchableOpacity>
//           <Text style={styles.title}>Medicine Details</Text>
//           <TouchableOpacity
//             onPress={() =>
//               router.push(`/medicines/edit?id=${medicine.id}` as any)
//             }
//           >
//             <Ionicons
//               name="create-outline"
//               size={24}
//               color={styles.primary.color}
//             />
//           </TouchableOpacity>
//         </View>

//         {/* Medicine Info Card */}
//         <View style={styles.card}>
//           <Text style={styles.medicineName}>{medicine.name}</Text>

//           {medicine.generic_name && (
//             <Text style={styles.genericName}>{medicine.generic_name}</Text>
//           )}

//           <View style={styles.detailSection}>
//             <DetailRow
//               icon="fitness"
//               label="Strength"
//               value={medicine.strength}
//               styles={styles}
//             />
//             <DetailRow
//               icon="cube"
//               label="Quantity"
//               value={`${medicine.current_quantity} ${
//                 medicine.unit_type || "units"
//               }`}
//               styles={styles}
//             />
//             <DetailRow
//               icon="calendar"
//               label="Expiry Date"
//               value={formatDate(medicine.expiry_date)}
//               valueColor={statusColor}
//               styles={styles}
//             />
//             <DetailRow
//               icon="business"
//               label="Manufacturer"
//               value={medicine.manufacturer}
//               styles={styles}
//             />
//             <DetailRow
//               icon="barcode"
//               label="Batch Number"
//               value={medicine.batch_number}
//               styles={styles}
//             />
//           </View>
//         </View>

//         {/* Additional Details */}
//         {(medicine.dosage_instructions || medicine.notes) && (
//           <View style={styles.card}>
//             <Text style={styles.sectionTitle}>Additional Information</Text>

//             {medicine.dosage_instructions && (
//               <View style={styles.infoItem}>
//                 <Text style={styles.infoLabel}>Dosage Instructions</Text>
//                 <Text style={styles.infoValue}>
//                   {medicine.dosage_instructions}
//                 </Text>
//               </View>
//             )}

//             {medicine.notes && (
//               <View style={styles.infoItem}>
//                 <Text style={styles.infoLabel}>Notes</Text>
//                 <Text style={styles.infoValue}>{medicine.notes}</Text>
//               </View>
//             )}
//           </View>
//         )}

//         {/* Actions */}
//         <View style={styles.actions}>
//           <TouchableOpacity
//             style={[styles.actionButton, styles.deleteButton]}
//             onPress={deleteMedicine}
//           >
//             <Ionicons name="trash-outline" size={20} color="#FF3B30" />
//             <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const DetailRow = ({
//   icon,
//   label,
//   value,
//   valueColor,
//   styles,
// }: {
//   icon: string;
//   label: string;
//   value?: string;
//   valueColor?: string;
//   styles: any;
// }) =>
//   value ? (
//     <View style={styles.detailRow}>
//       <Ionicons name={icon as any} size={20} color={styles.detailIcon.color} />
//       <Text style={styles.detailLabel}>{label}:</Text>
//       <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>
//         {value}
//       </Text>
//     </View>
//   ) : null;

// const createStyles = (colorScheme: "light" | "dark" | null) =>
//   StyleSheet.create({
//     safeArea: {
//       flex: 1,
//       backgroundColor: colorScheme === "dark" ? "#000000" : "#f5f5f5",
//     },
//     container: {
//       flex: 1,
//       backgroundColor: colorScheme === "dark" ? "#000000" : "#f5f5f5",
//     },
//     center: {
//       flex: 1,
//       justifyContent: "center",
//       alignItems: "center",
//     },
//     errorText: {
//       color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
//       fontSize: 16,
//     },
//     primary: {
//       color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
//     },
//     header: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       paddingHorizontal: 20,
//       paddingTop: 20,
//       paddingBottom: 16,
//       backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
//     },
//     backButton: {
//       padding: 4,
//     },
//     title: {
//       fontSize: 18,
//       fontWeight: "600",
//       color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
//     },
//     card: {
//       backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
//       margin: 16,
//       padding: 20,
//       borderRadius: 12,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
//       shadowRadius: 4,
//       elevation: 3,
//     },
//     medicineName: {
//       fontSize: 24,
//       fontWeight: "bold",
//       color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
//       marginBottom: 4,
//     },
//     genericName: {
//       fontSize: 16,
//       color: colorScheme === "dark" ? "#8E8E93" : "#666",
//       fontStyle: "italic",
//       marginBottom: 16,
//     },
//     detailSection: {
//       marginTop: 8,
//     },
//     detailRow: {
//       flexDirection: "row",
//       alignItems: "center",
//       marginBottom: 12,
//     },
//     detailIcon: {
//       color: colorScheme === "dark" ? "#8E8E93" : "#666",
//     },
//     detailLabel: {
//       fontSize: 16,
//       color: colorScheme === "dark" ? "#8E8E93" : "#666",
//       marginLeft: 8,
//       marginRight: 4,
//       width: 100,
//     },
//     detailValue: {
//       fontSize: 16,
//       fontWeight: "500",
//       color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
//       flex: 1,
//     },
//     sectionTitle: {
//       fontSize: 18,
//       fontWeight: "600",
//       color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
//       marginBottom: 16,
//     },
//     infoItem: {
//       marginBottom: 16,
//     },
//     infoLabel: {
//       fontSize: 14,
//       fontWeight: "500",
//       color: colorScheme === "dark" ? "#8E8E93" : "#666",
//       marginBottom: 4,
//     },
//     infoValue: {
//       fontSize: 16,
//       color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
//       lineHeight: 22,
//     },
//     actions: {
//       padding: 16,
//       paddingBottom: 100, // Extra padding for bottom tab bar
//     },
//     actionButton: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "center",
//       padding: 16,
//       borderRadius: 12,
//       borderWidth: 1,
//       borderColor: colorScheme === "dark" ? "#38383A" : "#e5e5e5",
//     },
//     deleteButton: {
//       borderColor: "#FF3B30",
//     },
//     actionText: {
//       fontSize: 16,
//       fontWeight: "600",
//       marginLeft: 8,
//     },
//     deleteText: {
//       color: "#FF3B30",
//     },
//   });

//
import { supabase } from "@/config/SupabaseConfig";
import { MedicineChatService } from "@/services/ai/medicineChatService";
import { Medicine } from "@/types/medicine";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MedicineDetailWithChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const chatService = MedicineChatService.getInstance();
  const scrollViewRef = useRef<ScrollView>(null);

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  // Chat state
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [question, setQuestion] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("english");

  useEffect(() => {
    fetchMedicine();
  }, [id]);

  const fetchMedicine = async () => {
    if (!user || !id) return;

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
        .from("medicines")
        .select("*")
        .eq("id", id)
        .eq("user_id", userData.id)
        .single();

      if (error) throw error;
      setMedicine(data);
    } catch (error) {
      console.error("Error fetching medicine:", error);
      Alert.alert("Error", "Failed to load medicine details");
    } finally {
      setLoading(false);
    }
  };

  const deleteMedicine = async () => {
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", user?.id)
      .single();

    if (!userData) return;

    Alert.alert(
      "Delete Medicine",
      "Are you sure you want to delete this medicine?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("medicines")
              .delete()
              .eq("id", id)
              .eq("user_id", userData.id);

            if (!error) {
              router.back();
            }
          },
        },
      ]
    );
  };

  /**
   * Ask AI assistant about medicine
   */
  const handleAskQuestion = async () => {
    if (!question.trim() || !medicine) return;

    setAskingQuestion(true);
    const userQuestion = question.trim();
    setQuestion("");

    // Add user question to chat
    const newHistory = [
      ...chatHistory,
      { role: "user", content: userQuestion },
    ];
    setChatHistory(newHistory);

    try {
      // Get AI response
      const response = await chatService.askAboutMedicine(
        medicine,
        userQuestion,
        chatHistory
      );

      // Add AI response to chat
      setChatHistory([
        ...newHistory,
        { role: "assistant", content: response.answer },
      ]);
      setCurrentLanguage(response.language);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Chat error:", error);
      Alert.alert("Error", "Failed to get answer");
    } finally {
      setAskingQuestion(false);
    }
  };

  /**
   * Speak the last AI response
   */
  const handleSpeak = async (text: string) => {
    if (isSpeaking) {
      await chatService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      await chatService.speakAnswer(text, currentLanguage);
      setIsSpeaking(false);
    }
  };

  /**
   * Quick question buttons
   */
  const handleQuickQuestion = (quickQ: string) => {
    setQuestion(quickQ);
  };

  const getExpiryStatus = () => {
    if (!medicine?.expiry_date) return "unknown";
    const expiry = new Date(medicine.expiry_date);
    const today = new Date();
    const thirtyDaysFromNow = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    if (expiry < today) return "expired";
    if (expiry <= thirtyDaysFromNow) return "expiring";
    return "good";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={styles.primary.color} />
        </View>
      </SafeAreaView>
    );
  }

  if (!medicine) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Medicine not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const expiryStatus = getExpiryStatus();
  const statusColor =
    expiryStatus === "expired"
      ? "#FF3B30"
      : expiryStatus === "expiring"
      ? "#FF9500"
      : "#34C759";

  const quickQuestions = chatService.getQuickQuestions(
    medicine,
    currentLanguage
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={styles.primary.color}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Medicine Details</Text>
          <TouchableOpacity
            onPress={() =>
              router.push(`/medicines/edit?id=${medicine.id}` as any)
            }
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={styles.primary.color}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={{ paddingBottom: showChat ? 20 : 100 }}
        >
          {/* Medicine Info Card */}
          <View style={styles.card}>
            <Text style={styles.medicineName}>{medicine.name}</Text>
            {medicine.generic_name && (
              <Text style={styles.genericName}>{medicine.generic_name}</Text>
            )}

            <View style={styles.detailSection}>
              <DetailRow
                icon="fitness"
                label="Strength"
                value={medicine.strength}
                styles={styles}
              />
              <DetailRow
                icon="cube"
                label="Quantity"
                value={`${medicine.current_quantity} ${
                  medicine.unit_type || "units"
                }`}
                styles={styles}
              />
              <DetailRow
                icon="calendar"
                label="Expiry Date"
                value={formatDate(medicine.expiry_date)}
                valueColor={statusColor}
                styles={styles}
              />
              <DetailRow
                icon="business"
                label="Manufacturer"
                value={medicine.manufacturer}
                styles={styles}
              />
              <DetailRow
                icon="barcode"
                label="Batch Number"
                value={medicine.batch_number}
                styles={styles}
              />
            </View>
          </View>

          {/* AI Assistant Button */}
          <TouchableOpacity
            style={[
              styles.chatToggleButton,
              showChat && styles.chatToggleButtonActive,
            ]}
            onPress={() => setShowChat(!showChat)}
          >
            <Ionicons
              name={showChat ? "chatbubbles" : "chatbubbles-outline"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.chatToggleText}>
              {showChat ? "Hide AI Assistant" : "Ask AI About This Medicine"}
            </Text>
          </TouchableOpacity>

          {/* AI Chat Interface */}
          {showChat && (
            <View style={styles.chatContainer}>
              {/* Quick Questions */}
              {chatHistory.length === 0 && (
                <View style={styles.quickQuestionsContainer}>
                  <Text style={styles.quickQuestionsTitle}>
                    Quick Questions:
                  </Text>
                  {quickQuestions.map((q, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickQuestionButton}
                      onPress={() => handleQuickQuestion(q)}
                    >
                      <Text style={styles.quickQuestionText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Chat Messages */}
              {chatHistory.map((msg, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageContainer,
                    msg.role === "user"
                      ? styles.userMessage
                      : styles.assistantMessage,
                  ]}
                >
                  <Text style={styles.messageText}>{msg.content}</Text>
                  {msg.role === "assistant" && (
                    <TouchableOpacity
                      style={styles.speakButton}
                      onPress={() => handleSpeak(msg.content)}
                    >
                      <Ionicons
                        name={isSpeaking ? "stop-circle" : "volume-high"}
                        size={20}
                        color={styles.primary.color}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {askingQuestion && (
                <View
                  style={[styles.messageContainer, styles.assistantMessage]}
                >
                  <ActivityIndicator
                    size="small"
                    color={styles.primary.color}
                  />
                  <Text style={[styles.messageText, { marginLeft: 10 }]}>
                    Thinking...
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Chat Input (only shown when chat is open) */}
        {showChat && (
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask about this medicine... (Any language)"
              placeholderTextColor={isDark ? "#636366" : "#999"}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !question.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleAskQuestion}
              disabled={!question.trim() || askingQuestion}
            >
              {askingQuestion ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons (only when chat is closed) */}
        {!showChat && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={deleteMedicine}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const DetailRow = ({ icon, label, value, valueColor, styles }: any) =>
  value ? (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={20} color={styles.detailIcon.color} />
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  ) : null;

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? "#000000" : "#f5f5f5",
    },
    container: {
      flex: 1,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      fontSize: 16,
    },
    primary: {
      color: isDark ? "#0A84FF" : "#007AFF",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDark ? "#1C1C1E" : "white",
    },
    backButton: {
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
    },
    content: {
      flex: 1,
    },
    card: {
      backgroundColor: isDark ? "#1C1C1E" : "white",
      margin: 16,
      padding: 20,
      borderRadius: 12,
    },
    medicineName: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 4,
    },
    genericName: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#666",
      fontStyle: "italic",
      marginBottom: 16,
    },
    detailSection: {
      marginTop: 8,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    detailIcon: {
      color: isDark ? "#8E8E93" : "#666",
    },
    detailLabel: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#666",
      marginLeft: 8,
      marginRight: 4,
      width: 100,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      flex: 1,
    },
    chatToggleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#0A84FF" : "#007AFF",
      marginHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    chatToggleButtonActive: {
      backgroundColor: isDark ? "#30D158" : "#28A745",
    },
    chatToggleText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    chatContainer: {
      marginHorizontal: 16,
      marginTop: 16,
    },
    quickQuestionsContainer: {
      marginBottom: 16,
    },
    quickQuestionsTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#8E8E93" : "#666",
      marginBottom: 8,
    },
    quickQuestionButton: {
      backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    quickQuestionText: {
      fontSize: 14,
      color: isDark ? "#FFFFFF" : "#1a1a1a",
    },
    messageContainer: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 12,
      maxWidth: "85%",
    },
    userMessage: {
      alignSelf: "flex-end",
      backgroundColor: isDark ? "#0A84FF" : "#007AFF",
    },
    assistantMessage: {
      alignSelf: "flex-start",
      backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
    },
    messageText: {
      fontSize: 15,
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      lineHeight: 20,
    },
    speakButton: {
      marginTop: 8,
      alignSelf: "flex-start",
    },
    chatInputContainer: {
      flexDirection: "row",
      padding: 16,
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: isDark ? "#38383A" : "#E5E5E7",
      alignItems: "flex-end",
    },
    chatInput: {
      flex: 1,
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 8,
      maxHeight: 100,
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#1a1a1a",
    },
    sendButton: {
      backgroundColor: isDark ? "#0A84FF" : "#007AFF",
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    actions: {
      padding: 16,
      paddingBottom: Platform.OS === "android" ? 30 : 16,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#e5e5e5",
    },
    deleteButton: {
      borderColor: "#FF3B30",
    },
    actionText: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    deleteText: {
      color: "#FF3B30",
    },
  });
