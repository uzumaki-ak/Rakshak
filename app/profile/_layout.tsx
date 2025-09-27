import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="health-profile"
        options={{
          title: "Health Profile",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="emergency-contacts"
        options={{
          title: "Emergency Contacts",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          title: "Privacy",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}