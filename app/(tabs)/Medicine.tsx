// import EmptyState from "@/components/medicine/EmptyState";
// import FilterBar from "@/components/medicine/FilterBar";
// import MedicineCard from "@/components/medicine/MedicineCard";
// import { supabase } from "@/config/SupabaseConfig";
// import { Medicine } from "@/types/medicine";
// import { useUser } from "@clerk/clerk-expo";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// export default function MedicinesScreen() {
//   const { user } = useUser();
//   const router = useRouter();
//   const [medicines, setMedicines] = useState<Medicine[]>([]);
//   const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [activeFilter, setActiveFilter] = useState<
//     "all" | "active" | "expired" | "expiring"
//   >("all");
//   const [searchQuery, setSearchQuery] = useState("");

//   // Fetch user's medicines
//   const fetchMedicines = async () => {
//     if (!user) return;

//     try {
//       // First, ensure user exists in database
//       let { data: userData, error: userError } = await supabase
//         .from("users")
//         .select("id")
//         .eq("clerk_user_id", user.id)
//         .single();

//       // If user doesn't exist, create them
//       if (userError && userError.code === "PGRST116") {
//         console.log("Creating new user record for:", user.id);

//         // Generate a unique email if needed
//         const baseEmail = user.emailAddresses[0]?.emailAddress || "";
//         const uniqueEmail = baseEmail
//           ? `${user.id}_${baseEmail}`
//           : `${user.id}@temp.com`;

//         const { data: newUser, error: createError } = await supabase
//           .from("users")
//           .insert([
//             {
//               clerk_user_id: user.id,
//               email: uniqueEmail, // Use unique email
//               full_name: user.fullName || "User",
//               first_name: user.firstName || "User",
//               last_name: user.lastName || "",
//               country: "GB",
//               timezone: "Asia/Kolkata",
//             },
//           ])
//           .select("id")
//           .single();

//         if (createError) {
//           console.error("Error creating user:", createError);
//           throw createError;
//         }
//         userData = newUser;
//         console.log("Created user with ID:", userData.id);
//       } else if (userError) {
//         throw userError;
//       }

//       // Now fetch medicines using the UUID
//       const { data, error } = await supabase
//         .from("medicines")
//         .select("*")
//         .eq("user_id", userData?.id)
//         .order("expiry_date", { ascending: true });

//       if (error) throw error;

//       setMedicines(data || []);
//       applyFilters(data || [], activeFilter, searchQuery);
//     } catch (error) {
//       console.error("Error fetching medicines:", error);
//       Alert.alert("Error", "Failed to load medicines");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };
//   // Apply filters and search
//   const applyFilters = (meds: Medicine[], filter: string, query: string) => {
//     let filtered = meds;

//     // Apply status filter
//     switch (filter) {
//       case "active":
//         filtered = filtered.filter((m) => m.status === "active");
//         break;
//       case "expired":
//         filtered = filtered.filter(
//           (m) => m.expiry_date && new Date(m.expiry_date) < new Date()
//         );
//         break;
//       case "expiring":
//         filtered = filtered.filter(
//           (m) =>
//             m.expiry_date &&
//             new Date(m.expiry_date) > new Date() &&
//             new Date(m.expiry_date) <=
//               new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
//         );
//         break;
//     }

//     // Apply search query
//     if (query) {
//       filtered = filtered.filter(
//         (m) =>
//           m.name.toLowerCase().includes(query.toLowerCase()) ||
//           m.generic_name?.toLowerCase().includes(query.toLowerCase()) ||
//           m.brand_name?.toLowerCase().includes(query.toLowerCase())
//       );
//     }

//     setFilteredMedicines(filtered);
//   };

//   useEffect(() => {
//     fetchMedicines();
//   }, [user]);

//   useEffect(() => {
//     applyFilters(medicines, activeFilter, searchQuery);
//   }, [activeFilter, searchQuery, medicines]);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchMedicines();
//   };

//   const getStats = () => {
//     const total = medicines.length;
//     const expired = medicines.filter(
//       (m) => m.expiry_date && new Date(m.expiry_date) < new Date()
//     ).length;
//     const expiring = medicines.filter(
//       (m) =>
//         m.expiry_date &&
//         new Date(m.expiry_date) > new Date() &&
//         new Date(m.expiry_date) <=
//           new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//     ).length;

//     return { total, expired, expiring };
//   };

//   const stats = getStats();

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading your medicines...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.title}>My Medicines</Text>
//         <TouchableOpacity
//           style={styles.addButton}
//           onPress={() => router.push("/medicines/add" as any)}
//         >
//           <Ionicons name="add" size={24} color="white" />
//         </TouchableOpacity>
//       </View>

//       {/* Stats Overview */}
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         style={styles.statsContainer}
//       >
//         <View style={styles.statCard}>
//           <Text style={styles.statNumber}>{stats.total}</Text>
//           <Text style={styles.statLabel}>Total</Text>
//         </View>
//         <View style={styles.statCard}>
//           <Text style={[styles.statNumber, styles.expiring]}>
//             {stats.expiring}
//           </Text>
//           <Text style={styles.statLabel}>Expiring Soon</Text>
//         </View>
//         <View style={styles.statCard}>
//           <Text style={[styles.statNumber, styles.expired]}>
//             {stats.expired}
//           </Text>
//           <Text style={styles.statLabel}>Expired</Text>
//         </View>
//       </ScrollView>

//       {/* Filter Bar */}
//       <FilterBar
//         activeFilter={activeFilter}
//         onFilterChange={setActiveFilter}
//         searchQuery={searchQuery}
//         onSearchChange={setSearchQuery}
//       />

//       {/* Medicines List */}
//       {filteredMedicines.length === 0 ? (
//         <EmptyState
//           filter={activeFilter}
//           searchQuery={searchQuery}
//           onAddMedicine={() => router.push("/medicines/add" as any)}
//         />
//       ) : (
//         <FlatList
//           data={filteredMedicines}
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => (
//             <MedicineCard
//               medicine={item}
//               onPress={() => router.push(`/medicines/${item.id}` as any)}
//             />
//           )}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//           }
//           contentContainerStyle={styles.listContent}
//           showsVerticalScrollIndicator={false}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//   flex: 1,
//   backgroundColor: '#f5f5f5',
//   paddingBottom: 25, // Add this to account for bottom tab + floating button
// },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: "#666",
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
//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     color: "#1a1a1a",
//   },
//   addButton: {
//     backgroundColor: "#007AFF",
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#007AFF",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   statsContainer: {
//   paddingHorizontal: 20,
//   paddingVertical: 16,
//   backgroundColor: 'white',
//   minHeight: 100, // Add minimum height
// },
// statCard: {
//   backgroundColor: '#f8f9fa',
//   padding: 16,
//   borderRadius: 12,
//   marginRight: 12,
//   minWidth: 100,
//   alignItems: 'center',
//   justifyContent: 'center', // Add this
//   minHeight: 80, // Add minimum height
// },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#1a1a1a",
//   },
//   expiring: {
//     color: "#FF9500",
//   },
//   expired: {
//     color: "#FF3B30",
//   },
//   statLabel: {
//     fontSize: 12,
//     color: "#666",
//     marginTop: 4,
//   },
//   listContent: {
//     padding: 16,
//   },
// });

//
// import EmptyState from "@/components/medicine/EmptyState";
// import FilterBar from "@/components/medicine/FilterBar";
// import MedicineCard from "@/components/medicine/MedicineCard";
// import { supabase } from "@/config/SupabaseConfig";
// import { Medicine } from "@/types/medicine";
// import { useUser } from "@clerk/clerk-expo";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   RefreshControl,
//   SafeAreaView,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   useColorScheme,
//   View,
//   Platform,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// export default function MedicinesScreen() {
//   const { user } = useUser();
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const [medicines, setMedicines] = useState<Medicine[]>([]);
//   const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [activeFilter, setActiveFilter] = useState<
//     "all" | "active" | "expired" | "expiring"
//   >("all");
//   const [searchQuery, setSearchQuery] = useState("");

//   // Fetch user's medicines (INTENTIONAL: logic unchanged)
//   const fetchMedicines = async () => {
//     if (!user) return;

//     try {
//       let { data: userData, error: userError } = await supabase
//         .from("users")
//         .select("id")
//         .eq("clerk_user_id", user.id)
//         .single();

//       if (userError && userError.code === "PGRST116") {
//         const baseEmail = user.emailAddresses[0]?.emailAddress || "";
//         const uniqueEmail = baseEmail
//           ? `${user.id}_${baseEmail}`
//           : `${user.id}@temp.com`;

//         const { data: newUser, error: createError } = await supabase
//           .from("users")
//           .insert([
//             {
//               clerk_user_id: user.id,
//               email: uniqueEmail,
//               full_name: user.fullName || "User",
//               first_name: user.firstName || "User",
//               last_name: user.lastName || "",
//               country: "GB",
//               timezone: "Asia/Kolkata",
//             },
//           ])
//           .select("id")
//           .single();

//         if (createError) {
//           console.error("Error creating user:", createError);
//           throw createError;
//         }
//         userData = newUser;
//       } else if (userError) {
//         throw userError;
//       }

//       const { data, error } = await supabase
//         .from("medicines")
//         .select("*")
//         .eq("user_id", userData?.id)
//         .order("expiry_date", { ascending: true });

//       if (error) throw error;

//       setMedicines(data || []);
//       applyFilters(data || [], activeFilter, searchQuery);
//     } catch (error) {
//       console.error("Error fetching medicines:", error);
//       Alert.alert("Error", "Failed to load medicines");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const applyFilters = (meds: Medicine[], filter: string, query: string) => {
//     let filtered = meds;

//     switch (filter) {
//       case "active":
//         filtered = filtered.filter((m) => m.status === "active");
//         break;
//       case "expired":
//         filtered = filtered.filter(
//           (m) => m.expiry_date && new Date(m.expiry_date) < new Date()
//         );
//         break;
//       case "expiring":
//         filtered = filtered.filter(
//           (m) =>
//             m.expiry_date &&
//             new Date(m.expiry_date) > new Date() &&
//             new Date(m.expiry_date) <=
//               new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//         );
//         break;
//     }

//     if (query) {
//       filtered = filtered.filter(
//         (m) =>
//           m.name.toLowerCase().includes(query.toLowerCase()) ||
//           m.generic_name?.toLowerCase().includes(query.toLowerCase()) ||
//           m.brand_name?.toLowerCase().includes(query.toLowerCase())
//       );
//     }

//     setFilteredMedicines(filtered);
//   };

//   useEffect(() => {
//     fetchMedicines();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user]);

//   useEffect(() => {
//     applyFilters(medicines, activeFilter, searchQuery);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [activeFilter, searchQuery, medicines]);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchMedicines();
//   };

//   const getStats = () => {
//     const total = medicines.length;
//     const expired = medicines.filter(
//       (m) => m.expiry_date && new Date(m.expiry_date) < new Date()
//     ).length;
//     const expiring = medicines.filter(
//       (m) =>
//         m.expiry_date &&
//         new Date(m.expiry_date) > new Date() &&
//         new Date(m.expiry_date) <=
//           new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//     ).length;

//     return { total, expired, expiring };
//   };

//   const stats = getStats();

//   // UI-only: system theme
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === "dark";

//   if (loading) {
//     return (
//       <SafeAreaView
//         style={[styles.center, { backgroundColor: isDark ? "#0b0b0d" : "#f5f5f5" }]}
//       >
//         <ActivityIndicator size="large" color={isDark ? "#5FD0D8" : "#007AFF"} />
//         <Text style={[styles.loadingText, { color: isDark ? "#ccc" : "#666" }]}>
//           Loading your medicines...
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView
//       style={[styles.container, { backgroundColor: isDark ? "#050507" : "#fbfbfc" }]}
//     >
//       {/* Decorative background "bend/logo" */}
//       <View
//         pointerEvents="none"
//         style={[
//           styles.bgBend,
//           {
//             backgroundColor: isDark ? "rgba(45,137,255,0.06)" : "rgba(0,122,255,0.06)",
//             transform: [{ rotate: "-16deg" }],
//           },
//         ]}
//       />

//       {/* Header */}
//       <View
//         style={[
//           styles.header,
//           { backgroundColor: isDark ? "#07070a" : "white", borderBottomWidth: 0 },
//         ]}
//       >
//         <Text style={[styles.title, { color: isDark ? "#fff" : "#1a1a1a" }]}>
//           My Medicines
//         </Text>

//         {/* header add stays — unchanged logic but force it above other elements */}
//         <TouchableOpacity
//           style={[
//             styles.addButton,
//             {
//               backgroundColor: isDark ? "#2D89FF" : "#007AFF",
//               shadowColor: isDark ? "#2D89FF" : "#007AFF",
//               zIndex: 20,
//             },
//           ]}
//           onPress={() => router.push("/medicines/add" as any)}
//           accessibilityLabel="Add medicine"
//         >
//           <Ionicons name="add" size={24} color="white" />
//         </TouchableOpacity>
//       </View>

//       {/* Stats Overview — fixed height so it won't jump */}
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         style={[
//           styles.statsContainer,
//           { backgroundColor: isDark ? "#07070a" : "white" },
//         ]}
//         contentContainerStyle={{ alignItems: "center", paddingHorizontal: 16 }}
//       >
//         <View style={[styles.statCard, isDark && styles.statCardDark]}>
//           <Text style={[styles.statNumber, { color: isDark ? "#fff" : "#1a1a1a" }]}>{stats.total}</Text>
//           <Text style={[styles.statLabel, { color: isDark ? "#b8b8bf" : "#666" }]}>Total</Text>
//         </View>

//         <View style={[styles.statCard, isDark && styles.statCardDark]}>
//           <Text style={[styles.statNumber, styles.expiring, { color: isDark ? "#FFB86B" : "#FF9500" }]}>
//             {stats.expiring}
//           </Text>
//           <Text style={[styles.statLabel, { color: isDark ? "#b8b8bf" : "#666" }]}>Expiring Soon</Text>
//         </View>

//         <View style={[styles.statCard, isDark && styles.statCardDark]}>
//           <Text style={[styles.statNumber, styles.expired, { color: isDark ? "#FF6B6B" : "#FF3B30" }]}>
//             {stats.expired}
//           </Text>
//           <Text style={[styles.statLabel, { color: isDark ? "#b8b8bf" : "#666" }]}>Expired</Text>
//         </View>
//       </ScrollView>

//       {/* Filter Bar */}
//       <FilterBar
//         activeFilter={activeFilter}
//         onFilterChange={setActiveFilter}
//         searchQuery={searchQuery}
//         onSearchChange={setSearchQuery}
//       />

//       {/* Medicines List or Empty */}
//       {filteredMedicines.length === 0 ? (
//         <EmptyState
//           filter={activeFilter}
//           searchQuery={searchQuery}
//           onAddMedicine={() => router.push("/medicines/add" as any)}
//         />
//       ) : (
//         <FlatList
//           data={filteredMedicines}
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => (
//             <MedicineCard
//               medicine={item}
//               onPress={() => router.push(`/medicines/${item.id}` as any)}
//             />
//           )}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//           }
//           contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 110 }]}
//           showsVerticalScrollIndicator={false}
//         />
//       )}

//       {/* Floating Add FAB — sits above bottom tab using safe area inset */}
//       <TouchableOpacity
//         onPress={() => router.push("/medicines/add" as any)}
//         activeOpacity={0.85}
//         style={[
//           styles.fab,
//           {
//             bottom: (Platform.OS === "ios" ? insets.bottom : insets.bottom) + 18,
//             right: 16,
//             backgroundColor: isDark ? "#2D89FF" : "#007AFF",
//             shadowColor: isDark ? "#2D89FF" : "#007AFF",
//             zIndex: 99,
//           },
//         ]}
//       >
//         <Ionicons name="add" size={28} color="#fff" />
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingTop: 6,
//     paddingBottom: 10,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//   },
//   addButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.25,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   statsContainer: {
//     height: 96, // fixed so it doesn't resize when content below changes
//     paddingVertical: 8,
//   },
//   statCard: {
//     backgroundColor: "#f8f9fa",
//     paddingHorizontal: 16,
//     height: 80, // fixed height
//     borderRadius: 12,
//     marginRight: 12,
//     minWidth: 110,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   statCardDark: {
//     backgroundColor: "#0b0b0d",
//     borderWidth: 1,
//     borderColor: "#111214",
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: "bold",
//   },
//   expiring: {},
//   expired: {},
//   statLabel: {
//     fontSize: 12,
//     marginTop: 4,
//   },
//   listContent: {
//     padding: 16,
//   },

//   fab: {
//     position: "absolute",
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 10,
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.25,
//     shadowRadius: 12,
//   },

//   bgBend: {
//     position: "absolute",
//     top: -40,
//     right: -120,
//     width: 320,
//     height: 320,
//     borderRadius: 160,
//     opacity: 1,
//   },
// });

//
import EmptyState from "@/components/medicine/EmptyState";
import FilterBar from "@/components/medicine/FilterBar";
import MedicineCard from "@/components/medicine/MedicineCard";
import { supabase } from "@/config/SupabaseConfig";
import { Medicine } from "@/types/medicine";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MedicinesScreen() {
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "expired" | "expiring"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user's medicines (INTENTIONAL: logic unchanged)
  const fetchMedicines = async () => {
    if (!user) return;

    try {
      let { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError && userError.code === "PGRST116") {
        const baseEmail = user.emailAddresses[0]?.emailAddress || "";
        const uniqueEmail = baseEmail
          ? `${user.id}_${baseEmail}`
          : `${user.id}@temp.com`;

        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              clerk_user_id: user.id,
              email: uniqueEmail,
              full_name: user.fullName || "User",
              first_name: user.firstName || "User",
              last_name: user.lastName || "",
              country: "GB",
              timezone: "Asia/Kolkata",
            },
          ])
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating user:", createError);
          throw createError;
        }
        userData = newUser;
      } else if (userError) {
        throw userError;
      }

      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("user_id", userData?.id)
        .order("expiry_date", { ascending: true });

      if (error) throw error;

      setMedicines(data || []);
      applyFilters(data || [], activeFilter, searchQuery);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      Alert.alert("Error", "Failed to load medicines");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (meds: Medicine[], filter: string, query: string) => {
    let filtered = meds;

    switch (filter) {
      case "active":
        filtered = filtered.filter((m) => m.status === "active");
        break;
      case "expired":
        filtered = filtered.filter(
          (m) => m.expiry_date && new Date(m.expiry_date) < new Date()
        );
        break;
      case "expiring":
        filtered = filtered.filter(
          (m) =>
            m.expiry_date &&
            new Date(m.expiry_date) > new Date() &&
            new Date(m.expiry_date) <=
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        );
        break;
    }

    if (query) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.generic_name?.toLowerCase().includes(query.toLowerCase()) ||
          m.brand_name?.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredMedicines(filtered);
  };

  useEffect(() => {
    fetchMedicines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    applyFilters(medicines, activeFilter, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, searchQuery, medicines]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedicines();
  };

  const getStats = () => {
    const total = medicines.length;
    const expired = medicines.filter(
      (m) => m.expiry_date && new Date(m.expiry_date) < new Date()
    ).length;
    const expiring = medicines.filter(
      (m) =>
        m.expiry_date &&
        new Date(m.expiry_date) > new Date() &&
        new Date(m.expiry_date) <=
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;

    return { total, expired, expiring };
  };

  const stats = getStats();

  // UI-only: system theme
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.center,
          { backgroundColor: isDark ? "#0b0b0d" : "#f5f5f5" },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#5FD0D8" : "#007AFF"}
        />
        <Text style={[styles.loadingText, { color: isDark ? "#ccc" : "#666" }]}>
          Loading your medicines...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#050507" : "#fbfbfc" },
      ]}
    >
      {/* Decorative background "bend/logo" */}
      <View
        pointerEvents="none"
        style={[
          styles.bgBend,
          {
            backgroundColor: isDark
              ? "rgba(45,137,255,0.06)"
              : "rgba(0,122,255,0.06)",
            transform: [{ rotate: "-16deg" }],
          },
        ]}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? "#07070a" : "white",
            borderBottomWidth: 0,
          },
        ]}
      >
        <Text style={[styles.title, { color: isDark ? "#fff" : "#1a1a1a" }]}>
          My Medicines
        </Text>

        {/* header add stays — unchanged logic */}
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: isDark ? "#2D89FF" : "#007AFF",
              shadowColor: isDark ? "#2D89FF" : "#007AFF",
              zIndex: 20,
            },
          ]}
          onPress={() => router.push("/medicines/add" as any)}
          accessibilityLabel="Add medicine"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview — fixed height so it won't jump */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.statsContainer,
          { backgroundColor: isDark ? "#07070a" : "white" },
        ]}
        contentContainerStyle={{ alignItems: "center", paddingHorizontal: 16 }}
      >
        <View style={[styles.statCard, isDark && styles.statCardDark]}>
          <Text
            style={[styles.statNumber, { color: isDark ? "#fff" : "#1a1a1a" }]}
          >
            {stats.total}
          </Text>
          <Text
            style={[styles.statLabel, { color: isDark ? "#b8b8bf" : "#666" }]}
          >
            Total
          </Text>
        </View>

        <View style={[styles.statCard, isDark && styles.statCardDark]}>
          <Text
            style={[
              styles.statNumber,
              styles.expiring,
              { color: isDark ? "#FFB86B" : "#FF9500" },
            ]}
          >
            {stats.expiring}
          </Text>
          <Text
            style={[styles.statLabel, { color: isDark ? "#b8b8bf" : "#666" }]}
          >
            Expiring Soon
          </Text>
        </View>

        <View style={[styles.statCard, isDark && styles.statCardDark]}>
          <Text
            style={[
              styles.statNumber,
              styles.expired,
              { color: isDark ? "#FF6B6B" : "#FF3B30" },
            ]}
          >
            {stats.expired}
          </Text>
          <Text
            style={[styles.statLabel, { color: isDark ? "#b8b8bf" : "#666" }]}
          >
            Expired
          </Text>
        </View>
      </ScrollView>

      {/* Filter Bar */}
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Medicines List or Empty */}
      {filteredMedicines.length === 0 ? (
        <EmptyState
          filter={activeFilter}
          searchQuery={searchQuery}
          onAddMedicine={() => router.push("/medicines/add" as any)}
        />
      ) : (
        <FlatList
          data={filteredMedicines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedicineCard
              medicine={item}
              onPress={() => router.push(`/medicines/${item.id}` as any)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingTop: 6,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  statsContainer: {
    height: 96, // fixed so it doesn't resize when content below changes
    paddingVertical: 8,
  },
  statCard: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    height: 80, // fixed height
    borderRadius: 12,
    marginRight: 12,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  statCardDark: {
    backgroundColor: "#0b0b0d",
    borderWidth: 1,
    borderColor: "#111214",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  expiring: {},
  expired: {},
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },

  /* FAB removed */

  bgBend: {
    position: "absolute",
    top: -40,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 1,
  },
});
