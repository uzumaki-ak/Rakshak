import { OCRService } from '@/services/ocr/ocrService';
import { SupabaseScanService } from '@/services/supabase/scans';
import { BarcodeLookupService } from '@/services/barcode/barcodeLookupService';
import { OCRProcessingResult, ParsedMedicineData, ScanResult } from '@/types/scan';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

/**
 * Custom hook for REAL scanning operations
 * Handles OCR processing with Google ML Kit & Gemini AI, scan creation, and state management
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
   * Process image with REAL OCR (Google ML Kit + Gemini AI) and create scan record
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

    let scanRecord: ScanResult | null = null;

    try {
      setIsProcessing(true);
      setProcessingStep('Creating scan record...');

      // Create initial scan record with pending status
      scanRecord = await scanService.createScan(clerkUserId, {
        scan_type: scanType,
        image_path: imageUri,
        processing_status: 'processing'
      });

      setCurrentScan(scanRecord);
      
      // Step 1: Extract text using Google ML Kit
      setProcessingStep('Extracting text with Google ML Kit...');
      console.log('Starting OCR text extraction...');

      // Step 2: Process image with REAL OCR service
      const ocrResult: OCRProcessingResult = await ocrService.processImage(imageUri);

      if (!ocrResult.success) {
        console.error('OCR processing failed:', ocrResult.error);
        
        // Update scan with error
        const updatedScan = await scanService.updateScan(scanRecord.id, clerkUserId, {
          processing_status: 'failed',
          error_message: ocrResult.error || 'OCR processing failed'
        });

        setCurrentScan(updatedScan);
        return { 
          success: false, 
          error: ocrResult.error || 'Failed to process image. Please ensure the image is clear and contains readable text.',
          scanResult: updatedScan 
        };
      }

      console.log('OCR extraction successful!');
      console.log('Raw text:', ocrResult.raw_text?.substring(0, 100) + '...');
      console.log('Parsed data:', ocrResult.parsed_data);

      setProcessingStep('Parsing medicine information with AI...');

      // Update scan record with OCR results
      const finalScan = await scanService.updateScan(scanRecord.id, clerkUserId, {
        processing_status: 'completed',
        raw_ocr_text: ocrResult.raw_text,
        parsed_data: ocrResult.parsed_data,
        confidence_score: ocrResult.confidence_score
      });

      setCurrentScan(finalScan);
      console.log('Scan record updated successfully');

      // Validate extracted data
      if (ocrResult.parsed_data) {
        const validation = ocrService.validateParsedData(ocrResult.parsed_data);
        if (!validation.isValid && validation.errors.length > 0) {
          console.warn('Validation warnings:', validation.errors);
          Alert.alert(
            'Data Validation',
            `Please verify the extracted data:\n• ${validation.errors.join('\n• ')}`,
            [{ text: 'OK' }]
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
      if (scanRecord) {
        try {
          await scanService.updateScan(scanRecord.id, clerkUserId, {
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
  }, [clerkUserId, ocrService, scanService]);

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

      console.log('Processing barcode:', barcodeData);

      // Hook into the Barcode Lookup Service to run FDA/OpenFoodFacts/AI fallback
      const lookupService = BarcodeLookupService.getInstance();
      const lookupResult = await lookupService.lookupBarcode(barcodeData, 'auto');
      
      let parsedData: Partial<ParsedMedicineData> = { barcode: barcodeData };
      if (lookupResult.source && lookupResult.product) {
        parsedData = {
          ...parsedData,
          name: lookupResult.product.name || undefined,
          manufacturer: lookupResult.product.manufacturer || undefined,
          generic_name: lookupResult.product.ingredients ? lookupResult.product.ingredients.join(', ') : undefined
        };
      }

      // Create scan record for barcode with the retrieved augmented data
      const scanRecord = await scanService.createScan(clerkUserId, {
        scan_type: 'barcode',
        raw_ocr_text: lookupResult.rawResponse ? JSON.stringify(lookupResult.rawResponse) : barcodeData,
        parsed_data: parsedData as ParsedMedicineData,
        processing_status: 'completed',
        confidence_score: lookupResult.source ? 0.9 : 0.5
      });

      setCurrentScan(scanRecord);
      console.log('Barcode scan record created');

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
      console.log(`Loaded ${result.scans.length} scans from history`);
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

        console.log('Scan deleted successfully');
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
      const scans = await scanService.getRecentScans(clerkUserId, limit);
      console.log(`Fetched ${scans.length} recent scans`);
      return scans;
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
      const stats = await scanService.getScanStats(clerkUserId);
      console.log('Scan statistics:', stats);
      return stats;
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

      console.log('Scan linked to medicine successfully');
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
    console.log('Scan state reset');
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