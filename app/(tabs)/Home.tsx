import ChatSessionsCard from "@/components/home/ChatSessionsCard";
import EmptyStateCard from "@/components/home/EmptyStateCard";
import ExpiryAlerts from "@/components/home/ExpiryAlerts";
import MedicineStatusChart from "@/components/home/MedicineStatusChart";
import QuickActions from "@/components/home/QuickActions";
import QuickStats from "@/components/home/QuickStats";
import RecentActivity from "@/components/home/RecentActivity";
import UpcomingRemindersCard from "@/components/home/UpcomingRemindersCard";
import { supabase } from "@/config/SupabaseConfig";
import color from "@/shared/color";
import {
  ExpiryAlert,
  HomeStats,
  RecentActivity as RecentActivityType,
} from "@/types/home";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserSync } from "@/hooks/useUserSync";

/**
 * HomeScreen
 * Main dashboard providing an overview of medicines, alerts, and activities.
 * Standardized for premium UI and consistent styling.
 */
export default function HomeScreen() {
  const { user } = useUser();
  const { isSynced } = useUserSync();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<HomeStats>({
    totalMedicines: 0,
    expiringSoon: 0,
    expired: 0,
    activeReminders: 0,
    recentScans: 0,
  });
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityType[]>([]);

  /**
   * Fetch all dashboard data
   */
  const fetchHomeData = useCallback(async () => {
    if (!user || !isSynced) return;

    try {
      // 1. Get user UUID from clerk_user_id
      const { data: dbUser, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError || !dbUser) {
        console.error("User not found in Supabase:", userError);
        return;
      }

      const userId = dbUser.id;

      // 2. Fetch parallel data
      const [medicines, activities, reminders, scans] = await Promise.all([
        supabase
          .from("medicines")
          .select("*")
          .eq("user_id", userId)
          .order("expiry_date", { ascending: true }),
        supabase
          .from("scans")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("notifications") // Changed from 'reminders' to 'notifications' as per schema.sql
          .select("id")
          .eq("user_id", userId)
          .eq("is_read", false),
        supabase
          .from("scans")
          .select("id")
          .eq("user_id", userId)
          .limit(10),
      ]);

      if (medicines.error) throw medicines.error;

      // 3. Process data
      const medicineData = medicines.data || [];
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const expired = medicineData.filter(m => m.expiry_date && new Date(m.expiry_date) < now).length;
      const expiringSoon = medicineData.filter(m => 
        m.expiry_date && new Date(m.expiry_date) >= now && new Date(m.expiry_date) <= thirtyDays
      ).length;

      setStats({
        totalMedicines: medicineData.length,
        expiringSoon,
        expired,
        activeReminders: reminders.data?.length || 0,
        recentScans: scans.data?.length || 0,
      });

      // 4. Calculate critical alerts
      const alerts: ExpiryAlert[] = medicineData
        .filter(m => {
          if (!m.expiry_date) return false;
          const exp = new Date(m.expiry_date);
          return exp <= thirtyDays;
        })
        .map(m => {
          const exp = new Date(m.expiry_date!);
          const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: m.id,
            medicineName: m.name,
            expiryDate: m.expiry_date!,
            daysUntilExpiry: diff,
            severity: diff < 0 ? "critical" : (diff <= 7 ? "warning" : "info"),
          };
        })
        .filter(a => a.severity !== "info")
        .slice(0, 5) as ExpiryAlert[];

      setExpiryAlerts(alerts);

      // 5. Format activities (using scans as proxy for now)
      const formatted: RecentActivityType[] = (activities.data || []).map(s => ({
        id: s.id,
        type: 'scan',
        title: 'Medicine Scanned',
        description: s.parsed_data?.name || 'Manual Scan',
        timestamp: s.created_at,
        metadata: s.parsed_data
      }));

      setRecentActivities(formatted);

    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isSynced]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  if (loading || !isSynced) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={color.PRIMARY} />
          <Text style={styles.loadingText}>Syncing metrics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgDecorative} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.PRIMARY} />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>
            Namaste{user?.firstName ? `, ${user.firstName}` : ""}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Your health dashboard is up to date.
          </Text>
        </View>

        {expiryAlerts.length > 0 && (
          <ExpiryAlerts
            alerts={expiryAlerts}
            onAlertPress={(id) => router.push(`/medicines/${id}` as any)}
          />
        )}

        <QuickStats stats={stats} />

        <QuickActions
          onActionPress={(action) => {
            switch (action) {
              case "scan": router.push("/scan" as any); break;
              case "add": router.push("/medicines/add" as any); break;
              case "assistant": router.push("/assistant" as any); break;
              case "emergency": Alert.alert("Emergency", "Contacting emergency services..."); break;
            }
          }}
        />

        <UpcomingRemindersCard />
        
        <MedicineStatusChart />

        {stats.totalMedicines === 0 && (
          <EmptyStateCard
            title="No Medicines Added"
            description="Start tracking your health by adding your medicines."
            icon="medical"
            actionLabel="Add Now"
            onActionPress={() => router.push("/medicines/add" as any)}
          />
        )}

        <RecentActivity activities={recentActivities} />

        {/* Bottom Spacing for Tab Bar */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF",
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      fontFamily: "PoppinsRegular",
      color: isDark ? "#8E8E93" : "#636366",
    },
    header: {
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    welcomeTitle: {
      fontSize: 28,
      fontFamily: "PoppinsRegular", // Should be bold if PoppinsBold is added
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1A1A1E",
      marginBottom: 4,
    },
    welcomeSubtitle: {
      fontSize: 16,
      fontFamily: "PoppinsRegular",
      color: isDark ? "#8E8E93" : "#636366",
    },
    bgDecorative: {
      position: "absolute",
      top: -50,
      right: -50,
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: color.PRIMARY + "08",
      zIndex: -1,
    },
  });
