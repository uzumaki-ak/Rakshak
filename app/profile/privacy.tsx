import { supabase } from "@/config/SupabaseConfig";
import { useUser } from "@clerk/clerk-expo";
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

export default function PrivacyScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme() as "light" | "dark" | null;
  const styles = createStyles(colorScheme);
  
  const [privacySettings, setPrivacySettings] = useState({
    data_sharing_consent: false,
    analytics_consent: false,
    marketing_consent: false,
  });

  useEffect(() => {
    fetchPrivacySettings();
  }, [user]);

  const fetchPrivacySettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("data_sharing_consent, analytics_consent, marketing_consent")
        .eq("clerk_user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPrivacySettings({
          data_sharing_consent: data.data_sharing_consent,
          analytics_consent: data.analytics_consent,
          marketing_consent: data.marketing_consent,
        });
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
    }
  };

  const updatePrivacySetting = async (key: string, value: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ [key]: value })
        .eq("clerk_user_id", user.id);

      if (error) throw error;

      setPrivacySettings(prev => ({ ...prev, [key]: value }));
      Alert.alert("Success", "Privacy setting updated");
    } catch (error) {
      console.error("Error updating privacy setting:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={styles.primary.color} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Data Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark" size={24} color="#34C759" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Data Sharing Consent</Text>
                <Text style={styles.settingDescription}>
                  Allow anonymous data sharing for research
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.data_sharing_consent}
              onValueChange={(value) => updatePrivacySetting("data_sharing_consent", value)}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="analytics" size={24} color="#5856D6" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Analytics Consent</Text>
                <Text style={styles.settingDescription}>
                  Help improve the app with usage analytics
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.analytics_consent}
              onValueChange={(value) => updatePrivacySetting("analytics_consent", value)}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="megaphone" size={24} color="#FF9500" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Marketing Consent</Text>
                <Text style={styles.settingDescription}>
                  Receive promotional offers and updates
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.marketing_consent}
              onValueChange={(value) => updatePrivacySetting("marketing_consent", value)}
            />
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity style={styles.securityItem}>
            <Ionicons name="finger-print" size={24} color="#007AFF" />
            <View style={styles.securityText}>
              <Text style={styles.securityLabel}>Biometric Authentication</Text>
              <Text style={styles.securityStatus}>Enabled</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.secondary.color} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.securityItem}>
            <Ionicons name="lock-closed" size={24} color="#FF3B30" />
            <View style={styles.securityText}>
              <Text style={styles.securityLabel}>Change Password</Text>
              <Text style={styles.securityStatus}>Last changed 3 months ago</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.secondary.color} />
          </TouchableOpacity>
        </View>

        {/* Privacy Information */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Your Privacy Matters</Text>
          <Text style={styles.infoText}>
            We take your privacy seriously. All health data is encrypted and stored securely. 
            You have full control over what information you share and how it's used.
          </Text>
          
          <TouchableOpacity style={styles.learnMoreButton}>
            <Text style={styles.learnMoreText}>Learn More About Our Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color={styles.primary.color} />
          </TouchableOpacity>
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
    securityItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === "dark" ? "#38383A" : "#f0f0f0",
    },
    securityText: {
      marginLeft: 12,
      flex: 1,
    },
    securityLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 2,
    },
    securityStatus: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
    infoSection: {
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
      padding: 16,
      borderRadius: 12,
      marginTop: 8,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
      lineHeight: 20,
      marginBottom: 16,
    },
    learnMoreButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    learnMoreText: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
      marginRight: 4,
    },
    primary: {
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
    },
    secondary: {
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
  });