import { supabase } from "@/config/SupabaseConfig";
import { useAuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import color from "@/shared/color";

/**
 * EditProfileScreen
 * Allows users to update their personal details in the Supabase 'users' table.
 */
export default function EditProfileScreen() {
  const { user } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "IN",
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("users")
        .select("full_name, email, phone, country")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          country: data.country || "IN",
        });
      }
    } catch (error) {
      console.error("Fetch Profile Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !formData.full_name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          country: formData.country.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Also update Supabase Auth metadata for consistency
      await supabase.auth.updateUser({
        data: { full_name: formData.full_name.trim() }
      });

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Update Profile Error:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={isDark ? "white" : "black"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Details</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={color.PRIMARY} /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                placeholder="John Doe"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.email}
                editable={false}
              />
              <Text style={styles.helperText}>Email is linked to your Supabase account.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="+91 99999 99999"
                keyboardType="phone-pad"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                value={formData.country}
                onChangeText={(text) => setFormData({ ...formData, country: text })}
                placeholder="India"
                placeholderTextColor="#8E8E93"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "PoppinsRegular",
    fontWeight: "bold",
    color: isDark ? "white" : "#1A1A1E",
  },
  saveText: {
    fontSize: 16,
    fontFamily: "PoppinsRegular",
    fontWeight: "600",
    color: color.PRIMARY,
  },
  content: {
    padding: 24,
  },
  section: {
    backgroundColor: isDark ? "#1C1C1E" : "white",
    borderRadius: 24,
    padding: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: isDark ? "#2C2C2E" : "#ECEEF2",
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "PoppinsRegular",
    fontWeight: "600",
    color: isDark ? "#8E8E93" : "#636366",
  },
  input: {
    backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7",
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "PoppinsRegular",
    color: isDark ? "white" : "#1A1A1E",
  },
  disabledInput: {
    opacity: 0.6,
  },
  helperText: {
    fontSize: 12,
    fontFamily: "PoppinsRegular",
    color: "#8E8E93",
    marginTop: 2,
  },
});
