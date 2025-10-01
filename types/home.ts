export interface HomeStats {
  totalMedicines: number;
  expiringSoon: number;
  expired: number;
  activeReminders: number;
  recentScans: number;
}

export interface ExpiryAlert {
  id: string;
  medicineName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  severity: 'critical' | 'warning' | 'info';
}

export interface RecentActivity {
  id: string;
  type: 'scan' | 'reminder' | 'medicine_added' | 'chat' | 'report_uploaded';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface MedicineStatusData {
  active: number;
  expired: number;
  expiring: number;
  consumed: number;
  donated: number;
}