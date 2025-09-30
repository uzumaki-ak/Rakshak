import { OCRService } from '@/services/ocr/ocrService';
import { SupabaseScanService } from '@/services/supabase/scans';
import { OCRProcessingResult, ParsedMedicineData, ScanResult } from '@/types/scan';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

/**
 * Custom hook for scanning operations
 * Handles OCR processing, scan creation, and state management
 */
export const useScanning = (clerkUserId: string | undefined) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);

  const ocrService = OCRService.getInstance();
  const scanService = SupabaseScanService.getInstance();

  /**
   * Process image with OCR and create scan record
   */
  const processImageScan = useCallback(async (
    imageUri: string,
    scanType: ScanResult['scan_type'] = 'ocr_text'
  ): Promise<{
    success: boolean;
    scanResult?: ScanResult;
    parsedData?: ParsedMedicineData;
    error?: string;
  }> => {
    if (!clerkUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setIsProcessing(true);
      setProcessingStep('Creating scan record...');

      // Create initial scan record with pending status
      const scanRecord = await scanService.createScan(clerkUserId, {
        scan_type: scanType,
        image_path: imageUri,
        processing_status: 'processing'
      });

      setCurrentScan(scanRecord);
      setProcessingStep('Processing image...');

      // Process image with OCR
      const ocrResult: OCRProcessingResult = await ocrService.processImage(imageUri);

      if (!ocrResult.success) {
        // Update scan with error
        const updatedScan = await scanService.updateScan(scanRecord.id, clerkUserId, {
          processing_status: 'failed',
          error_message: ocrResult.error || 'OCR processing failed'
        });

        setCurrentScan(updatedScan);
        return { 
          success: false, 
          error: ocrResult.error || 'Failed to process image',
          scanResult: updatedScan 
        };
      }

      setProcessingStep('Updating scan results...');

      // Update scan record with results
      const finalScan = await scanService.updateScan(scanRecord.id, clerkUserId, {
        processing_status: 'completed',
        raw_ocr_text: ocrResult.raw_text,
        parsed_data: ocrResult.parsed_data,
        confidence_score: ocrResult.confidence_score
      });

      setCurrentScan(finalScan);

      // Validate extracted data
      if (ocrResult.parsed_data) {
        const validation = ocrService.validateParsedData(ocrResult.parsed_data);
        if (!validation.isValid) {
          Alert.alert(
            'Data Validation Warning',
            `Some extracted data may be incorrect:\n${validation.errors.join('\n')}`
          );
        }
      }

      return {
        success: true,
        scanResult: finalScan,
        parsedData: ocrResult.parsed_data
      };

    } catch (error) {
      console.error('Scan processing error:', error);
      
      // Update scan record with error if we have one
      if (currentScan) {
        try {
          await scanService.updateScan(currentScan.id, clerkUserId, {
            processing_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
        } catch (updateError) {
          console.error('Error updating scan with failure:', updateError);
        }
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error processing scan' 
      };

    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [clerkUserId, ocrService, scanService, currentScan]);

  /**
   * Process barcode scan
   */
  const processBarcodeData = useCallback(async (
    barcodeData: string
  ): Promise<{
    success: boolean;
    scanResult?: ScanResult;
    error?: string;
  }> => {
    if (!clerkUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setIsProcessing(true);
      setProcessingStep('Processing barcode...');

      // Create scan record for barcode
      const scanRecord = await scanService.createScan(clerkUserId, {
        scan_type: 'barcode',
        raw_ocr_text: barcodeData,
        parsed_data: { barcode: barcodeData },
        processing_status: 'completed',
        confidence_score: 1.0
      });

      setCurrentScan(scanRecord);

      return {
        success: true,
        scanResult: scanRecord
      };

    } catch (error) {
      console.error('Barcode processing error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error processing barcode' 
      };
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [clerkUserId, scanService]);

  /**
   * Load user's scan history
   */
  const loadScanHistory = useCallback(async (options?: {
    limit?: number;
    offset?: number;
    scan_type?: ScanResult['scan_type'];
  }) => {
    if (!clerkUserId) return;

    try {
      setLoading(true);
      const result = await scanService.getUserScans(clerkUserId, options);
      setScanHistory(result.scans);
    } catch (error) {
      console.error('Error loading scan history:', error);
      Alert.alert('Error', 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  }, [clerkUserId, scanService]);

  /**
   * Delete a scan record
   */
  const deleteScan = useCallback(async (scanId: string): Promise<boolean> => {
    if (!clerkUserId) return false;

    try {
      const success = await scanService.deleteScan(scanId, clerkUserId);
      
      if (success) {
        // Remove from local state
        setScanHistory(prev => prev.filter(scan => scan.id !== scanId));
        
        // Clear current scan if it was deleted
        if (currentScan?.id === scanId) {
          setCurrentScan(null);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting scan:', error);
      Alert.alert('Error', 'Failed to delete scan');
      return false;
    }
  }, [clerkUserId, scanService, currentScan]);

  /**
   * Get recent scans for dashboard
   */
  const getRecentScans = useCallback(async (limit: number = 5): Promise<ScanResult[]> => {
    if (!clerkUserId) return [];

    try {
      return await scanService.getRecentScans(clerkUserId, limit);
    } catch (error) {
      console.error('Error getting recent scans:', error);
      return [];
    }
  }, [clerkUserId, scanService]);

  /**
   * Get scan statistics
   */
  const getScanStats = useCallback(async () => {
    if (!clerkUserId) return null;

    try {
      return await scanService.getScanStats(clerkUserId);
    } catch (error) {
      console.error('Error getting scan stats:', error);
      return null;
    }
  }, [clerkUserId, scanService]);

  /**
   * Link scan to medicine record
   */
  const linkToMedicine = useCallback(async (
    scanId: string, 
    medicineId: string
  ): Promise<boolean> => {
    if (!clerkUserId) return false;

    try {
      const updatedScan = await scanService.linkScanToMedicine(scanId, medicineId, clerkUserId);
      
      // Update local state
      setScanHistory(prev => 
        prev.map(scan => scan.id === scanId ? updatedScan : scan)
      );
      
      if (currentScan?.id === scanId) {
        setCurrentScan(updatedScan);
      }
      
      return true;
    } catch (error) {
      console.error('Error linking scan to medicine:', error);
      Alert.alert('Error', 'Failed to link scan to medicine');
      return false;
    }
  }, [clerkUserId, scanService, currentScan]);

  /**
   * Reset current scan state
   */
  const resetScan = useCallback(() => {
    setCurrentScan(null);
    setIsProcessing(false);
    setProcessingStep('');
  }, []);

  /**
   * Get processing status for UI
   */
  const getProcessingStatus = useCallback(() => {
    return {
      isProcessing,
      step: processingStep,
      currentScan
    };
  }, [isProcessing, processingStep, currentScan]);

  return {
    // State
    isProcessing,
    processingStep,
    currentScan,
    scanHistory,
    loading,
    
    // Actions
    processImageScan,
    processBarcodeData,
    loadScanHistory,
    deleteScan,
    getRecentScans,
    getScanStats,
    linkToMedicine,
    resetScan,
    
    // Utils
    getProcessingStatus,
  };
};