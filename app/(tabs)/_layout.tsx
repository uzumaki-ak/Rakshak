import { Tabs } from "expo-router";
import {
  BookOpen,
  Bot,
  MapPinHouse,
  PillIcon,
  ScanText,
  ShieldUser,
} from "lucide-react-native";
import React from "react";
import { useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
        tabBarInactiveTintColor: colorScheme === "dark" ? "#8E8E93" : "#666",
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
          borderTopColor: colorScheme === "dark" ? "#38383A" : "#e5e5e5",
        },
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "white",
        },
        headerTintColor: colorScheme === "dark" ? "#FFFFFF" : "#1a1a1a",
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MapPinHouse size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Scan"
        options={{
          tabBarIcon: ({ color, size }) => (
            <ScanText color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="Medicine"
        options={{
          tabBarIcon: ({ color, size }) => (
            <PillIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="Assistant"
        options={{
          tabBarIcon: ({ color, size }) => <Bot color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="History"
        options={{
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <ShieldUser color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
