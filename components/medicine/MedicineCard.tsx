// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { Medicine } from '@/types/medicine';
// import { Ionicons } from '@expo/vector-icons';

// interface MedicineCardProps {
//   medicine: Medicine;
//   onPress: () => void;
// }

// const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onPress }) => {
//   const getExpiryStatus = () => {
//     if (!medicine.expiry_date) return 'unknown';

//     const expiry = new Date(medicine.expiry_date);
//     const today = new Date();
//     const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

//     if (expiry < today) return 'expired';
//     if (expiry <= thirtyDaysFromNow) return 'expiring';
//     return 'good';
//   };

//   const getStatusColor = () => {
//     const status = getExpiryStatus();
//     switch (status) {
//       case 'expired': return '#FF3B30';
//       case 'expiring': return '#FF9500';
//       case 'good': return '#34C759';
//       default: return '#8E8E93';
//     }
//   };

//   const getStatusIcon = () => {
//     const status = getExpiryStatus();
//     switch (status) {
//       case 'expired': return 'warning';
//       case 'expiring': return 'time';
//       case 'good': return 'checkmark-circle';
//       default: return 'help-circle';
//     }
//   };

//   const formatDate = (dateString?: string) => {
//     if (!dateString) return 'No expiry';
//     return new Date(dateString).toLocaleDateString('en-GB', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric'
//     });
//   };

//   const expiryStatus = getExpiryStatus();
//   const statusColor = getStatusColor();
//   const statusIcon = getStatusIcon();

//   return (
//     <TouchableOpacity style={styles.card} onPress={onPress}>
//       <View style={styles.header}>
//         <Text style={styles.name} numberOfLines={1}>
//           {medicine.name}
//         </Text>
//         <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
//           <Ionicons name={statusIcon as any} size={16} color="white" />
//         </View>
//       </View>

//       {medicine.generic_name && (
//         <Text style={styles.genericName} numberOfLines={1}>
//           {medicine.generic_name}
//         </Text>
//       )}

//       <View style={styles.details}>
//         <View style={styles.detailRow}>
//           <Ionicons name="fitness" size={16} color="#666" />
//           <Text style={styles.detailText}>{medicine.strength || 'No strength'}</Text>
//         </View>

//         <View style={styles.detailRow}>
//           <Ionicons name="cube" size={16} color="#666" />
//           <Text style={styles.detailText}>
//             {medicine.current_quantity} {medicine.unit_type || 'units'}
//           </Text>
//         </View>
//       </View>

//       <View style={styles.footer}>
//         <View style={styles.expiryContainer}>
//           <Ionicons name="calendar" size={14} color="#666" />
//           <Text style={[styles.expiryText, { color: statusColor }]}>
//             {formatDate(medicine.expiry_date)}
//           </Text>
//         </View>

//         {medicine.medicine_type && (
//           <View style={styles.typeBadge}>
//             <Text style={styles.typeText}>{medicine.medicine_type}</Text>
//           </View>
//         )}
//       </View>
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   name: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1a1a1a',
//     flex: 1,
//     marginRight: 8,
//   },
//   statusIndicator: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   genericName: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 12,
//     fontStyle: 'italic',
//   },
//   details: {
//     marginBottom: 12,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   detailText: {
//     fontSize: 14,
//     color: '#666',
//     marginLeft: 8,
//   },
//   footer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   expiryContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   expiryText: {
//     fontSize: 13,
//     fontWeight: '500',
//     marginLeft: 4,
//   },
//   typeBadge: {
//     backgroundColor: '#f0f0f0',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   typeText: {
//     fontSize: 12,
//     color: '#666',
//     fontWeight: '500',
//   },
// });

// export default MedicineCard;

//

// MedicineCard.tsx
import { Medicine } from "@/types/medicine";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

interface MedicineCardProps {
  medicine: Medicine;
  onPress: () => void;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onPress }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getExpiryStatus = () => {
    if (!medicine.expiry_date) return "unknown";

    const expiry = new Date(medicine.expiry_date);
    const today = new Date();
    const thirtyDaysFromNow = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    if (expiry < today) return "expired";
    if (expiry <= thirtyDaysFromNow) return "expiring";
    return "good";
  };

  const getStatusColor = () => {
    const status = getExpiryStatus();
    switch (status) {
      case "expired":
        return "#FF3B30";
      case "expiring":
        return "#FF9500";
      case "good":
        return "#34C759";
      default:
        return isDark ? "#8E8E93" : "#8E8E93";
    }
  };

  const getStatusIcon = () => {
    const status = getExpiryStatus();
    switch (status) {
      case "expired":
        return "warning";
      case "expiring":
        return "time";
      case "good":
        return "checkmark-circle";
      default:
        return "help-circle";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const expiryStatus = getExpiryStatus();
  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon();

  return (
    <TouchableOpacity
      style={[
        cardStyles.card,
        {
          backgroundColor: isDark ? "#0C0C0E" : "#fff",
          shadowColor: isDark ? "#000" : "#000",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={cardStyles.header}>
        <Text
          style={[cardStyles.name, { color: isDark ? "#fff" : "#1a1a1a" }]}
          numberOfLines={1}
        >
          {medicine.name}
        </Text>
        <View
          style={[cardStyles.statusIndicator, { backgroundColor: statusColor }]}
        >
          <Ionicons name={statusIcon as any} size={16} color="white" />
        </View>
      </View>

      {medicine.generic_name && (
        <Text
          style={[
            cardStyles.genericName,
            { color: isDark ? "#b8b8bf" : "#666" },
          ]}
          numberOfLines={1}
        >
          {medicine.generic_name}
        </Text>
      )}

      <View style={cardStyles.details}>
        <View style={cardStyles.detailRow}>
          <Ionicons
            name="fitness"
            size={16}
            color={isDark ? "#9b9b9f" : "#666"}
          />
          <Text
            style={[
              cardStyles.detailText,
              { color: isDark ? "#d0d0d5" : "#666" },
            ]}
          >
            {medicine.strength || "No strength"}
          </Text>
        </View>

        <View style={cardStyles.detailRow}>
          <Ionicons name="cube" size={16} color={isDark ? "#9b9b9f" : "#666"} />
          <Text
            style={[
              cardStyles.detailText,
              { color: isDark ? "#d0d0d5" : "#666" },
            ]}
          >
            {medicine.current_quantity} {medicine.unit_type || "units"}
          </Text>
        </View>
      </View>

      <View style={cardStyles.footer}>
        <View style={cardStyles.expiryContainer}>
          <Ionicons
            name="calendar"
            size={14}
            color={isDark ? "#9b9b9f" : "#666"}
          />
          <Text style={[cardStyles.expiryText, { color: statusColor }]}>
            {formatDate(medicine.expiry_date)}
          </Text>
        </View>

        {medicine.medicine_type && (
          <View
            style={[
              cardStyles.typeBadge,
              { backgroundColor: isDark ? "#111216" : "#f0f0f0" },
            ]}
          >
            <Text
              style={[
                cardStyles.typeText,
                { color: isDark ? "#d0d0d5" : "#666" },
              ]}
            >
              {medicine.medicine_type}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  genericName: {
    fontSize: 14,
    marginBottom: 10,
    fontStyle: "italic",
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  expiryText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default MedicineCard;
