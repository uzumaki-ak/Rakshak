// import { supabase } from "@/config/SupabaseConfig";
// import { Medicine, MedicineFormData } from "@/types/medicine";
// import { useUser } from "@clerk/clerk-expo";
// import { Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   Alert,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// export default function EditMedicineScreen() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const { user } = useUser();
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [showExpiryPicker, setShowExpiryPicker] = useState(false);
//   const [medicine, setMedicine] = useState<Medicine | null>(null);
//   const [userUuid, setUserUuid] = useState<string | null>(null);

//   const [formData, setFormData] = useState<MedicineFormData>({
//     name: "",
//     generic_name: "",
//     brand_name: "",
//     strength: "",
//     current_quantity: 1,
//     unit_type: "tablets",
//     expiry_date: undefined,
//     manufacture_date: undefined,
//     medicine_type: "otc",
//     dosage_instructions: "",
//     notes: "",
//   });

//   useEffect(() => {
//     fetchMedicine();
//   }, [id]);

//   const fetchMedicine = async () => {
//     if (!user || !id) return;

//     try {
//       // First, get the user's UUID from the database
//       const { data: userData, error: userError } = await supabase
//         .from('users')
//         .select('id')
//         .eq('clerk_user_id', user.id)
//         .single();

//       if (userError || !userData) {
//         console.error('User not found in database:', userError);
//         Alert.alert('Error', 'User not found in database');
//         return;
//       }

//       setUserUuid(userData.id);

//       // Now fetch the medicine using the UUID
//       const { data, error } = await supabase
//         .from("medicines")
//         .select("*")
//         .eq("id", id)
//         .eq("user_id", userData.id)
//         .single();

//       if (error) throw error;

//       setMedicine(data);
//       setFormData({
//         name: data.name,
//         generic_name: data.generic_name || "",
//         brand_name: data.brand_name || "",
//         strength: data.strength || "",
//         current_quantity: data.current_quantity,
//         unit_type: data.unit_type || "tablets",
//         expiry_date: data.expiry_date || undefined,
//         manufacture_date: data.manufacture_date || undefined,
//         medicine_type: data.medicine_type || "otc",
//         dosage_instructions: data.dosage_instructions || "",
//         notes: data.notes || "",
//       });
//     } catch (error) {
//       console.error("Error fetching medicine:", error);
//       Alert.alert("Error", "Failed to load medicine");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateField = (field: keyof MedicineFormData, value: any) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleSave = async () => {
//     if (!formData.name.trim()) {
//       Alert.alert("Error", "Medicine name is required");
//       return;
//     }

//     if (!user || !medicine || !userUuid) {
//       Alert.alert("Error", "Medicine not found");
//       return;
//     }

//     setSaving(true);

//     try {
//       const { error } = await supabase
//         .from("medicines")
//         .update({
//           name: formData.name.trim(),
//           generic_name: formData.generic_name?.trim(),
//           brand_name: formData.brand_name?.trim(),
//           strength: formData.strength?.trim(),
//           current_quantity: formData.current_quantity,
//           unit_type: formData.unit_type,
//           expiry_date: formData.expiry_date,
//           manufacture_date: formData.manufacture_date,
//           medicine_type: formData.medicine_type,
//           dosage_instructions: formData.dosage_instructions?.trim(),
//           notes: formData.notes?.trim(),
//           updated_at: new Date().toISOString(),
//         })
//         .eq("id", medicine.id)
//         .eq("user_id", userUuid); // Use the UUID, not user.id

//       if (error) throw error;

//       Alert.alert("Success", "Medicine updated successfully!", [
//         { text: "OK", onPress: () => router.back() },
//       ]);
//     } catch (error) {
//       console.error("Error updating medicine:", error);
//       Alert.alert("Error", "Failed to update medicine");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const formatDate = (date?: string) => {
//     if (!date) return "Not set";
//     return new Date(date).toLocaleDateString("en-GB");
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <Text>Loading...</Text>
//       </View>
//     );
//   }

//   if (!medicine) {
//     return (
//       <View style={styles.center}>
//         <Text>Medicine not found</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={styles.backButton}
//         >
//           <Ionicons name="close" size={24} color="#666" />
//         </TouchableOpacity>
//         <Text style={styles.title}>Edit Medicine</Text>
//         <TouchableOpacity
//           onPress={handleSave}
//           style={styles.saveButton}
//           disabled={saving}
//         >
//           <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
//         </TouchableOpacity>
//       </View>

//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//         {/* Basic Information */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Basic Information</Text>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Medicine Name *</Text>
//             <TextInput
//               style={styles.input}
//               value={formData.name}
//               onChangeText={(value) => updateField("name", value)}
//               placeholder="e.g., Paracetamol"
//             />
//           </View>

//           <View style={styles.row}>
//             <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
//               <Text style={styles.label}>Generic Name</Text>
//               <TextInput
//                 style={styles.input}
//                 value={formData.generic_name}
//                 onChangeText={(value) => updateField("generic_name", value)}
//                 placeholder="e.g., Acetaminophen"
//               />
//             </View>

//             <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
//               <Text style={styles.label}>Brand Name</Text>
//               <TextInput
//                 style={styles.input}
//                 value={formData.brand_name}
//                 onChangeText={(value) => updateField("brand_name", value)}
//                 placeholder="e.g., Panadol"
//               />
//             </View>
//           </View>

//           <View style={styles.row}>
//             <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
//               <Text style={styles.label}>Strength</Text>
//               <TextInput
//                 style={styles.input}
//                 value={formData.strength}
//                 onChangeText={(value) => updateField("strength", value)}
//                 placeholder="e.g., 500mg"
//               />
//             </View>

//             <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
//               <Text style={styles.label}>Type</Text>
//               <View style={styles.picker}>
//                 <Text style={styles.pickerText}>{formData.medicine_type}</Text>
//                 <Ionicons name="chevron-down" size={16} color="#666" />
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* Quantity & Dates */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Quantity & Dates</Text>

//           <View style={styles.row}>
//             <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
//               <Text style={styles.label}>Quantity</Text>
//               <View style={styles.quantityContainer}>
//                 <TouchableOpacity
//                   style={styles.quantityButton}
//                   onPress={() =>
//                     updateField(
//                       "current_quantity",
//                       Math.max(1, formData.current_quantity - 1)
//                     )
//                   }
//                 >
//                   <Ionicons name="remove" size={20} color="#007AFF" />
//                 </TouchableOpacity>
//                 <Text style={styles.quantityText}>
//                   {formData.current_quantity}
//                 </Text>
//                 <TouchableOpacity
//                   style={styles.quantityButton}
//                   onPress={() =>
//                     updateField(
//                       "current_quantity",
//                       formData.current_quantity + 1
//                     )
//                   }
//                 >
//                   <Ionicons name="add" size={20} color="#007AFF" />
//                 </TouchableOpacity>
//               </View>
//             </View>

//             <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
//               <Text style={styles.label}>Unit Type</Text>
//               <View style={styles.picker}>
//                 <Text style={styles.pickerText}>{formData.unit_type}</Text>
//                 <Ionicons name="chevron-down" size={16} color="#666" />
//               </View>
//             </View>
//           </View>

//           <View style={styles.row}>
//             <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
//               <Text style={styles.label}>Expiry Date</Text>
//               <TouchableOpacity
//                 style={styles.dateButton}
//                 onPress={() => setShowExpiryPicker(true)}
//               >
//                 <Text style={styles.dateButtonText}>
//                   {formatDate(formData.expiry_date)}
//                 </Text>
//                 <Ionicons name="calendar" size={16} color="#666" />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {/* Additional Information */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Additional Information</Text>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Dosage Instructions</Text>
//             <TextInput
//               style={[styles.input, styles.textArea]}
//               value={formData.dosage_instructions}
//               onChangeText={(value) =>
//                 updateField("dosage_instructions", value)
//               }
//               placeholder="e.g., Take 1 tablet every 6 hours"
//               multiline
//               numberOfLines={3}
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Notes</Text>
//             <TextInput
//               style={[styles.input, styles.textArea]}
//               value={formData.notes}
//               onChangeText={(value) => updateField("notes", value)}
//               placeholder="Any additional notes..."
//               multiline
//               numberOfLines={3}
//             />
//           </View>
//         </View>
//       </ScrollView>

//       {/* Date Pickers */}
//       {showExpiryPicker && (
//         <DateTimePicker
//           value={
//             formData.expiry_date ? new Date(formData.expiry_date) : new Date()
//           }
//           mode="date"
//           display="default"
//           onChange={(event, date) => {
//             setShowExpiryPicker(false);
//             if (date) {
//               updateField("expiry_date", date.toISOString().split("T")[0]);
//             }
//           }}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "white",
//   },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingTop: 60,
//     paddingBottom: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: "#e5e5e5",
//   },
//   backButton: {
//     padding: 4,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1a1a1a",
//   },
//   saveButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   saveText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#007AFF",
//   },
//   content: {
//     flex: 1,
//     padding: 20,
//   },
//   section: {
//     marginBottom: 32,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1a1a1a",
//     marginBottom: 16,
//   },
//   inputGroup: {
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#666",
//     marginBottom: 8,
//   },
//   input: {
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//     color: "#1a1a1a",
//     borderWidth: 1,
//     borderColor: "#e5e5e5",
//   },
//   textArea: {
//     minHeight: 80,
//     textAlignVertical: "top",
//   },
//   row: {
//     flexDirection: "row",
//   },
//   quantityContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#e5e5e5",
//   },
//   quantityButton: {
//     padding: 12,
//   },
//   quantityText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#1a1a1a",
//     minWidth: 40,
//     textAlign: "center",
//   },
//   picker: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: "#e5e5e5",
//   },
//   pickerText: {
//     fontSize: 16,
//     color: "#1a1a1a",
//   },
//   dateButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: "#e5e5e5",
//   },
//   dateButtonText: {
//     fontSize: 16,
//     color: "#1a1a1a",
//   },
// });

//

import { supabase } from "@/config/SupabaseConfig";
import { Medicine, MedicineFormData } from "@/types/medicine";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditMedicineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme() as "light" | "dark" | null;
  const styles = createStyles(colorScheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showManufacturePicker, setShowManufacturePicker] = useState(false);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);

  const [formData, setFormData] = useState<MedicineFormData>({
    name: "",
    generic_name: "",
    brand_name: "",
    strength: "",
    current_quantity: 1,
    unit_type: "tablets",
    expiry_date: undefined,
    manufacture_date: undefined,
    medicine_type: "otc",
    dosage_instructions: "",
    notes: "",
  });

  useEffect(() => {
    fetchMedicine();
  }, [id]);

  const fetchMedicine = async () => {
    if (!user || !id) return;

    try {
      // First, get the user's UUID from the database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError || !userData) {
        console.error("User not found in database:", userError);
        Alert.alert("Error", "User not found in database");
        return;
      }

      setUserUuid(userData.id);

      // Now fetch the medicine using the UUID
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("id", id)
        .eq("user_id", userData.id)
        .single();

      if (error) throw error;

      setMedicine(data);
      setFormData({
        name: data.name,
        generic_name: data.generic_name || "",
        brand_name: data.brand_name || "",
        strength: data.strength || "",
        current_quantity: data.current_quantity,
        unit_type: data.unit_type || "tablets",
        expiry_date: data.expiry_date || undefined,
        manufacture_date: data.manufacture_date || undefined,
        medicine_type: data.medicine_type || "otc",
        dosage_instructions: data.dosage_instructions || "",
        notes: data.notes || "",
      });
    } catch (error) {
      console.error("Error fetching medicine:", error);
      Alert.alert("Error", "Failed to load medicine");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof MedicineFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Medicine name is required");
      return;
    }

    if (!user || !medicine || !userUuid) {
      Alert.alert("Error", "Medicine not found");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("medicines")
        .update({
          name: formData.name.trim(),
          generic_name: formData.generic_name?.trim(),
          brand_name: formData.brand_name?.trim(),
          strength: formData.strength?.trim(),
          current_quantity: formData.current_quantity,
          unit_type: formData.unit_type,
          expiry_date: formData.expiry_date,
          manufacture_date: formData.manufacture_date,
          medicine_type: formData.medicine_type,
          dosage_instructions: formData.dosage_instructions?.trim(),
          notes: formData.notes?.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", medicine.id)
        .eq("user_id", userUuid);

      if (error) throw error;

      Alert.alert("Success", "Medicine updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error updating medicine:", error);
      Alert.alert("Error", "Failed to update medicine");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-GB");
  };

  const showMedicineTypePicker = () => {
    Alert.alert("Select Medicine Type", "", [
      {
        text: "OTC (Over-the-counter)",
        onPress: () => updateField("medicine_type", "otc"),
      },
      {
        text: "Prescription",
        onPress: () => updateField("medicine_type", "prescription"),
      },
      {
        text: "Herbal/Natural",
        onPress: () => updateField("medicine_type", "herbal"),
      },
      {
        text: "Supplement",
        onPress: () => updateField("medicine_type", "supplement"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const showUnitTypePicker = () => {
    Alert.alert("Select Unit Type", "", [
      { text: "Tablets", onPress: () => updateField("unit_type", "tablets") },
      { text: "Capsules", onPress: () => updateField("unit_type", "capsules") },
      { text: "ml (Liquid)", onPress: () => updateField("unit_type", "ml") },
      { text: "mg (Powder)", onPress: () => updateField("unit_type", "mg") },
      { text: "Drops", onPress: () => updateField("unit_type", "drops") },
      { text: "Sachets", onPress: () => updateField("unit_type", "sachets") },
      {
        text: "Injections",
        onPress: () => updateField("unit_type", "injections"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const formatMedicineType = (type: string) => {
    switch (type) {
      case "otc":
        return "OTC";
      case "prescription":
        return "Prescription";
      case "herbal":
        return "Herbal/Natural";
      case "supplement":
        return "Supplement";
      default:
        return type;
    }
  };

  const formatUnitType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={styles.primary.color} />
          <Text style={styles.loadingText}>Loading medicine...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!medicine) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Ionicons name="medical" size={64} color={styles.icon.color} />
          <Text style={styles.errorText}>Medicine not found</Text>
          <TouchableOpacity
            style={styles.backButtonFull}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="close" size={24} color={styles.secondary.color} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Medicine</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medicine Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateField("name", value)}
                placeholder="e.g., Paracetamol"
                placeholderTextColor={styles.placeholder.color}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Generic Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.generic_name}
                  onChangeText={(value) => updateField("generic_name", value)}
                  placeholder="e.g., Acetaminophen"
                  placeholderTextColor={styles.placeholder.color}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Brand Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.brand_name}
                  onChangeText={(value) => updateField("brand_name", value)}
                  placeholder="e.g., Panadol"
                  placeholderTextColor={styles.placeholder.color}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Strength</Text>
                <TextInput
                  style={styles.input}
                  value={formData.strength}
                  onChangeText={(value) => updateField("strength", value)}
                  placeholder="e.g., 500mg"
                  placeholderTextColor={styles.placeholder.color}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Type</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={showMedicineTypePicker}
                >
                  <Text style={styles.pickerText}>
                    {formatMedicineType(formData.medicine_type ?? "")}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={styles.secondary.color}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quantity & Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity & Dates</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Quantity</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      updateField(
                        "current_quantity",
                        Math.max(1, formData.current_quantity - 1)
                      )
                    }
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={styles.primary.color}
                    />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>
                    {formData.current_quantity}
                  </Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      updateField(
                        "current_quantity",
                        formData.current_quantity + 1
                      )
                    }
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={styles.primary.color}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Unit Type</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={showUnitTypePicker}
                >
                  <Text style={styles.pickerText}>
                    {formatUnitType(formData.unit_type ?? "")}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={styles.secondary.color}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Expiry Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowExpiryPicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formatDate(formData.expiry_date)}
                  </Text>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={styles.secondary.color}
                  />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Manufacture Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowManufacturePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formatDate(formData.manufacture_date)}
                  </Text>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={styles.secondary.color}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dosage Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.dosage_instructions}
                onChangeText={(value) =>
                  updateField("dosage_instructions", value)
                }
                placeholder="e.g., Take 1 tablet every 6 hours"
                placeholderTextColor={styles.placeholder.color}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => updateField("notes", value)}
                placeholder="Any additional notes..."
                placeholderTextColor={styles.placeholder.color}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Add bottom padding */}
          <View style={{ height: 50 }} />
        </ScrollView>

        {/* Date Pickers */}
        {showExpiryPicker && (
          <DateTimePicker
            value={
              formData.expiry_date ? new Date(formData.expiry_date) : new Date()
            }
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowExpiryPicker(false);
              if (date) {
                updateField("expiry_date", date.toISOString().split("T")[0]);
              }
            }}
          />
        )}

        {showManufacturePicker && (
          <DateTimePicker
            value={
              formData.manufacture_date
                ? new Date(formData.manufacture_date)
                : new Date()
            }
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowManufacturePicker(false);
              if (date) {
                updateField(
                  "manufacture_date",
                  date.toISOString().split("T")[0]
                );
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colorScheme: "light" | "dark" | null) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
    },
    container: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
    errorText: {
      fontSize: 18,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginTop: 16,
      textAlign: "center",
    },
    icon: {
      color: colorScheme === "dark" ? "#2C2C2E" : "#e5e5e5",
    },
    backButtonFull: {
      backgroundColor: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
      marginTop: 20,
    },
    backButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
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
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    saveText: {
      fontSize: 16,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
      marginBottom: 8,
    },
    input: {
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "#f5f5f5",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#38383A" : "#e5e5e5",
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    row: {
      flexDirection: "row",
    },
    quantityContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "#f5f5f5",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#38383A" : "#e5e5e5",
    },
    quantityButton: {
      padding: 12,
    },
    quantityText: {
      fontSize: 16,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      minWidth: 40,
      textAlign: "center",
    },
    picker: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "#f5f5f5",
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#38383A" : "#e5e5e5",
    },
    pickerText: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
    },
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "#f5f5f5",
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#38383A" : "#e5e5e5",
    },
    dateButtonText: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
    },
    primary: {
      color: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
    },
    secondary: {
      color: colorScheme === "dark" ? "#8E8E93" : "#666",
    },
    placeholder: {
      color: colorScheme === "dark" ? "#636366" : "#999",
    },
  });
