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
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  relation: string;
  is_primary: boolean;
}

export default function EmergencyContactsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme() as "light" | "dark" | null;
  const styles = createStyles(colorScheme);
  
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchEmergencyContacts();
  }, [user]);

  const fetchEmergencyContacts = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userData) return;

      const { data: healthProfile, error } = await supabase
        .from("user_health_profiles")
        .select("emergency_contact_name, emergency_contact_phone, emergency_contact_relation")
        .eq("user_id", userData.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (healthProfile?.emergency_contact_name) {
        setContacts([{
          name: healthProfile.emergency_contact_name,
          phone: healthProfile.emergency_contact_phone || "",
          relation: healthProfile.emergency_contact_relation || "",
          is_primary: true,
        }]);
      }
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
    }
  };

  const saveContact = async () => {
    if (!user || !editingContact) return;

    try {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userData) return;

      const { error } = await supabase
        .from("user_health_profiles")
        .upsert({
          user_id: userData.id,
          emergency_contact_name: editingContact.name,
          emergency_contact_phone: editingContact.phone,
          emergency_contact_relation: editingContact.relation,
        });

      if (error) throw error;

      if (editingContact.is_primary) {
        setContacts([editingContact]);
      } else {
        setContacts(prev => [...prev.filter(c => !c.is_primary), editingContact]);
      }

      setEditingContact(null);
      setIsAdding(false);
      Alert.alert("Success", "Emergency contact saved successfully");
    } catch (error) {
      console.error("Error saving emergency contact:", error);
      Alert.alert("Error", "Failed to save emergency contact");
    }
  };

  const removeContact = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userData) return;

      const { error } = await supabase
        .from("user_health_profiles")
        .update({
          emergency_contact_name: null,
          emergency_contact_phone: null,
          emergency_contact_relation: null,
        })
        .eq("user_id", userData.id);

      if (error) throw error;

      setContacts([]);
      Alert.alert("Success", "Emergency contact removed");
    } catch (error) {
      console.error("Error removing emergency contact:", error);
      Alert.alert("Error", "Failed to remove emergency contact");
    }
  };

  const startAddingContact = () => {
    setEditingContact({
      name: "",
      phone: "",
      relation: "",
      is_primary: true,
    });
    setIsAdding(true);
  };

  if (isAdding && editingContact) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={styles.primary.color} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Emergency Contact</Text>
          <TouchableOpacity onPress={saveContact}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={editingContact.name}
                onChangeText={(text) => setEditingContact(prev => prev ? { ...prev, name: text } : null)}
                placeholder="John Doe"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={editingContact.phone}
                onChangeText={(text) => setEditingContact(prev => prev ? { ...prev, phone: text } : null)}
                placeholder="+1 (555) 123-4567"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship *</Text>
              <TextInput
                style={styles.input}
                value={editingContact.relation}
                onChangeText={(text) => setEditingContact(prev => prev ? { ...prev, relation: text } : null)}
                placeholder="Spouse, Parent, Friend"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={styles.primary.color} />
        </TouchableOpacity>
        <Text style={styles.title}>Emergency Contacts</Text>
        <TouchableOpacity onPress={startAddingContact}>
          <Ionicons name="add" size={24} color={styles.primary.color} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="call" size={64} color={styles.secondary.color} />
            <Text style={styles.emptyStateTitle}>No Emergency Contacts</Text>
            <Text style={styles.emptyStateText}>
              Add an emergency contact to ensure your safety
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={startAddingContact}>
              <Text style={styles.addButtonText}>Add Emergency Contact</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts.map((contact, index) => (
              <View key={index} style={styles.contactCard}>
                <View style={styles.contactHeader}>
                  <Ionicons name="person-circle" size={40} color="#007AFF" />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactRelation}>{contact.relation}</Text>
                  </View>
                  {contact.is_primary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.contactDetails}>
                  <TouchableOpacity style={styles.contactDetail}>
                    <Ionicons name="call" size={16} color="#34C759" />
                    <Text style={styles.contactDetailText}>{contact.phone}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.contactActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setEditingContact(contact);
                      setIsAdding(true);
                    }}
                  >
                    <Ionicons name="create" size={20} color={styles.primary.color} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={removeContact}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why Emergency Contacts?</Text>
          <Text style={styles.infoText}>
            Emergency contacts can be notified in case of health emergencies and 
            can provide critical information to healthcare providers.
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
    saveButton: {
      fontSize: 16,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
    },
    container: {
      flex: 1,
      padding: 20,
    },
    formSection: {
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
      padding: 16,
      borderRadius: 12,
    },
    inputGroup: {
      marginBottom: 16,
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
    emptyState: {
      alignItems: "center",
      padding: 40,
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
      borderRadius: 12,
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    addButton: {
      backgroundColor: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
    },
    addButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    contactsList: {
      marginBottom: 16,
    },
    contactCard: {
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    contactHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    contactInfo: {
      marginLeft: 12,
      flex: 1,
    },
    contactName: {
      fontSize: 18,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 2,
    },
    contactRelation: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
    primaryBadge: {
      backgroundColor: "#34C759",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    primaryBadgeText: {
      color: "white",
      fontSize: 12,
      fontWeight: "600",
    },
    contactDetails: {
      marginBottom: 12,
    },
    contactDetail: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    contactDetailText: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginLeft: 8,
    },
    contactActions: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 8,
    },
    actionButtonText: {
      fontSize: 14,
      marginLeft: 4,
    },
    deleteButton: {
      // Styles for delete button
    },
    deleteButtonText: {
      color: "#FF3B30",
    },
    infoSection: {
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
      padding: 16,
      borderRadius: 12,
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
    },
    primary: {
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
    },
    secondary: {
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
  });