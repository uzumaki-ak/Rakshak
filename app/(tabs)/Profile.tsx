import { supabase } from "@/config/SupabaseConfig";
import { HealthProfile, UserProfile } from "@/types/profile";
import { useAuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
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

import color from "@/shared/color";
import { LinearGradient } from "expo-linear-gradient";

/**
 * ProfileScreen
 * User profile and health summary dashboard.
 */
export default function ProfileScreen() {
  const { user, isLoading: authLoading, signOut: authSignOut } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    try {
      let { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      // If row doesn't exist yet, create it then use user_metadata as fallback
      if (userError && userError.code === 'PGRST116') {
        const { data: inserted } = await supabase.from('users').upsert({
          id: user.id,
          clerk_user_id: user.id,
          email: user.email ?? '',
          full_name: user.user_metadata?.full_name ?? null,
          is_active: true,
        }, { onConflict: 'id' }).select().single();
        userData = inserted;
      }

      // Merge table data with auth metadata as fallback
      setUserProfile({
        ...userData,
        full_name: userData?.full_name || user.user_metadata?.full_name || null,
        email: userData?.email || user.email || '',
      } as any);

      const { data: healthData, error: healthError } = await supabase
        .from("user_health_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (healthError && healthError.code !== "PGRST116") throw healthError;
      setHealthProfile(healthData);
    } catch (error) {
      console.error("Profile Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => {
        await authSignOut();
        router.replace("/");
      }},
    ]);
  };

  const StatCard = ({ icon, color: iconColor, label, count, isDark: statIsDark }: any) => (
    <View style={[styles.statCard, { backgroundColor: statIsDark ? "#1C1C1E" : "#FFFFFF" }]}>
      <View style={[styles.iconCircle, { backgroundColor: iconColor + "15" }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.statCount, { color: statIsDark ? "#FFFFFF" : "#1A1A1E" }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const MenuItem = ({ icon, label, onPress, isDark: menuIsDark, destructive }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconBox, { backgroundColor: menuIsDark ? "#2C2C2E" : "#F2F4F7" }]}>
        <Ionicons name={icon} size={20} color={destructive ? "#FF3B30" : (menuIsDark ? "#AEAEB2" : "#636366")} />
      </View>
      <Text style={[styles.menuLabel, { color: destructive ? "#FF3B30" : (menuIsDark ? "#FFFFFF" : "#1A1A1E") }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={menuIsDark ? "#3A3A3C" : "#C7C7CC"} />
    </TouchableOpacity>
  );

  if (loading || authLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
        <Text style={styles.loadingText}>Syncing profile...</Text>
      </SafeAreaView>
    );
  }

  const stats = {
    allergies: healthProfile?.known_allergies?.length || 0,
    conditions: healthProfile?.chronic_conditions?.length || 0,
    medications: healthProfile?.current_medications?.length || 0,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={isDark ? ["#1C1C1E", "#0A0A0C"] : ["#FFFFFF", "#F8FBFF"]} style={styles.headerCard}>
          <View style={styles.avatarWrapper}>
            {userProfile?.avatar_url ? (
              <Image source={{ uri: userProfile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}><Ionicons name="person" size={40} color={color.PRIMARY} /></View>
            )}
            <TouchableOpacity style={styles.editAvatarBtn}><Ionicons name="camera" size={16} color="white" /></TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userProfile?.full_name || "Rakshak User"}</Text>
          <Text style={styles.userEmail}>{userProfile?.email}</Text>
          <View style={styles.memberBadge}>
            <Ionicons name="shield-checkmark" size={14} color={color.PRIMARY} />
            <Text style={styles.memberSince}>Member since {new Date(userProfile?.created_at || "").getFullYear()}</Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="medical" color="#FF3B30" label="Allergies" count={stats.allergies} isDark={isDark} />
            <StatCard icon="heart" color="#34C759" label="Chronic" count={stats.conditions} isDark={isDark} />
            <StatCard icon="medkit" color={color.PRIMARY} label="Active Meds" count={stats.medications} isDark={isDark} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Health</Text>
          <View style={styles.menuList}>
            <MenuItem icon="person-outline" label="Personal Details" onPress={() => router.push("/profile/edit" as any)} isDark={isDark} />
            <MenuItem icon="heart-outline" label="Health Profile" onPress={() => router.push("/profile/health-profile" as any)} isDark={isDark} />
            <MenuItem icon="notifications-outline" label="Notification Settings" onPress={() => router.push("/profile/notifications" as any)} isDark={isDark} />
            <MenuItem icon="lock-closed-outline" label="Privacy & Security" onPress={() => router.push("/profile/privacy" as any)} isDark={isDark} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuList}>
            <MenuItem icon="help-circle-outline" label="Help Center" isDark={isDark} />
            <MenuItem icon="document-text-outline" label="Terms of Service" isDark={isDark} />
            <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleSignOut} isDark={isDark} destructive />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Rakshak v1.1.0</Text>
          <Text style={styles.creditText}>Securing your health journey</Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" },
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366" },
  headerCard: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: color.PRIMARY + "20" },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7", justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: color.PRIMARY + "20" },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: color.PRIMARY, width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: isDark ? "#1C1C1E" : "white" },
  userName: { fontSize: 24, fontFamily: "PoppinsRegular", fontWeight: 'bold', color: isDark ? "#FFFFFF" : "#1A1A1E" },
  userEmail: { fontSize: 14, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366", marginTop: 2 },
  memberBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: color.PRIMARY + "10", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  memberSince: { fontSize: 12, fontFamily: "PoppinsRegular", color: color.PRIMARY, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontFamily: "PoppinsRegular", fontWeight: 'bold', color: isDark ? "#FFFFFF" : "#1A1A1E", marginBottom: 16 },
  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, borderRadius: 20, padding: 16, alignItems: "center", borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#ECEEF2" },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statCount: { fontSize: 20, fontFamily: "PoppinsRegular", fontWeight: 'bold' },
  statLabel: { fontSize: 11, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366", marginTop: 2 },
  menuList: { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 24, paddingVertical: 8, borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#ECEEF2" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "PoppinsRegular", fontWeight: '500' },
  footer: { alignItems: "center", marginTop: 40, paddingBottom: 20 },
  versionText: { fontSize: 14, fontFamily: "PoppinsRegular", color: isDark ? "#3A3A3C" : "#AEAEB2", fontWeight: '600' },
  creditText: { fontSize: 12, fontFamily: "PoppinsRegular", color: isDark ? "#2C2C2E" : "#D1D1D6", marginTop: 4 },
});
