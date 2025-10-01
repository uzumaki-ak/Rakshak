import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from "react-native";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Search..." 
}: SearchBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1C1C1E" : "white" }]}>
      <Ionicons 
        name="search" 
        size={20} 
        color={isDark ? "#8E8E93" : "#666"} 
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#636366" : "#999"}
        clearButtonMode="while-editing"
      />
      {searchQuery.length > 0 && (
        <Ionicons 
          name="close-circle" 
          size={20} 
          color={isDark ? "#8E8E93" : "#666"} 
          style={styles.clearIcon}
          onPress={() => onSearchChange('')}
        />
      )}
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      margin: 16,
      marginTop: 8,
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    searchIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      padding: 0,
    },
    clearIcon: {
      marginLeft: 8,
    },
  });