import { supabase } from "@/config/SupabaseConfig";
import * as FileSystem from 'expo-file-system';
// @ts-ignore
import { decode } from "base-64";

/**
 * UploadService
 * Robust image upload with fallback logic:
 * Cloudinary -> ImageKit -> Supabase Storage.
 * Essential for the AI Assistant's multimodal report analysis.
 */
export class UploadService {
  private static instance: UploadService;

  private CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
  private CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "expo_uploads";
  
  private IMAGEKIT_URL = "https://upload.imagekit.io/api/v1/files/upload";
  private IMAGEKIT_PUBLIC_KEY = process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY;

  private constructor() {}

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  /**
   * Main Upload Method with Fallbacks
   * @param uri Local file URI
   */
  async uploadImage(uri: string): Promise<string> {
    try {
      console.log("Attempting Cloudinary upload...");
      return await this.uploadToCloudinary(uri);
    } catch (error) {
      console.warn("Cloudinary failed, trying ImageKit:", error);
      try {
        return await this.uploadToImageKit(uri);
      } catch (ikError) {
        console.warn("ImageKit failed, trying Supabase:", ikError);
        return await this.uploadToSupabase(uri);
      }
    }
  }

  /**
   * Provider 1: Cloudinary
   */
  private async uploadToCloudinary(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
    const data = `data:image/jpeg;base64,${base64}`;

    const formData = new FormData();
    formData.append("file", data);
    formData.append("upload_preset", this.CLOUDINARY_PRESET);

    const response = await fetch(this.CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.secure_url) return result.secure_url;
    throw new Error(result.error?.message || "Cloudinary upload failed");
  }

  /**
   * Provider 2: ImageKit
   */
  private async uploadToImageKit(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
    const filename = uri.split('/').pop() || "upload.jpg";

    const formData = new FormData();
    formData.append("file", base64);
    formData.append("fileName", filename);
    formData.append("publicKey", this.IMAGEKIT_PUBLIC_KEY || "");
    // ImageKit usually requires private key for server-side, 
    // but for client-side we'd need a signature. 
    // For now, we'll favor Supabase if Cloudinary is out.
    throw new Error("ImageKit requires backend signature for client upload");
  }

  /**
   * Provider 3: Supabase Storage (Final Fallback)
   */
  private async uploadToSupabase(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
    const filename = `reports/${Date.now()}-${uri.split('/').pop()}`;
    
    // Convert base64 to ArrayBuffer for Supabase using base-64 decode
    const binary = decode(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    const { data, error } = await supabase.storage
      .from('ai-assets')
      .upload(filename, bytes.buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('ai-assets')
      .getPublicUrl(data.path);

    return publicUrl;
  }
}
