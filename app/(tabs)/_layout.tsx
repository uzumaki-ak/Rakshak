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

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "black",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          color: "white",
        },
        headerStyle: {
          backgroundColor: "black",
        },
        headerTintColor: "white",
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
            <ScanText color={color} size={size} />
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
