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
import { supabase } from "@/config/SupabaseConfig";
import { Medicine } from "@/types/medicine";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme() as "light" | "dark" | null;
  const styles = createStyles(colorScheme);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicine();
  }, [id]);

  const fetchMedicine = async () => {
    if (!user || !id) return;

    try {
      // First, get the user's UUID from the database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError || !userData) {
        console.error("User not found in database:", userError);
        Alert.alert("Error", "User not found in database");
        return;
      }

      // Now fetch the medicine using the UUID
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
    // Get user UUID first, then use it in the delete query
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", user?.id)
      .single();

    if (!userData) return;

    const { error } = await supabase
      .from("medicines")
      .delete()
      .eq("id", id)
      .eq("user_id", userData.id);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
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

        {/* Additional Details */}
        {(medicine.dosage_instructions || medicine.notes) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            {medicine.dosage_instructions && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Dosage Instructions</Text>
                <Text style={styles.infoValue}>
                  {medicine.dosage_instructions}
                </Text>
              </View>
            )}

            {medicine.notes && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoValue}>{medicine.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={deleteMedicine}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DetailRow = ({
  icon,
  label,
  value,
  valueColor,
  styles,
}: {
  icon: string;
  label: string;
  value?: string;
  valueColor?: string;
  styles: any;
}) =>
  value ? (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={20} color={styles.detailIcon.color} />
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  ) : null;

const createStyles = (colorScheme: "light" | "dark" | null) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#000000" : "#f5f5f5",
    },
    container: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#000000" : "#f5f5f5",
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      fontSize: 16,
    },
    primary: {
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
    },
    backButton: {
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
    },
    card: {
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
      margin: 16,
      padding: 20,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medicineName: {
      fontSize: 24,
      fontWeight: "bold",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 4,
    },
    genericName: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
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
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
    detailLabel: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
      marginLeft: 8,
      marginRight: 4,
      width: 100,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: "500",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 16,
    },
    infoItem: {
      marginBottom: 16,
    },
    infoLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      lineHeight: 22,
    },
    actions: {
      padding: 16,
      paddingBottom: 100, // Extra padding for bottom tab bar
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#38383A" : "#e5e5e5",
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
