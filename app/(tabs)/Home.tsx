import ChatSessionsCard from "@/components/home/ChatSessionsCard";
import EmptyStateCard from "@/components/home/EmptyStateCard";
import ExpiryAlerts from "@/components/home/ExpiryAlerts";
import MedicineStatusChart from "@/components/home/MedicineStatusChart";
import NextDoseCard from "@/components/home/NextDoseCard";
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
import { Medicine } from "@/types/medicine";
import { useAuthContext } from "@/context/AuthContext";
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


/**
 * HomeScreen
 * Main dashboard providing an overview of medicines, alerts, and activities.
 * Updated with Next Dose Countdown and interactive pull-to-refresh.
 */
export default function HomeScreen() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stats, setStats] = useState<HomeStats>({
    totalMedicines: 0,
    expiringSoon: 0,
    expired: 0,
    activeReminders: 0,
    recentScans: 0,
  });
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityType[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  /**
   * Fetch all dashboard data
   */
  const fetchHomeData = useCallback(async () => {
    if (!user) return;

    try {
      // In Supabase Auth, the user.id is the UUID we need
      const userId = user.id;

      const [medicinesRes, activitiesRes, remindersRes, scansRes] = await Promise.all([
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
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("is_read", false),
        supabase
          .from("scans")
          .select("id")
          .eq("user_id", userId)
          .limit(10),
      ]);

      if (medicinesRes.error) throw medicinesRes.error;

      const medicineData = (medicinesRes.data || []) as Medicine[];
      setMedicines(medicineData);

      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expired = medicineData.filter(m => m.expiry_date && new Date(m.expiry_date) < now).length;
      const expiringSoon = medicineData.filter(m => 
        m.expiry_date && new Date(m.expiry_date) >= now && new Date(m.expiry_date) <= thirtyDays
      ).length;

      setStats({
        totalMedicines: medicineData.length,
        expiringSoon,
        expired,
        activeReminders: remindersRes.data?.length || 0,
        recentScans: scansRes.data?.length || 0,
      });

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

      const formatted: RecentActivityType[] = (activitiesRes.data || []).map(s => ({
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
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);
 
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
 
  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleTakeDose = async (medicineId: string) => {
    try {
      // 1. Log the intake
      const { error } = await supabase.from("medication_logs").insert([{
        user_id: user?.id,
        medicine_id: medicineId,
        dose_amount: 1, // Default to 1
        taken_at: new Date().toISOString()
      }]);

      if (error) throw error;
      
      // 2. Reduce quantity
      const { data: med } = await supabase.from("medicines").select("current_quantity").eq("id", medicineId).single();
      if (med) {
        await supabase.from("medicines").update({ 
          current_quantity: Math.max(0, (med.current_quantity || 0) - 1) 
        }).eq("id", medicineId);
      }

      Alert.alert("Success", "Dose logged successfully!");
      fetchHomeData();
    } catch (error) {
       Alert.alert("Error", "Failed to log dose.");
    }
  };

  if (loading || authLoading) {
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
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeTitle}>
              {getGreeting()}{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}!
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </View>
          <View style={styles.headerRight}>
             <View style={styles.liveBadge}>
               <View style={styles.liveDot} />
               <Text style={styles.liveText}>LIVE</Text>
             </View>
          </View>
        </View>

        <NextDoseCard 
          medicines={medicines} 
          onActionPress={() => {
            const next = medicines.find(m => m.intake_times?.length);
            if (next) handleTakeDose(next.id);
          }} 
        />

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
              case "emergency": router.push("/profile/emergency-contacts" as any); break;
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

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" },
    container: { flex: 1 },
    content: { padding: 16 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 16, fontSize: 16, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366" },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 },
    headerLeft: { flex: 1 },
    welcomeTitle: { fontSize: 28, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "#FFFFFF" : "#1A1A1E", marginBottom: 2 },
    welcomeSubtitle: { fontSize: 13, fontFamily: "PoppinsMedium", color: color.PRIMARY, letterSpacing: 1 },
    headerRight: { alignItems: 'flex-end' },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#ECEEF2" },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30' },
    liveText: { fontSize: 10, fontFamily: "PoppinsRegular", fontWeight: "bold", color: "#8E8E93" },
    bgDecorative: { position: "absolute", top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: color.PRIMARY + "08", zIndex: -1 },
  });
