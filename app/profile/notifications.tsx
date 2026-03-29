import { supabase } from "@/config/SupabaseConfig";
import { useAuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const { user } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme() as "light" | "dark" | null;
  const styles = createStyles(colorScheme);
  
  const [notificationSettings, setNotificationSettings] = useState({
    push_notifications_enabled: true,
    email_notifications_enabled: true,
    reminder_notifications_enabled: true,
  });

  useEffect(() => {
    fetchNotificationSettings();
  }, [user]);

  const fetchNotificationSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("push_notifications_enabled, email_notifications_enabled, reminder_notifications_enabled")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setNotificationSettings({
          push_notifications_enabled: data.push_notifications_enabled,
          email_notifications_enabled: data.email_notifications_enabled,
          reminder_notifications_enabled: data.reminder_notifications_enabled,
        });
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
    }
  };

  const updateNotificationSetting = async (key: string, value: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ [key]: value })
        .eq("id", user.id);

      if (error) throw error;

      setNotificationSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error("Error updating notification setting:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={styles.primary.color} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait" size={24} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications on your device
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.push_notifications_enabled}
              onValueChange={(value) => updateNotificationSetting("push_notifications_enabled", value)}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail" size={24} color="#FF9500" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications via email
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.email_notifications_enabled}
              onValueChange={(value) => updateNotificationSetting("email_notifications_enabled", value)}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="alarm" size={24} color="#34C759" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Reminder Notifications</Text>
                <Text style={styles.settingDescription}>
                  Get reminders for medicine expiry
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.reminder_notifications_enabled}
              onValueChange={(value) => updateNotificationSetting("reminder_notifications_enabled", value)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <TouchableOpacity style={styles.notificationTypeItem}>
            <View style={styles.notificationTypeInfo}>
              <Ionicons name="medical" size={20} color="#FF3B30" />
              <Text style={styles.notificationTypeLabel}>Medicine Expiry Alerts</Text>
            </View>
            <Text style={styles.notificationTypeStatus}>Active</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notificationTypeItem}>
            <View style={styles.notificationTypeInfo}>
              <Ionicons name="calendar" size={20} color="#5856D6" />
              <Text style={styles.notificationTypeLabel}>Appointment Reminders</Text>
            </View>
            <Text style={styles.notificationTypeStatus}>Active</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notificationTypeItem}>
            <View style={styles.notificationTypeInfo}>
              <Ionicons name="heart" size={20} color="#FF2D55" />
              <Text style={styles.notificationTypeLabel}>Health Tips</Text>
            </View>
            <Text style={styles.notificationTypeStatus}>Active</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Notifications help you stay on top of your medicine schedule and health management.
          </Text>
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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === "dark" ? "#38383A" : "#e5e5e5",
    },
    backButton: {
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
    },
    container: {
      flex: 1,
      padding: 20,
    },
    section: {
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === "dark" ? "#38383A" : "#f0f0f0",
    },
    settingInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    settingText: {
      marginLeft: 12,
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
    notificationTypeItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === "dark" ? "#38383A" : "#f0f0f0",
    },
    notificationTypeInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    notificationTypeLabel: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginLeft: 12,
    },
    notificationTypeStatus: {
      fontSize: 14,
      color: "#34C759",
      fontWeight: "500",
    },
    infoSection: {
      padding: 16,
    },
    infoText: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
      textAlign: "center",
      lineHeight: 20,
    },
    primary: {
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
    },
  });