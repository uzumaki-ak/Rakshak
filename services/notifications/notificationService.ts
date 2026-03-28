import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * NotificationService
 * Handles local notifications for medicine expiry alerts and intake reminders.
 * Integrated with Expo Notifications for cross-platform reliability.
 */
export class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    this.configure();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Configure notification behavior
   */
  private configure() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  /**
   * Request permissions for notifications
   */
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  }

  /**
   * Schedule a notification for medicine expiry
   */
  async scheduleExpiryAlert(medicineId: string, medicineName: string, expiryDate: string) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    
    // Alert 30 days before
    const alertDate = new Date(expiry.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    if (alertDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Expiry Warning ⚠️",
          body: `${medicineName} will expire in 30 days. Consider usage or replacement.`,
          data: { medicineId, type: 'expiry' },
        },
        trigger: { date: alertDate } as any, // Typed as any to bypass SDK 54 type mismatch if Date is directly rejected
      });
    }

    // Alert 7 days before
    const criticalDate = new Date(expiry.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (criticalDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Critical Expiry Alert!! 🚨",
          body: `${medicineName} expires in 7 days. Check stock immediately.`,
          data: { medicineId, type: 'expiry_critical' },
        },
        trigger: { date: criticalDate } as any,
      });
    }
  }

  /**
   * Cancel all notifications for a specific medicine
   */
  async cancelMedicineNotifications(medicineId: string) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.medicineId === medicineId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}
