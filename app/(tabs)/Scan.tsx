// // import { Ionicons } from "@expo/vector-icons";
// // import { LinearGradient } from "expo-linear-gradient";
// // import { useRouter } from "expo-router";
// // import React from "react";
// // import {
// //   Alert,
// //   ScrollView,
// //   StyleSheet,
// //   Text,
// //   TouchableOpacity,
// //   useColorScheme,
// //   View,
// // } from "react-native";
// // import { SafeAreaView } from "react-native-safe-area-context";

// // export default function ScanScreen() {
// //   const colorScheme = useColorScheme();
// //   const router = useRouter();
// //   const isDark = colorScheme === "dark";

// //   const styles = createStyles(isDark);

// //   const scanOptions = [
// //     {
// //       title: "Camera OCR Scan",
// //       description: "Scan medicine text using camera",
// //       icon: "camera-outline" as const,
// //       type: "camera" as const,
// //       color: ["#4CAF50", "#45a049"] as [string, string],
// //     },
// //     {
// //       title: "Barcode Scanner",
// //       description: "Scan barcode for quick lookup",
// //       icon: "barcode-outline" as const,
// //       type: "barcode" as const,
// //       color: ["#2196F3", "#1976D2"] as [string, string],
// //     },
// //     {
// //       title: "Gallery Upload",
// //       description: "Select image from gallery",
// //       icon: "image-outline" as const,
// //       type: "gallery" as const,
// //       color: ["#FF9800", "#F57C00"] as [string, string],
// //     },
// //     {
// //       title: "Manual Entry",
// //       description: "Enter medicine details manually",
// //       icon: "create-outline" as const,
// //       type: "manual" as const,
// //       color: ["#9C27B0", "#7B1FA2"] as [string, string],
// //     },
// //   ];

// //   const handleScanOptionPress = (type: string) => {
// //     switch (type) {
// //       case "camera":
// //         router.push("/scan/camera" as any);
// //         break;
// //       case "barcode":
// //         router.push("/scan/barcode-scanner" as any);
// //         break;
// //       case "gallery":
// //         // For gallery, we'll handle image picker and then go to OCR results
// //         Alert.alert(
// //           "Coming Soon",
// //           "Gallery upload will be available in next update"
// //         );
// //         break;
// //       case "manual":
// //         router.push("/scan/manual-entry" as any);
// //         break;
// //     }
// //   };

// //   return (
// //     <SafeAreaView style={styles.container}>
// //       {/* Header */}
// //       <View style={styles.header}>
// //         <Text style={styles.title}>Scan Medicine</Text>
// //         <Text style={styles.subtitle}>
// //           Choose your preferred scanning method to add medicines quickly
// //         </Text>
// //       </View>

// //       {/* Scan Options Grid */}
// //       <ScrollView
// //         style={styles.scrollView}
// //         showsVerticalScrollIndicator={false}
// //         contentContainerStyle={styles.scrollContent}
// //       >
// //         <View style={styles.optionsGrid}>
// //           {scanOptions.map((option, index) => (
// //             <TouchableOpacity
// //               key={option.type}
// //               style={styles.optionCard}
// //               onPress={() => handleScanOptionPress(option.type)}
// //               activeOpacity={0.8}
// //             >
// //               <LinearGradient
// //                 colors={option.color}
// //                 style={styles.gradient}
// //                 start={[0, 0]}
// //                 end={[1, 1]}
// //               >
// //                 <View style={styles.iconContainer}>
// //                   <Ionicons name={option.icon} size={32} color="white" />
// //                 </View>
// //                 <Text style={styles.optionTitle}>{option.title}</Text>
// //                 <Text style={styles.optionDescription}>
// //                   {option.description}
// //                 </Text>
// //               </LinearGradient>
// //             </TouchableOpacity>
// //           ))}
// //         </View>

// //         {/* Recent Scans Section */}
// //         <View style={styles.recentSection}>
// //           <Text style={styles.sectionTitle}>Quick Tips</Text>
// //           <View style={styles.tipsContainer}>
// //             <View style={styles.tipItem}>
// //               <Ionicons
// //                 name="bulb-outline"
// //                 size={20}
// //                 color={isDark ? "#4CAF50" : "#2E7D32"}
// //               />
// //               <Text style={styles.tipText}>
// //                 Ensure good lighting for better OCR accuracy
// //               </Text>
// //             </View>
// //             <View style={styles.tipItem}>
// //               <Ionicons
// //                 name="bulb-outline"
// //                 size={20}
// //                 color={isDark ? "#2196F3" : "#1565C0"}
// //               />
// //               <Text style={styles.tipText}>
// //                 Hold camera steady and focus on expiry date
// //               </Text>
// //             </View>
// //             <View style={styles.tipItem}>
// //               <Ionicons
// //                 name="bulb-outline"
// //                 size={20}
// //                 color={isDark ? "#FF9800" : "#EF6C00"}
// //               />
// //               <Text style={styles.tipText}>
// //                 Barcode scanning works best with clear labels
// //               </Text>
// //             </View>
// //           </View>
// //         </View>
// //       </ScrollView>
// //     </SafeAreaView>
// //   );
// // }

// // const createStyles = (isDark: boolean) =>
// //   StyleSheet.create({
// //     container: {
// //       flex: 1,
// //       backgroundColor: isDark ? "#0A0A0A" : "#F5F5F5",
// //     },
// //     header: {
// //       paddingHorizontal: 20,
// //       paddingTop: 20,
// //       paddingBottom: 10,
// //     },
// //     title: {
// //       fontSize: 28,
// //       fontWeight: "bold",
// //       color: isDark ? "#FFFFFF" : "#1A1A1A",
// //       marginBottom: 8,
// //     },
// //     subtitle: {
// //       fontSize: 16,
// //       color: isDark ? "#B0B0B0" : "#666666",
// //       lineHeight: 22,
// //     },
// //     scrollView: {
// //       flex: 1,
// //     },
// //     scrollContent: {
// //       padding: 16,
// //       paddingBottom: 40,
// //     },
// //     optionsGrid: {
// //       flexDirection: "row",
// //       flexWrap: "wrap",
// //       justifyContent: "space-between",
// //     },
// //     optionCard: {
// //       width: "48%",
// //       height: 160,
// //       marginBottom: 16,
// //       borderRadius: 16,
// //       overflow: "hidden",
// //       elevation: 4,
// //       shadowColor: "#000",
// //       shadowOffset: { width: 0, height: 2 },
// //       shadowOpacity: 0.25,
// //       shadowRadius: 3.84,
// //     },
// //     gradient: {
// //       flex: 1,
// //       padding: 16,
// //       justifyContent: "center",
// //       alignItems: "center",
// //     },
// //     iconContainer: {
// //       width: 60,
// //       height: 60,
// //       borderRadius: 30,
// //       backgroundColor: "rgba(255,255,255,0.2)",
// //       justifyContent: "center",
// //       alignItems: "center",
// //       marginBottom: 12,
// //     },
// //     optionTitle: {
// //       fontSize: 16,
// //       fontWeight: "600",
// //       color: "#FFFFFF",
// //       textAlign: "center",
// //       marginBottom: 4,
// //     },
// //     optionDescription: {
// //       fontSize: 12,
// //       color: "rgba(255,255,255,0.8)",
// //       textAlign: "center",
// //       lineHeight: 16,
// //     },
// //     recentSection: {
// //       marginTop: 24,
// //     },
// //     sectionTitle: {
// //       fontSize: 20,
// //       fontWeight: "600",
// //       color: isDark ? "#FFFFFF" : "#1A1A1A",
// //       marginBottom: 16,
// //     },
// //     tipsContainer: {
// //       backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
// //       borderRadius: 12,
// //       padding: 16,
// //       elevation: 2,
// //       shadowColor: "#000",
// //       shadowOffset: { width: 0, height: 1 },
// //       shadowOpacity: 0.2,
// //       shadowRadius: 1.41,
// //     },
// //     tipItem: {
// //       flexDirection: "row",
// //       alignItems: "flex-start",
// //       marginBottom: 12,
// //     },
// //     tipText: {
// //       flex: 1,
// //       fontSize: 14,
// //       color: isDark ? "#E0E0E0" : "#666666",
// //       marginLeft: 12,
// //       lineHeight: 20,
// //     },
// //   });


// //
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
// import React from "react";
// import {
//   Alert,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   useColorScheme,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import * as ImagePicker from 'expo-image-picker';

// export default function ScanScreen() {
//   const colorScheme = useColorScheme();
//   const router = useRouter();
//   const isDark = colorScheme === "dark";
//   const styles = createStyles(isDark);

//   const scanOptions = [
//     {
//       title: "Camera OCR Scan",
//       description: "Scan medicine text using camera",
//       icon: "camera-outline" as const,
//       type: "camera" as const,
//       color: ["#4CAF50", "#45a049"] as [string, string],
//     },
//     {
//       title: "Barcode Scanner",
//       description: "Scan barcode for quick lookup",
//       icon: "barcode-outline" as const,
//       type: "barcode" as const,
//       color: ["#2196F3", "#1976D2"] as [string, string],
//     },
//     {
//       title: "Gallery Upload",
//       description: "Select image from gallery",
//       icon: "image-outline" as const,
//       type: "gallery" as const,
//       color: ["#FF9800", "#F57C00"] as [string, string],
//     },
//     {
//       title: "AI Assistant",
//       description: "Chat about your medicine",
//       icon: "chatbubble-outline" as const,
//       type: "assistant" as const,
//       color: ["#9C27B0", "#7B1FA2"] as [string, string],
//     },
//     {
//       title: "Manual Entry",
//       description: "Enter medicine details manually",
//       icon: "create-outline" as const,
//       type: "manual" as const,
//       color: ["#E91E63", "#C2185B"] as [string, string],
//     },
//   ];

//   const handleScanOptionPress = async (type: string) => {
//     switch (type) {
//       case "camera":
//         router.push("/scan/camera" as any);
//         break;
//       case "barcode":
//         router.push("/scan/barcode-scanner" as any);
//         break;
//       case "gallery":
//         await handleGalleryUpload();
//         break;
//       case "assistant":
//         router.push("/scan/assistant" as any);
//         break;
//       case "manual":
//         router.push("/scan/manual-entry" as any);
//         break;
//     }
//   };

//   const handleGalleryUpload = async () => {
//     try {
//       const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
//       if (!permissionResult.granted) {
//         Alert.alert("Permission required", "We need access to your gallery to select images.");
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.8,
//         base64: false,
//       });

//       if (!result.canceled && result.assets[0].uri) {
//         // Navigate to assistant with the image
//         router.push({
//           pathname: "/scan/assistant",
//           params: { 
//             imageUri: result.assets[0].uri,
//             source: 'gallery'
//           }
//         } as any);
//       }
//     } catch (error) {
//       Alert.alert("Error", "Failed to pick image from gallery");
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.title}>Scan Medicine</Text>
//         <Text style={styles.subtitle}>
//           Choose your preferred method to add medicines quickly
//         </Text>
//       </View>

//       {/* Scan Options Grid */}
//       <ScrollView
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         <View style={styles.optionsGrid}>
//           {scanOptions.map((option) => (
//             <TouchableOpacity
//               key={option.type}
//               style={styles.optionCard}
//               onPress={() => handleScanOptionPress(option.type)}
//               activeOpacity={0.8}
//             >
//               <LinearGradient
//                 colors={option.color}
//                 style={styles.gradient}
//                 start={[0, 0]}
//                 end={[1, 1]}
//               >
//                 <View style={styles.iconContainer}>
//                   <Ionicons name={option.icon} size={32} color="white" />
//                 </View>
//                 <Text style={styles.optionTitle}>{option.title}</Text>
//                 <Text style={styles.optionDescription}>
//                   {option.description}
//                 </Text>
//               </LinearGradient>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Quick Tips */}
//         <View style={styles.recentSection}>
//           <Text style={styles.sectionTitle}>How It Works</Text>
//           <View style={styles.tipsContainer}>
//             <View style={styles.tipItem}>
//               <Ionicons name="camera" size={20} color="#4CAF50" />
//               <Text style={styles.tipText}>
//                 <Text style={styles.tipHighlight}>Camera Scan:</Text> Take a photo of medicine label
//               </Text>
//             </View>
//             <View style={styles.tipItem}>
//               <Ionicons name="barcode" size={20} color="#2196F3" />
//               <Text style={styles.tipText}>
//                 <Text style={styles.tipHighlight}>Barcode:</Text> Quick scan for medicine info
//               </Text>
//             </View>
//             <View style={styles.tipItem}>
//               <Ionicons name="chatbubble" size={20} color="#9C27B0" />
//               <Text style={styles.tipText}>
//                 <Text style={styles.tipHighlight}>AI Assistant:</Text> Get detailed medicine insights
//               </Text>
//             </View>
//           </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const createStyles = (isDark: boolean) =>
//   StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: isDark ? "#0A0A0A" : "#F5F5F5",
//     },
//     header: {
//       paddingHorizontal: 20,
//       paddingTop: 20,
//       paddingBottom: 10,
//     },
//     title: {
//       fontSize: 28,
//       fontWeight: "bold",
//       color: isDark ? "#FFFFFF" : "#1A1A1A",
//       marginBottom: 8,
//     },
//     subtitle: {
//       fontSize: 16,
//       color: isDark ? "#B0B0B0" : "#666666",
//       lineHeight: 22,
//     },
//     scrollView: {
//       flex: 1,
//     },
//     scrollContent: {
//       padding: 16,
//       paddingBottom: 40,
//     },
//     optionsGrid: {
//       flexDirection: "row",
//       flexWrap: "wrap",
//       justifyContent: "space-between",
//     },
//     optionCard: {
//       width: "48%",
//       height: 160,
//       marginBottom: 16,
//       borderRadius: 16,
//       overflow: "hidden",
//       elevation: 4,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.25,
//       shadowRadius: 3.84,
//     },
//     gradient: {
//       flex: 1,
//       padding: 16,
//       justifyContent: "center",
//       alignItems: "center",
//     },
//     iconContainer: {
//       width: 60,
//       height: 60,
//       borderRadius: 30,
//       backgroundColor: "rgba(255,255,255,0.2)",
//       justifyContent: "center",
//       alignItems: "center",
//       marginBottom: 12,
//     },
//     optionTitle: {
//       fontSize: 16,
//       fontWeight: "600",
//       color: "#FFFFFF",
//       textAlign: "center",
//       marginBottom: 4,
//     },
//     optionDescription: {
//       fontSize: 12,
//       color: "rgba(255,255,255,0.8)",
//       textAlign: "center",
//       lineHeight: 16,
//     },
//     recentSection: {
//       marginTop: 24,
//     },
//     sectionTitle: {
//       fontSize: 20,
//       fontWeight: "600",
//       color: isDark ? "#FFFFFF" : "#1A1A1A",
//       marginBottom: 16,
//     },
//     tipsContainer: {
//       backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
//       borderRadius: 12,
//       padding: 16,
//       elevation: 2,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 1 },
//       shadowOpacity: 0.2,
//       shadowRadius: 1.41,
//     },
//     tipItem: {
//       flexDirection: "row",
//       alignItems: "center",
//       marginBottom: 12,
//     },
//     tipText: {
//       flex: 1,
//       fontSize: 14,
//       color: isDark ? "#E0E0E0" : "#666666",
//       marginLeft: 12,
//       lineHeight: 20,
//     },
//     tipHighlight: {
//       fontWeight: "600",
//       color: isDark ? "#FFFFFF" : "#000000",
//     },
//   });