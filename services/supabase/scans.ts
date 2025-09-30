import { supabase } from '@/config/SupabaseConfig';
import { ParsedMedicineData, ScanResult } from '@/types/scan';

/**
 * Supabase service for scan operations
 * Handles CRUD operations for scans table with proper error handling
 */
export class SupabaseScanService {
  private static instance: SupabaseScanService;

  public static getInstance(): SupabaseScanService {
    if (!SupabaseScanService.instance) {
      SupabaseScanService.instance = new SupabaseScanService();
    }
    return SupabaseScanService.instance;
  }

  /**
   * Get user UUID from Clerk user ID
   */
  private async getUserUUID(clerkUserId: string): Promise<string> {
    const { data: userData, error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error || !userData) {
      throw new Error(`User not found in database: ${error?.message}`);
    }

    return userData.id;
  }

  /**
   * Create a new scan record
   */
  async createScan(
    clerkUserId: string,
    scanData: {
      scan_type: ScanResult['scan_type'];
      image_path?: string;
      raw_ocr_text?: string;
      parsed_data?: ParsedMedicineData;
      confidence_score?: number;
      processing_status?: ScanResult['processing_status'];
      error_message?: string;
    }
  ): Promise<ScanResult> {
    try {
      const userUuid = await this.getUserUUID(clerkUserId);

      const { data, error } = await supabase
        .from('scans')
        .insert([
          {
            user_id: userUuid,
            scan_type: scanData.scan_type,
            image_path: scanData.image_path,
            raw_ocr_text: scanData.raw_ocr_text,
            parsed_data: scanData.parsed_data ? JSON.stringify(scanData.parsed_data) : null,
            confidence_score: scanData.confidence_score,
            processing_status: scanData.processing_status || 'pending',
            error_message: scanData.error_message,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating scan:', error);
        throw new Error(`Failed to create scan: ${error.message}`);
      }

      return {
        ...data,
        parsed_data: data.parsed_data ? JSON.parse(data.parsed_data) : undefined
      };

    } catch (error) {
      console.error('Create scan error:', error);
      throw error instanceof Error ? error : new Error('Unknown error creating scan');
    }
  }

  /**
   * Update scan record (usually to update processing status or results)
   */
  async updateScan(
    scanId: string,
    clerkUserId: string,
    updateData: {
      processing_status?: ScanResult['processing_status'];
      raw_ocr_text?: string;
      parsed_data?: ParsedMedicineData;
      confidence_score?: number;
      error_message?: string;
      medicine_id?: string;
    }
  ): Promise<ScanResult> {
    try {
      const userUuid = await this.getUserUUID(clerkUserId);

      const updatePayload: any = {};
      
      if (updateData.processing_status) updatePayload.processing_status = updateData.processing_status;
      if (updateData.raw_ocr_text) updatePayload.raw_ocr_text = updateData.raw_ocr_text;
      if (updateData.parsed_data) updatePayload.parsed_data = JSON.stringify(updateData.parsed_data);
      if (updateData.confidence_score) updatePayload.confidence_score = updateData.confidence_score;
      if (updateData.error_message) updatePayload.error_message = updateData.error_message;
      if (updateData.medicine_id) updatePayload.medicine_id = updateData.medicine_id;

      const { data, error } = await supabase
        .from('scans')
        .update(updatePayload)
        .eq('id', scanId)
        .eq('user_id', userUuid)
        .select()
        .single();

      if (error) {
        console.error('Error updating scan:', error);
        throw new Error(`Failed to update scan: ${error.message}`);
      }

      return {
        ...data,
        parsed_data: data.parsed_data ? JSON.parse(data.parsed_data) : undefined
      };

    } catch (error) {
      console.error('Update scan error:', error);
      throw error instanceof Error ? error : new Error('Unknown error updating scan');
    }
  }

  /**
   * Get user's scan history with pagination
   */
  async getUserScans(
    clerkUserId: string,
    options: {
      limit?: number;
      offset?: number;
      scan_type?: ScanResult['scan_type'];
      status?: ScanResult['processing_status'];
    } = {}
  ): Promise<{
    scans: ScanResult[];
    total: number;
  }> {
    try {
      const userUuid = await this.getUserUUID(clerkUserId);
      const { limit = 50, offset = 0, scan_type, status } = options;

      let query = supabase
        .from('scans')
        .select('*', { count: 'exact' })
        .eq('user_id', userUuid)
        .order('created_at', { ascending: false });

      if (scan_type) {
        query = query.eq('scan_type', scan_type);
      }

      if (status) {
        query = query.eq('processing_status', status);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching scans:', error);
        throw new Error(`Failed to fetch scans: ${error.message}`);
      }

      const scans: ScanResult[] = (data || []).map(scan => ({
        ...scan,
        parsed_data: scan.parsed_data ? JSON.parse(scan.parsed_data) : undefined
      }));

      return {
        scans,
        total: count || 0
      };

    } catch (error) {
      console.error('Get scans error:', error);
      throw error instanceof Error ? error : new Error('Unknown error fetching scans');
    }
  }

  /**
   * Get a specific scan by ID
   */
  async getScanById(scanId: string, clerkUserId: string): Promise<ScanResult | null> {
    try {
      const userUuid = await this.getUserUUID(clerkUserId);

      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('id', scanId)
        .eq('user_id', userUuid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Scan not found
        }
        console.error('Error fetching scan:', error);
        throw new Error(`Failed to fetch scan: ${error.message}`);
      }

      return {
        ...data,
        parsed_data: data.parsed_data ? JSON.parse(data.parsed_data) : undefined
      };

    } catch (error) {
      console.error('Get scan by ID error:', error);
      throw error instanceof Error ? error : new Error('Unknown error fetching scan');
    }
  }

  /**
   * Delete a scan record
   */
  async deleteScan(scanId: string, clerkUserId: string): Promise<boolean> {
    try {
      const userUuid = await this.getUserUUID(clerkUserId);

      const { error } = await supabase
        .from('scans')
        .delete()
        .eq('id', scanId)
        .eq('user_id', userUuid);

      if (error) {
        console.error('Error deleting scan:', error);
        throw new Error(`Failed to delete scan: ${error.message}`);
      }

      return true;

    } catch (error) {
      console.error('Delete scan error:', error);
      throw error instanceof Error ? error : new Error('Unknown error deleting scan');
    }
  }

  /**
   * Get recent scans for dashboard
   */
  async getRecentScans(clerkUserId: string, limit: number = 5): Promise<ScanResult[]> {
    try {
      const userUuid = await this.getUserUUID(clerkUserId);

      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', userUuid)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent scans:', error);
        throw new Error(`Failed to fetch recent scans: ${error.message}`);
      }

      return (data || []).map(scan => ({
        ...scan,
        parsed_data: scan.parsed_data ? JSON.parse(scan.parsed_data) : undefined
      }));

    } catch (error) {
      console.error('Get recent scans error:', error);
      throw error instanceof Error ? error : new Error('Unknown error fetching recent scans');
    }
  }

  /**
   * Get scan statistics for user
   */
  async getScanStats(clerkUserId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    pending: number;
    by_type: Record<ScanResult['scan_type'], number>;
  }> {
    try {
      const userUuid = await this.getUserUUID(clerkUserId);

      const { data, error } = await supabase
        .from('scans')
        .select('scan_type, processing_status')
        .eq('user_id', userUuid);

      if (error) {
        console.error('Error fetching scan stats:', error);
        throw new Error(`Failed to fetch scan stats: ${error.message}`);
      }

      const stats = {
        total: data.length,
        successful: data.filter(s => s.processing_status === 'completed').length,
        failed: data.filter(s => s.processing_status === 'failed').length,
        pending: data.filter(s => s.processing_status === 'pending').length,
        by_type: {
          ocr_text: data.filter(s => s.scan_type === 'ocr_text').length,
          barcode: data.filter(s => s.scan_type === 'barcode').length,
          qr_code: data.filter(s => s.scan_type === 'qr_code').length,
          manual: data.filter(s => s.scan_type === 'manual').length,
        } as Record<ScanResult['scan_type'], number>
      };

      return stats;

    } catch (error) {
      console.error('Get scan stats error:', error);
      throw error instanceof Error ? error : new Error('Unknown error fetching scan stats');
    }
  }

  /**
   * Link a scan to a medicine record
   */
  async linkScanToMedicine(
    scanId: string,
    medicineId: string,
    clerkUserId: string
  ): Promise<ScanResult> {
    try {
      const userUuid = await this.getUserUUID(clerkUserId);

      const { data, error } = await supabase
        .from('scans')
        .update({ medicine_id: medicineId })
        .eq('id', scanId)
        .eq('user_id', userUuid)
        .select()
        .single();

      if (error) {
        console.error('Error linking scan to medicine:', error);
        throw new Error(`Failed to link scan: ${error.message}`);
      }

      return {
        ...data,
        parsed_data: data.parsed_data ? JSON.parse(data.parsed_data) : undefined
      };

    } catch (error) {
      console.error('Link scan to medicine error:', error);
      throw error instanceof Error ? error : new Error('Unknown error linking scan');
    }
  }
}