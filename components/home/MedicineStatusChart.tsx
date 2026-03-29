import { supabase } from "@/config/SupabaseConfig";
import { useAuthContext } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { PieChart } from "react-native-chart-kit";

interface MedicineStatusData {
  active: number;
  expired: number;
  expiring: number;
  consumed: number;
  donated: number;
}

export default function MedicineStatusChart() {
  const { user } = useAuthContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<MedicineStatusData>({
    active: 0,
    expired: 0,
    expiring: 0,
    consumed: 0,
    donated: 0,
  });

  const screenWidth = Dimensions.get("window").width - 32;

  useEffect(() => {
    fetchMedicineStatus();
  }, [user]);

  const fetchMedicineStatus = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userData) return;

      const { data: medicines, error } = await supabase
        .from("medicines")
        .select("status, expiry_date")
        .eq("user_id", userData.id);

      if (error) throw error;

      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      const statusCounts: MedicineStatusData = {
        active: 0,
        expired: 0,
        expiring: 0,
        consumed: 0,
        donated: 0,
      };

      medicines?.forEach((medicine) => {
        if (medicine.status === "consumed") {
          statusCounts.consumed++;
        } else if (medicine.status === "donated") {
          statusCounts.donated++;
        } else if (medicine.expiry_date) {
          const expiryDate = new Date(medicine.expiry_date);
          if (expiryDate < now) {
            statusCounts.expired++;
          } else if (expiryDate <= thirtyDaysFromNow) {
            statusCounts.expiring++;
          } else {
            statusCounts.active++;
          }
        } else {
          statusCounts.active++;
        }
      });

      setStatusData(statusCounts);
    } catch (error) {
      console.error("Error fetching medicine status:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    {
      name: "Active",
      population: statusData.active,
      color: isDark ? "#34C759" : "#32D74B",
      legendFontColor: isDark ? "#FFFFFF" : "#1a1a1a",
      legendFontSize: 12,
    },
    {
      name: "Expiring",
      population: statusData.expiring,
      color: isDark ? "#FFB86B" : "#FF9500",
      legendFontColor: isDark ? "#FFFFFF" : "#1a1a1a",
      legendFontSize: 12,
    },
    {
      name: "Expired",
      population: statusData.expired,
      color: isDark ? "#FF6B6B" : "#FF3B30",
      legendFontColor: isDark ? "#FFFFFF" : "#1a1a1a",
      legendFontSize: 12,
    },
    {
      name: "Consumed",
      population: statusData.consumed,
      color: isDark ? "#5FD0D8" : "#007AFF",
      legendFontColor: isDark ? "#FFFFFF" : "#1a1a1a",
      legendFontSize: 12,
    },
    {
      name: "Donated",
      population: statusData.donated,
      color: isDark ? "#BA8AFF" : "#5856D6",
      legendFontColor: isDark ? "#FFFFFF" : "#1a1a1a",
      legendFontSize: 12,
    },
  ].filter((item) => item.population > 0);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Medicine Status</Text>
        <View style={styles.center}>
          <ActivityIndicator
            size="small"
            color={isDark ? "#5FD0D8" : "#007AFF"}
          />
        </View>
      </View>
    );
  }

  if (chartData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Medicine Status</Text>
        <View style={[styles.chartContainer, styles.center]}>
          <Text style={styles.noDataText}>No medicine data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medicine Status</Text>

      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          width={screenWidth}
          height={180}
          chartConfig={{
            backgroundColor: isDark ? "#1C1C1E" : "white",
            backgroundGradientFrom: isDark ? "#1C1C1E" : "white",
            backgroundGradientTo: isDark ? "#1C1C1E" : "white",
            color: (opacity = 1) =>
              isDark
                ? `rgba(255, 255, 255, ${opacity})`
                : `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    chartContainer: {
      backgroundColor: isDark ? "#1C1C1E" : "white",
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    center: {
      justifyContent: "center",
      alignItems: "center",
      minHeight: 120,
    },
    noDataText: {
      color: isDark ? "#8E8E93" : "#666",
      fontSize: 14,
    },
  });
