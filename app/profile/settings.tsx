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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme() as "light" | "dark" | null;
  const styles = createStyles(colorScheme);
  
  const [settings, setSettings] = useState({
    preferred_language: "en",
    temperature_unit: "celsius" as "celsius" | "fahrenheit",
    date_format: "DD/MM/YYYY",
  });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("preferred_language, temperature_unit, date_format")
        .eq("clerk_user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          preferred_language: data.preferred_language,
          temperature_unit: data.temperature_unit,
          date_format: data.date_format,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ [key]: value })
        .eq("clerk_user_id", user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      Alert.alert("Success", "Setting updated successfully");
    } catch (error) {
      console.error("Error updating setting:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  const showLanguagePicker = () => {
    Alert.alert("Select Language", "", [
      { text: "English", onPress: () => updateSetting("preferred_language", "en") },
      { text: "Spanish", onPress: () => updateSetting("preferred_language", "es") },
      { text: "French", onPress: () => updateSetting("preferred_language", "fr") },
      { text: "German", onPress: () => updateSetting("preferred_language", "de") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const showTemperatureUnitPicker = () => {
    Alert.alert("Select Temperature Unit", "", [
      { text: "Celsius (°C)", onPress: () => updateSetting("temperature_unit", "celsius") },
      { text: "Fahrenheit (°F)", onPress: () => updateSetting("temperature_unit", "fahrenheit") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const showDateFormatPicker = () => {
    Alert.alert("Select Date Format", "", [
      { text: "DD/MM/YYYY", onPress: () => updateSetting("date_format", "DD/MM/YYYY") },
      { text: "MM/DD/YYYY", onPress: () => updateSetting("date_format", "MM/DD/YYYY") },
      { text: "YYYY-MM-DD", onPress: () => updateSetting("date_format", "YYYY-MM-DD") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
    };
    return languages[code] || code;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={styles.primary.color} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={showLanguagePicker}>
            <View style={styles.settingInfo}>
              <Ionicons name="language" size={24} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingValue}>
                  {getLanguageName(settings.preferred_language)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.secondary.color} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={showTemperatureUnitPicker}>
            <View style={styles.settingInfo}>
              <Ionicons name="thermometer" size={24} color="#FF9500" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Temperature Unit</Text>
                <Text style={styles.settingValue}>
                  {settings.temperature_unit === "celsius" ? "Celsius (°C)" : "Fahrenheit (°F)"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.secondary.color} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={showDateFormatPicker}>
            <View style={styles.settingInfo}>
              <Ionicons name="calendar" size={24} color="#34C759" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Date Format</Text>
                <Text style={styles.settingValue}>{settings.date_format}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.secondary.color} />
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="download" size={24} color="#5856D6" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Export Data</Text>
                <Text style={styles.settingDescription}>
                  Download your health data
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.secondary.color} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="trash" size={24} color="#FF3B30" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Clear Cache</Text>
                <Text style={styles.settingDescription}>
                  Free up storage space
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.secondary.color} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build Number</Text>
            <Text style={styles.infoValue}>1001</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>January 2024</Text>
          </View>
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
    settingValue: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
    settingDescription: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
    infoItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
    },
    infoLabel: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
    },
    infoValue: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
    primary: {
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
    },
    secondary: {
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
  });