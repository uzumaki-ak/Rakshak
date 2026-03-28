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
import color from "@/shared/color";

interface MedicineCardProps {
  medicine: Medicine;
  onPress: () => void;
}

/**
 * MedicineCard
 * A premium card component for displaying medicine details in a list.
 * Fixed "shrinking" issue by ensuring full-width layout and consistent padding.
 */
const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onPress }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getExpiryStatus = () => {
    if (!medicine.expiry_date) return "unknown";
    const expiry = new Date(medicine.expiry_date);
    const today = new Date();
    const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (expiry < today) return "expired";
    if (expiry <= thirtyDays) return "expiring";
    return "good";
  };

  const getStatusInfo = () => {
    const status = getExpiryStatus();
    switch (status) {
      case "expired": return { color: "#FF3B30", icon: "warning", label: "Expired" };
      case "expiring": return { color: "#FF9500", icon: "time", label: "Expiring" };
      case "good": return { color: "#34C759", icon: "checkmark-circle", label: "Safe" };
      default: return { color: isDark ? "#8E8E93" : "#8E8E93", icon: "help-circle", label: "Unknown" };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const status = getStatusInfo();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderColor: isDark ? "#2C2C2E" : "#ECEEF2",
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text
            style={[styles.name, { color: isDark ? "#FFFFFF" : "#1A1A1E" }]}
            numberOfLines={1}
          >
            {medicine.name}
          </Text>
          {medicine.generic_name && (
            <Text style={[styles.genericName, { color: isDark ? "#8E8E93" : "#636366" }]} numberOfLines={1}>
              {medicine.generic_name}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.color + "15" }]}>
          <Ionicons name={status.icon as any} size={14} color={status.color} />
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="medical" size={16} color={color.PRIMARY} />
          <Text style={[styles.detailText, { color: isDark ? "#D1D1D6" : "#48484A" }]}>
            {medicine.strength || "—"}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="layers" size={16} color={color.PRIMARY} />
          <Text style={[styles.detailText, { color: isDark ? "#D1D1D6" : "#48484A" }]}>
            {medicine.current_quantity || 0} {medicine.unit_type || "units"}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color={status.color} />
          <Text style={[styles.detailText, { color: status.color, fontWeight: '600' }]}>
            Exp: {formatDate(medicine.expiry_date)}
          </Text>
        </View>
      </View>

      {medicine.medicine_type && (
        <View style={[styles.typeBadge, { backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7" }]}>
          <Text style={[styles.typeText, { color: isDark ? "#AEAEB2" : "#636366" }]}>
            {medicine.medicine_type.toUpperCase()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%', // Critical to prevent shrinking
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    fontFamily: "PoppinsRegular",
    fontWeight: "bold",
    marginBottom: 2,
  },
  genericName: {
    fontSize: 13,
    fontFamily: "PoppinsRegular",
    fontStyle: "italic",
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: "PoppinsRegular",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    fontFamily: "PoppinsRegular",
  },
  typeBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 9,
    fontFamily: "PoppinsRegular",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

export default MedicineCard;
