import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

/**
 * Layout for Scan Feature Stack Navigation
 * Defines all scan-related screens and their configurations
 */
export default function ScanLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? "#000000" : "#F8F9FA",
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="camera"
        options={{
          title: "Camera",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="barcode-scanner"
        options={{
          title: "Barcode Scanner",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="ocr-results"
        options={{
          title: "Scan Results",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="manual-entry"
        options={{
          title: "Manual Entry",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: "Scan History",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
