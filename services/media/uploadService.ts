import { supabase } from "@/config/SupabaseConfig";
// Legacy import avoids the SDK 53 deprecation error while still working correctly
import * as FileSystem from 'expo-file-system/legacy';
// @ts-ignore
import { decode } from "base-64";

/**
 * UploadService - React Native compatible image upload
 * 
 * Strategy:
 * 1. Cloudinary: uses the RN {uri, type, name} FormData trick — no file reading
 * 2. Supabase Storage: reads base64 via legacy FileSystem, converts to ArrayBuffer
 */
export class UploadService {
  private static instance: UploadService;

  private CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
  private CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "expo_uploads";

  private constructor() {}

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  /**
   * Main Upload — Cloudinary first, Supabase as fallback
   */
  async uploadImage(uri: string): Promise<string> {
    try {
      console.log("Attempting Cloudinary upload...");
      return await this.uploadToCloudinary(uri);
    } catch (error) {
      console.warn("Cloudinary failed, trying Supabase Storage:", error);
      return await this.uploadToSupabase(uri);
    }
  }

  /**
   * Provider 1: Cloudinary
   * Uses React Native's native FormData file object — no reading required.
   */
  private async uploadToCloudinary(uri: string): Promise<string> {
    const filename = uri.split('/').pop() || "upload.jpg";
    const ext = filename.split('.').pop()?.toLowerCase() || "jpg";
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";

    const formData = new FormData();
    // RN-native way: pass file as {uri, type, name} object
    formData.append("file", { uri, type: mimeType, name: filename } as any);
    formData.append("upload_preset", this.CLOUDINARY_PRESET);

    const response = await fetch(this.CLOUDINARY_URL, {
      method: "POST",
      body: formData,
      headers: { "Accept": "application/json" },
    });

    const result = await response.json();
    if (result.secure_url) return result.secure_url;
    throw new Error(result.error?.message || "Cloudinary upload failed");
  }

  /**
   * Provider 2: Supabase Storage (Fallback)
   * Reads file as base64 via legacy FileSystem, converts to ArrayBuffer.
   */
  private async uploadToSupabase(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Decode base64 → binary string → Uint8Array
    const binary = decode(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const filename = `ai-uploads/${Date.now()}-${uri.split('/').pop() || "image.jpg"}`;

    const { data, error } = await supabase.storage
      .from('ai-assets')
      .upload(filename, bytes.buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('ai-assets')
      .getPublicUrl(data.path);

    return publicUrl;
  }
}
