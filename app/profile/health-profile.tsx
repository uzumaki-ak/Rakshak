import { supabase } from "@/config/SupabaseConfig";
import { HealthProfile } from "@/types/profile";
import { useAuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HealthProfileScreen() {
  const { user } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme() as "light" | "dark" | null;
  const styles = createStyles(colorScheme);
  
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [loading ,setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    height_cm: "",
    weight_kg: "",
    blood_type: "",
    known_allergies: [] as string[],
    chronic_conditions: [] as string[],
    current_medications: [] as string[],
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
  });

  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState("");

  useEffect(() => {
    fetchHealthProfile();
  }, [user]);

  const fetchHealthProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_health_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setHealthProfile(data);
        setFormData({
          height_cm: data.height_cm?.toString() || "",
          weight_kg: data.weight_kg?.toString() || "",
          blood_type: data.blood_type || "",
          known_allergies: data.known_allergies || [],
          chronic_conditions: data.chronic_conditions || [],
          current_medications: data.current_medications || [],
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
          emergency_contact_relation: data.emergency_contact_relation || "",
        });
      }
    } catch (error) {
      console.error("Error fetching health profile:", error);
      Alert.alert("Error", "");
    } finally {
      setLoading(false);
    }
  };

  const saveHealthProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const profileData = {
        user_id: user.id,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        blood_type: formData.blood_type || null,
        known_allergies: formData.known_allergies,
        chronic_conditions: formData.chronic_conditions,
        current_medications: formData.current_medications,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        emergency_contact_relation: formData.emergency_contact_relation || null,
      };

      if (healthProfile) {
        const { error } = await supabase
          .from("user_health_profiles")
          .update(profileData)
          .eq("id", healthProfile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_health_profiles")
          .insert([profileData]);

        if (error) throw error;
      }

      Alert.alert("Success", "Health profile saved successfully!");
    } catch (error) {
      console.error("Error saving health profile:", error);
      Alert.alert("Error", "Failed to save health profile");
    } finally {
      setSaving(false);
    }
  };

  const addItem = (type: 'allergy' | 'condition' | 'medication', value: string) => {
    if (!value.trim()) return;

    const key = type === 'allergy' ? 'known_allergies' : 
                type === 'condition' ? 'chronic_conditions' : 'current_medications';
    
    setFormData(prev => ({
      ...prev,
      [key]: [...prev[key], value.trim()]
    }));

    if (type === 'allergy') setNewAllergy("");
    if (type === 'condition') setNewCondition("");
    if (type === 'medication') setNewMedication("");
  };

  const removeItem = (type: 'allergy' | 'condition' | 'medication', index: number) => {
    const key = type === 'allergy' ? 'known_allergies' : 
                type === 'condition' ? 'chronic_conditions' : 'current_medications';
    
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={styles.primary.color} />
        </TouchableOpacity>
        <Text style={styles.title}>Health Profile</Text>
        <TouchableOpacity onPress={saveHealthProfile} disabled={saving}>
          <Text style={styles.saveButton}>{saving ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Basic Health Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={formData.height_cm}
                onChangeText={(text) => setFormData(prev => ({ ...prev, height_cm: text }))}
                keyboardType="numeric"
                placeholder="175"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.weight_kg}
                onChangeText={(text) => setFormData(prev => ({ ...prev, weight_kg: text }))}
                keyboardType="numeric"
                placeholder="70"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Blood Type</Text>
            <TextInput
              style={styles.input}
              value={formData.blood_type}
              onChangeText={(text) => setFormData(prev => ({ ...prev, blood_type: text }))}
              placeholder="A+"
            />
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Known Allergies</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              value={newAllergy}
              onChangeText={setNewAllergy}
              placeholder="Add allergy (e.g., Penicillin)"
              onSubmitEditing={() => addItem('allergy', newAllergy)}
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => addItem('allergy', newAllergy)}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {formData.known_allergies.map((allergy, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemText}>{allergy}</Text>
              <TouchableOpacity onPress={() => removeItem('allergy', index)}>
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Chronic Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chronic Conditions</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              value={newCondition}
              onChangeText={setNewCondition}
              placeholder="Add condition (e.g., Diabetes)"
              onSubmitEditing={() => addItem('condition', newCondition)}
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => addItem('condition', newCondition)}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {formData.chronic_conditions.map((condition, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemText}>{condition}</Text>
              <TouchableOpacity onPress={() => removeItem('condition', index)}>
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Current Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Medications</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              value={newMedication}
              onChangeText={setNewMedication}
              placeholder="Add medication (e.g., Metformin)"
              onSubmitEditing={() => addItem('medication', newMedication)}
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => addItem('medication', newMedication)}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {formData.current_medications.map((medication, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemText}>{medication}</Text>
              <TouchableOpacity onPress={() => removeItem('medication', index)}>
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergency_contact_name: text }))}
              placeholder="John Doe"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergency_contact_phone: text }))}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relationship</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_relation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergency_contact_relation: text }))}
              placeholder="Spouse"
            />
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
    saveButton: {
      fontSize: 16,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
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
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    inputGroup: {
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
      marginBottom: 4,
    },
    input: {
      backgroundColor: colorScheme === "dark" ? "#2C2C2E" : "#f5f5f5",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#38383A" : "#e5e5e5",
    },
    addItemContainer: {
      flexDirection: "row",
      marginBottom: 8,
    },
    addItemInput: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#2C2C2E" : "#f5f5f5",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#38383A" : "#e5e5e5",
      marginRight: 8,
    },
    addButton: {
      backgroundColor: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
      borderRadius: 8,
      padding: 12,
      justifyContent: "center",
      alignItems: "center",
      minWidth: 44,
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      backgroundColor: colorScheme === "dark" ? "#2C2C2E" : "#f5f5f5",
      borderRadius: 8,
      marginBottom: 4,
    },
    itemText: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      flex: 1,
    },
    primary: {
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
    },
  });