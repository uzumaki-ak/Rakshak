import { Stack } from "expo-router";

export default function MedicinesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: "Add Medicine",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Medicine Details",
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: "Edit Medicine",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
