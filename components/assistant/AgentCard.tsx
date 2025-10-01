import { AIAgent } from "@/types/assistant";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface AgentCardProps {
  agent: AIAgent;
  onPress: () => void;
}

export default function AgentCard({ agent, onPress }: AgentCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const getIconColor = (category: string) => {
    switch (category) {
      case 'medicine':
        return isDark ? '#FF6B6B' : '#FF3B30';
      case 'analysis':
        return isDark ? '#5FD0D8' : '#007AFF';
      case 'assistance':
        return isDark ? '#34C759' : '#32D74B';
      default:
        return isDark ? '#BA8AFF' : '#5856D6';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'medicine': return 'Medicine';
      case 'analysis': return 'Analysis';
      case 'assistance': return 'Assistance';
      default: return 'Custom';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "white" }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View 
          style={[
            styles.iconContainer, 
            { backgroundColor: getIconColor(agent.category) }
          ]}
        >
          <Ionicons 
            name={agent.icon as any} 
            size={20} 
            color="white" 
          />
        </View>
        
        {agent.type === 'custom' && (
          <View style={styles.customBadge}>
            <Text style={styles.customBadgeText}>Custom</Text>
          </View>
        )}
      </View>

      <Text style={styles.agentName} numberOfLines={2}>
        {agent.name}
      </Text>
      
      <Text style={styles.agentDescription} numberOfLines={2}>
        {agent.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={[styles.categoryBadge, { 
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' 
        }]}>
          <Text style={styles.categoryText}>
            {getCategoryLabel(agent.category)}
          </Text>
        </View>
        
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={isDark ? "#8E8E93" : "#666"} 
        />
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: '48%',
      maxWidth: '48%',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    customBadge: {
      backgroundColor: isDark ? '#BA8AFF' : '#5856D6',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    customBadgeText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '600',
    },
    agentName: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 4,
    },
    agentDescription: {
      fontSize: 12,
      color: isDark ? "#8E8E93" : "#666",
      marginBottom: 12,
      lineHeight: 16,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    categoryText: {
      fontSize: 10,
      fontWeight: "500",
      color: isDark ? "#8E8E93" : "#666",
    },
  });