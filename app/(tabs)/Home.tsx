import ChatSessionsCard from "@/components/home/ChatSessionsCard";
import EmptyStateCard from "@/components/home/EmptyStateCard";
import ExpiryAlerts from "@/components/home/ExpiryAlerts";
import MedicineStatusChart from "@/components/home/MedicineStatusChart";
import QuickActions from "@/components/home/QuickActions";
import QuickStats from "@/components/home/QuickStats";
import RecentActivity from "@/components/home/RecentActivity";
import UpcomingRemindersCard from "@/components/home/UpcomingRemindersCard";
import { supabase } from "@/config/SupabaseConfig";
import {
  ExpiryAlert,
  HomeStats,
  RecentActivity as RecentActivityType,
} from "@/types/home";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper function to log activities
const logActivity = async (
  userId: string,
  activityType: string,
  activityData?: any
) => {
  try {
    await supabase.from("user_activities").insert([
      {
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData,
        platform: Platform.OS,
        app_version: "1.0.0",
      },
    ]);
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

export default function HomeScreen() {
  const { user } = useUser();
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
  const [recentActivities, setRecentActivities] = useState<
    RecentActivityType[]
  >([]);

  // Calculate statistics from medicines data
  const calculateStats = (
    medicines: any[],
    reminders: any[],
    scans: any[]
  ): HomeStats => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const expired = medicines.filter(
      (m) => m.expiry_date && new Date(m.expiry_date) < now
    ).length;

    const expiringSoon = medicines.filter(
      (m) =>
        m.expiry_date &&
        new Date(m.expiry_date) >= now &&
        new Date(m.expiry_date) <= thirtyDaysFromNow
    ).length;

    return {
      totalMedicines: medicines.length,
      expiringSoon,
      expired,
      activeReminders: reminders.length,
      recentScans: scans.length,
    };
  };

  // Calculate expiry alerts with severity levels
  const calculateExpiryAlerts = (medicines: any[]): ExpiryAlert[] => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    return medicines
      .filter((m) => m.expiry_date)
      .map((medicine) => {
        const expiryDate = new Date(medicine.expiry_date);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        let severity: "critical" | "warning" | "info" = "info";

        if (daysUntilExpiry < 0) {
          severity = "critical";
        } else if (daysUntilExpiry <= 7) {
          severity = "warning";
        } else if (daysUntilExpiry <= 30) {
          severity = "info";
        }

        return {
          id: medicine.id,
          medicineName: medicine.name,
          expiryDate: medicine.expiry_date,
          daysUntilExpiry,
          severity,
        };
      })
      .filter((alert) => alert.severity !== "info") // Only show critical and warning alerts
      .slice(0, 5); // Limit to 5 most critical alerts
  };

  // Enhanced formatRecentActivities with more details
  const formatRecentActivities = (
    activities: any[],
    medicines: any[],
    chats: any[]
  ): RecentActivityType[] => {
    return activities.map((activity) => {
      const baseActivity = {
        id: activity.id,
        type: activity.activity_type,
        timestamp: activity.created_at,
        metadata: activity.activity_data,
      };

      switch (activity.activity_type) {
        case "scan":
          const medicineName =
            activity.activity_data?.medicine_name || "Unknown";
          return {
            ...baseActivity,
            title: "Medicine Scanned",
            description: `Scanned: ${medicineName}`,
          };
        case "medicine_added":
          const addedName =
            activity.activity_data?.medicine_name || "New medicine";
          return {
            ...baseActivity,
            title: "Medicine Added",
            description: `Added: ${addedName}`,
          };
        case "reminder_set":
          return {
            ...baseActivity,
            title: "Reminder Set",
            description:
              activity.activity_data?.reminder_type || "New reminder created",
          };
        case "chat_started":
          const sessionType = activity.activity_data?.session_type || "general";
          return {
            ...baseActivity,
            title: "AI Chat Started",
            description: `Started ${sessionType.replace(/_/g, " ")} chat`,
          };
        case "report_uploaded":
          return {
            ...baseActivity,
            title: "Report Uploaded",
            description:
              activity.activity_data?.report_type || "Medical report uploaded",
          };
        case "medicine_updated":
          return {
            ...baseActivity,
            title: "Medicine Updated",
            description: "Updated medicine details",
          };
        case "medicine_deleted":
          return {
            ...baseActivity,
            title: "Medicine Removed",
            description: "Medicine removed from inventory",
          };
        default:
          return {
            ...baseActivity,
            title: "Activity",
            description: activity.activity_type.replace(/_/g, " "),
          };
      }
    });
  };

  // Fetch all home data
  const fetchHomeData = async () => {
    if (!user) return;

    try {
      // Get user UUID from Clerk ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError || !userData) {
        console.error("User not found:", userError);
        return;
      }

      const userId = userData.id;

      // Fetch all data in parallel
      const [medicines, activities, reminders, scans, chats] =
        await Promise.all([
          supabase
            .from("medicines")
            .select("*")
            .eq("user_id", userId)
            .order("expiry_date", { ascending: true }),
          supabase
            .from("user_activities")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("reminders")
            .select("id")
            .eq("user_id", userId)
            .eq("is_delivered", false)
            .gte("remind_at", new Date().toISOString()),
          supabase
            .from("scans")
            .select("id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(7),
          supabase
            .from("ai_chat_sessions")
            .select("id")
            .eq("user_id", userId)
            .eq("is_active", true),
        ]);

      if (medicines.error) throw medicines.error;
      if (activities.error) throw activities.error;
      if (reminders.error) throw reminders.error;

      const calculatedStats = calculateStats(
        medicines.data || [],
        reminders.data || [],
        scans.data || []
      );
      const calculatedAlerts = calculateExpiryAlerts(medicines.data || []);
      const formattedActivities = formatRecentActivities(
        activities.data || [],
        medicines.data || [],
        chats.data || []
      );

      setStats(calculatedStats);
      setExpiryAlerts(calculatedAlerts);
      setRecentActivities(formattedActivities);
    } catch (error) {
      console.error("Error fetching home data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  useEffect(() => {
    fetchHomeData();
  }, [user]);

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
            Loading your dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Decorative background element */}
      <View
        pointerEvents="none"
        style={[
          styles.bgBend,
          {
            backgroundColor: isDark
              ? "rgba(45,137,255,0.06)"
              : "rgba(0,122,255,0.06)",
          },
        ]}
      />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.content}
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Here's your medicine overview
          </Text>
        </View>

        {/* Expiry Alerts Section */}
        {expiryAlerts.length > 0 && (
          <ExpiryAlerts
            alerts={expiryAlerts}
            onAlertPress={(medicineId) =>
              router.push(`/medicines/${medicineId}` as any)
            }
          />
        )}

        {/* Quick Stats */}
        <QuickStats stats={stats} />

        {/* Quick Actions */}
        <QuickActions
          onActionPress={(action) => {
            switch (action) {
              case "scan":
                router.push("/scan" as any);
                break;
              case "add":
                router.push("/medicines/add" as any);
                break;
              case "assistant":
                router.push("/assistant" as any);
                break;
              case "emergency":
                // Handle emergency contact access
                Alert.alert("Emergency", "Show emergency contacts");
                break;
            }
          }}
        />

        {/* Chat Sessions */}
        <ChatSessionsCard />

        {/* Upcoming Reminders */}
        <UpcomingRemindersCard />

        {/* Empty State when no medicines */}
        {stats.totalMedicines === 0 && (
          <EmptyStateCard
            title="No Medicines Yet"
            description="Start by scanning or manually adding your first medicine"
            icon="medical"
            actionLabel="Add Medicine"
            onActionPress={() => router.push("/medicines/add" as any)}
          />
        )}

        {/* Medicine Status Chart */}
        <MedicineStatusChart />

        {/* Recent Activity */}
        <RecentActivity activities={recentActivities} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? "#050507" : "#fbfbfc",
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
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
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 4,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#666",
    },
    bgBend: {
      position: "absolute",
      top: -100,
      right: -100,
      width: 300,
      height: 300,
      borderRadius: 150,
      opacity: 1,
      transform: [{ rotate: "-15deg" }],
    },
  });
