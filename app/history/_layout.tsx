import { Stack } from "expo-router";

export default function HistoryLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="reminders"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="export"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reports/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
