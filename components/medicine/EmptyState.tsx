// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// interface EmptyStateProps {
//   filter: string;
//   searchQuery: string;
//   onAddMedicine: () => void;
// }

// const EmptyState: React.FC<EmptyStateProps> = ({ filter, searchQuery, onAddMedicine }) => {
//   const getMessage = () => {
//     if (searchQuery) {
//       return `No medicines found for "${searchQuery}"`;
//     }

//     switch (filter) {
//       case 'active': return 'No active medicines';
//       case 'expired': return 'No expired medicines';
//       case 'expiring': return 'No medicines expiring soon';
//       default: return 'No medicines yet';
//     }
//   };

//   const getSubMessage = () => {
//     if (searchQuery) {
//       return 'Try adjusting your search terms';
//     }
//     return 'Add your first medicine to get started';
//   };

//   return (
//     <View style={styles.container}>
//       <Ionicons name="medical" size={64} color="#e5e5e5" />
//       <Text style={styles.title}>{getMessage()}</Text>
//       <Text style={styles.subtitle}>{getSubMessage()}</Text>

//       {!searchQuery && (
//         <TouchableOpacity style={styles.addButton} onPress={onAddMedicine}>
//           <Ionicons name="add" size={20} color="white" />
//           <Text style={styles.addButtonText}>Add Medicine</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#666',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#999',
//     marginTop: 8,
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   addButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 25,
//     marginTop: 20,
//     shadowColor: '#007AFF',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   addButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
// });

// export default EmptyState;

///
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

interface EmptyStateProps {
  filter: string;
  searchQuery: string;
  onAddMedicine: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  filter,
  searchQuery,
  onAddMedicine,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getMessage = () => {
    if (searchQuery) {
      return `No medicines found for "${searchQuery}"`;
    }

    switch (filter) {
      case "active":
        return "No active medicines";
      case "expired":
        return "No expired medicines";
      case "expiring":
        return "No medicines expiring soon";
      default:
        return "No medicines yet";
    }
  };

  const getSubMessage = () => {
    if (searchQuery) {
      return "Try adjusting your search terms";
    }
    return "Add your first medicine to get started";
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#050507" : "transparent" },
      ]}
    >
      <Ionicons
        name="medical"
        size={84}
        color={isDark ? "#1f2937" : "#e8eef7"}
      />
      <Text style={[styles.title, { color: isDark ? "#fff" : "#475569" }]}>
        {getMessage()}
      </Text>
      <Text
        style={[styles.subtitle, { color: isDark ? "#b8b8bf" : "#6b7280" }]}
      >
        {getSubMessage()}
      </Text>

      {!searchQuery && (
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
          ]}
          onPress={onAddMedicine}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Medicine</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // removed flex:1 so it won't stretch and change layout heights
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 220,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 22,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 10,
  },
});

export default EmptyState;
