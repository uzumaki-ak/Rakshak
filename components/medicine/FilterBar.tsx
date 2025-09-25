// import React from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// interface FilterBarProps {
//   activeFilter: 'all' | 'active' | 'expired' | 'expiring';
//   onFilterChange: (filter: 'all' | 'active' | 'expired' | 'expiring') => void;
//   searchQuery: string;
//   onSearchChange: (query: string) => void;
// }

// const FilterBar: React.FC<FilterBarProps> = ({
//   activeFilter,
//   onFilterChange,
//   searchQuery,
//   onSearchChange,
// }) => {
//   const filters = [
//     { key: 'all' as const, label: 'All', icon: 'apps' },
//     { key: 'active' as const, label: 'Active', icon: 'checkmark-circle' },
//     { key: 'expiring' as const, label: 'Expiring', icon: 'time' },
//     { key: 'expired' as const, label: 'Expired', icon: 'warning' },
//   ];

//   return (
//     <View style={styles.container}>
//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <Ionicons name="search" size={20} color="#666" />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search medicines..."
//           value={searchQuery}
//           onChangeText={onSearchChange}
//           clearButtonMode="while-editing"
//         />
//       </View>

//       {/* Filter Tabs */}
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
//         {filters.map((filter) => (
//           <TouchableOpacity
//             key={filter.key}
//             style={[
//               styles.filterButton,
//               activeFilter === filter.key && styles.filterButtonActive,
//             ]}
//             onPress={() => onFilterChange(filter.key)}
//           >
//             <Ionicons
//               name={filter.icon as any}
//               size={16}
//               color={activeFilter === filter.key ? '#007AFF' : '#666'}
//             />
//             <Text style={[
//               styles.filterText,
//               activeFilter === filter.key && styles.filterTextActive,
//             ]}>
//               {filter.label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>
//     </View>
//   );
// };

// import { ScrollView } from 'react-native';

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: 'white',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e5e5',
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     marginBottom: 12,
//   },
//   searchInput: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 16,
//     color: '#1a1a1a',
//   },
//   filterContainer: {
//     flexDirection: 'row',
//   },
//   filterButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginRight: 8,
//     minWidth: 80,
//     justifyContent: 'center',
//   },
//   filterButtonActive: {
//     backgroundColor: '#007AFF20',
//     borderColor: '#007AFF',
//     borderWidth: 1,
//   },
//   filterText: {
//     marginLeft: 6,
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#666',
//   },
//   filterTextActive: {
//     color: '#007AFF',
//   },
// });

// export default FilterBar;

//

// FilterBar.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

interface FilterBarProps {
  activeFilter: "all" | "active" | "expired" | "expiring";
  onFilterChange: (filter: "all" | "active" | "expired" | "expiring") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const filters = [
    { key: "all" as const, label: "All", icon: "apps" },
    { key: "active" as const, label: "Active", icon: "checkmark-circle" },
    { key: "expiring" as const, label: "Expiring", icon: "time" },
    { key: "expired" as const, label: "Expired", icon: "warning" },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#07070a" : "white",
          borderBottomColor: isDark ? "#111214" : "#e5e5e5",
        },
      ]}
    >
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: isDark ? "#0c0c0e" : "#f5f5f5" },
        ]}
      >
        <Ionicons name="search" size={20} color={isDark ? "#9b9b9f" : "#666"} />
        <TextInput
          style={[
            styles.searchInput,
            { color: isDark ? "#f0f0f5" : "#1a1a1a" },
          ]}
          placeholder="Search medicines..."
          placeholderTextColor={isDark ? "#7d7d82" : "#9b9b9b"}
          value={searchQuery}
          onChangeText={onSearchChange}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              activeFilter === filter.key && {
                backgroundColor: isDark ? "#12203A" : "#E8F0FF",
                borderColor: isDark ? "#2D89FF" : "#007AFF",
                borderWidth: 1,
              },
            ]}
            onPress={() => onFilterChange(filter.key)}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={
                activeFilter === filter.key
                  ? isDark
                    ? "#2D89FF"
                    : "#007AFF"
                  : isDark
                  ? "#b8b8bf"
                  : "#666"
              }
            />
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.key && {
                  color: isDark ? "#2D89FF" : "#007AFF",
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    marginRight: 8,
    minWidth: 80,
    justifyContent: "center",
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default FilterBar;
