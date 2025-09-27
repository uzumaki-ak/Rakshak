import { supabase } from "@/config/SupabaseConfig";
import { HealthProfile, UserProfile } from "@/types/profile";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme() as "light" | "dark" | null;
  const styles = createStyles(colorScheme);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, [clerkUser]);

  const fetchProfileData = async () => {
    if (!clerkUser) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_user_id", clerkUser.id)
        .single();

      if (userError) throw userError;
      setUserProfile(userData);

      const { data: healthData, error: healthError } = await supabase
        .from("user_health_profiles")
        .select("*")
        .eq("user_id", userData.id)
        .single();

      if (healthError && healthError.code !== "PGRST116") throw healthError;
      setHealthProfile(healthData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const getStatsSummary = () => {
    if (!healthProfile) return { allergies: 0, conditions: 0, medications: 0 };

    return {
      allergies: healthProfile.known_allergies?.length || 0,
      conditions: healthProfile.chronic_conditions?.length || 0,
      medications: healthProfile.current_medications?.length || 0,
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={styles.primary.color} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = getStatsSummary();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatarSection}>
            {userProfile?.avatar_url ? (
              <Image
                source={{ uri: userProfile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons
                  name="person"
                  size={40}
                  color={styles.primary.color}
                />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userProfile?.full_name || "User"}
              </Text>
              <Text style={styles.userEmail}>{userProfile?.email}</Text>
              <Text style={styles.memberSince}>
                Member since{" "}
                {new Date(userProfile?.created_at || "").getFullYear()}
              </Text>
            </View>
          </View>
        </View>

        {/* Health Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Overview</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push("/profile/health-profile" as any)}
            >
              <Ionicons name="medical" size={24} color="#FF6B6B" />
              <Text style={styles.statNumber}>{stats.allergies}</Text>
              <Text style={styles.statLabel}>Allergies</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push("/profile/health-profile" as any)}
            >
              <Ionicons name="heart" size={24} color="#4ECDC4" />
              <Text style={styles.statNumber}>{stats.conditions}</Text>
              <Text style={styles.statLabel}>Conditions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push("/profile/health-profile" as any)}
            >
              <Ionicons name="medkit" size={24} color="#45B7D1" />
              <Text style={styles.statNumber}>{stats.medications}</Text>
              <Text style={styles.statLabel}>Medications</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push("/profile/health-profile" as any)}
            >
              <Ionicons name="medical" size={24} color={styles.primary.color} />
              <Text style={styles.actionText}>Health Profile</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={styles.secondary.color}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push("/profile/emergency-contacts" as any)}
            >
              <Ionicons name="call" size={24} color="#FF9500" />
              <Text style={styles.actionText}>Emergency Contacts</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={styles.secondary.color}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push("/profile/notifications" as any)}
            >
              <Ionicons name="notifications" size={24} color="#5856D6" />
              <Text style={styles.actionText}>Notifications</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={styles.secondary.color}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push("/profile/settings" as any)}
            >
              <Ionicons
                name="settings"
                size={24}
                color={styles.secondary.color}
              />
              <Text style={styles.actionText}>App Settings</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={styles.secondary.color}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push("/profile/privacy" as any)}
            >
              <Ionicons name="shield-checkmark" size={24} color="#34C759" />
              <Text style={styles.actionText}>Privacy & Security</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={styles.secondary.color}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="help-circle" size={24} color="#8E8E93" />
              <Text style={styles.actionText}>Help & Support</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={styles.secondary.color}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>Medicine Assistant v1.0.0</Text>
          <Text style={styles.infoSubText}>Your smart health companion</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colorScheme: "light" | "dark" | null) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#000000" : "#f5f5f5",
    },
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
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
    header: {
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === "dark" ? "#38383A" : "#e5e5e5",
    },
    avatarSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colorScheme === "dark" ? "#2C2C2E" : "#e5e5e5",
      justifyContent: "center",
      alignItems: "center",
    },
    userInfo: {
      marginLeft: 16,
      flex: 1,
    },
    userName: {
      fontSize: 24,
      fontWeight: "bold",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
      marginBottom: 2,
    },
    memberSince: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#636366" : "#999",
    },
    section: {
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
      marginTop: 16,
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statCard: {
      alignItems: "center",
      flex: 1,
      padding: 12,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: "bold",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginTop: 8,
    },
    statLabel: {
      fontSize: 12,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
      marginTop: 4,
    },
    actionsList: {
      borderRadius: 12,
      overflow: "hidden",
    },
    actionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === "dark" ? "#38383A" : "#f0f0f0",
    },
    actionText: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginLeft: 12,
      flex: 1,
    },
    infoSection: {
      alignItems: "center",
      padding: 20,
      marginTop: 20,
    },
    infoText: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
    infoSubText: {
      fontSize: 12,
      color: colorScheme === "dark" ? "#636366" : "#999",
      marginTop: 4,
    },
    primary: {
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
    },
    secondary: {
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
  });
