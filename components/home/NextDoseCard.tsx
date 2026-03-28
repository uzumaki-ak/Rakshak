import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import color from "@/shared/color";
import { NotificationService } from "@/services/notifications/notificationService";
import { Medicine } from "@/types/medicine";

interface NextDoseCardProps {
  medicines: Medicine[];
  onActionPress?: () => void;
}

export default function NextDoseCard({ medicines, onActionPress }: NextDoseCardProps) {
  const notificationService = NotificationService.getInstance();
  const [nextDose, setNextDose] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const scaleAnim = useMemo(() => new Animated.Value(1), []);

  const calculateNextDose = () => {
    const next = notificationService.getNextIntake(medicines);
    setNextDose(next);

    if (next) {
      const now = new Date();
      const diffMs = next.date.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 0) {
        setTimeLeft("Dose Overdue!");
      } else if (diffMins < 60) {
        setTimeLeft(`${diffMins} min remaining`);
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setTimeLeft(`${hours}h ${mins}m remaining`);
      }
    }
  };

  useEffect(() => {
    calculateNextDose();
    const interval = setInterval(calculateNextDose, 10000); // 10 sec update for "tick" feel
    return () => clearInterval(interval);
  }, [medicines]);

  if (!nextDose) return null;

  const isOverdue = timeLeft.includes("Overdue");

  return (
    <View style={styles.container}>
      <View style={[styles.card, isOverdue && styles.overdueCard]}>
        <View style={styles.header}>
          <View style={[styles.iconBox, isOverdue && styles.overdueIcon]}>
            <Ionicons name="medical" size={20} color="white" />
          </View>
          <View style={styles.titleArea}>
            <Text style={styles.label}>UPCOMING DOSE</Text>
            <Text style={styles.medName} numberOfLines={1}>{nextDose.medicine.name}</Text>
          </View>
          <View style={styles.timeTag}>
            <Text style={styles.timeTagText}>{nextDose.time}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.countdown, isOverdue && styles.overdueText]}>{timeLeft}</Text>
          <TouchableOpacity 
            style={[styles.actionBtn, isOverdue && styles.overdueBtn]} 
            onPress={onActionPress}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>{isOverdue ? "Take Now" : "Mark Taken"}</Text>
            <Ionicons name="checkmark-circle" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  card: { backgroundColor: color.PRIMARY, borderRadius: 24, padding: 20, shadowColor: color.PRIMARY, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  overdueCard: { backgroundColor: "#FF3B30", shadowColor: "#FF3B30" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  overdueIcon: { backgroundColor: "rgba(255,255,255,0.3)" },
  titleArea: { flex: 1, paddingLeft: 12 },
  label: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontFamily: "PoppinsRegular", fontWeight: "bold", letterSpacing: 1 },
  medName: { color: "white", fontSize: 18, fontFamily: "PoppinsRegular", fontWeight: "bold" },
  timeTag: { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  timeTagText: { color: "white", fontSize: 14, fontFamily: "PoppinsRegular", fontWeight: "bold" },
  content: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  countdown: { color: "white", fontSize: 16, fontFamily: "PoppinsRegular", fontWeight: "600" },
  overdueText: { fontWeight: "bold" },
  actionBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, gap: 8 },
  overdueBtn: { backgroundColor: "rgba(0,0,0,0.15)" },
  actionBtnText: { color: "white", fontSize: 14, fontFamily: "PoppinsRegular", fontWeight: "bold" },
});
