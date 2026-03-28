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
      await Notifications.setNotificationChannelAsync('medicine-reminders', {
        name: 'Medicine Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
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
    
    const alertDate = new Date(expiry.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (alertDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Expiry Warning ⚠️",
          body: `${medicineName} will expire in 30 days. Consider usage or replacement.`,
          data: { medicineId, type: 'expiry' },
        },
        trigger: { date: alertDate } as any,
      });
    }

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
   * Schedule daily intake reminders
   * @param medicineId 
   * @param name 
   * @param times Array of times in "HH:mm" format
   */
  async scheduleIntakeReminders(medicineId: string, name: string, times: string[]) {
    for (const time of times) {
      const [hour, minute] = time.split(':').map(Number);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time for Medicine! 💊",
          body: `It's time to take your dose of ${name}.`,
          data: { medicineId, type: 'intake', time },
          sound: true,
        },
        trigger: {
          hour,
          minute,
          repeats: true,
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        } as any,
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
   * Get the next upcoming intake time across all medicines
   */
  getNextIntake(medicines: any[]): { medicine: any, time: string, date: Date } | null {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    let nextIntake: { medicine: any, time: string, date: Date } | null = null;
    let minDiff = Infinity;

    for (const med of medicines) {
      if (!med.intake_times || med.intake_times.length === 0) continue;

      for (const time of med.intake_times) {
        const [h, m] = time.split(':').map(Number);
        const intakeMinutes = h * 60 + m;
        
        let diff = intakeMinutes - currentMinutes;
        let intakeDate = new Date(now);
        intakeDate.setHours(h, m, 0, 0);

        if (diff <= 0) {
          diff += 24 * 60; // Next day
          intakeDate.setDate(intakeDate.getDate() + 1);
        }

        if (diff < minDiff) {
          minDiff = diff;
          nextIntake = { medicine: med, time, date: intakeDate };
        }
      }
    }

    return nextIntake;
  }

  /**
   * Cancel all notifications
   */
  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}
