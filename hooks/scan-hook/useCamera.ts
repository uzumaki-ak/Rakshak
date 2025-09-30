import { CameraPermissions } from '@/types/scan';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';

/**
 * Custom hook for camera and media library permissions and operations
 */
export const useCamera = () => {
  const [permissions, setPermissions] = useState<CameraPermissions>({
    camera: false,
    mediaLibrary: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Request camera and media library permissions on mount
   */
  useEffect(() => {
    requestPermissions();
  }, []);

  /**
   * Request all required permissions
   */
  const requestPermissions = async () => {
    try {
      setIsLoading(true);

      // Request camera permissions
      const cameraResult = await Camera.requestCameraPermissionsAsync();
      
      // Request media library permissions
      const mediaLibraryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      setPermissions({
        camera: cameraResult.status === 'granted',
        mediaLibrary: mediaLibraryResult.status === 'granted',
      });

    } catch (error) {
      console.error('Error requesting permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Take photo using camera
   */
  const takePhoto = async (): Promise<{ uri: string; cancelled: boolean }> => {
    try {
      if (!permissions.camera) {
        await requestPermissions();
        if (!permissions.camera) {
          throw new Error('Camera permission not granted');
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      return {
        uri: result.canceled ? '' : result.assets[0].uri,
        cancelled: result.canceled
      };

    } catch (error) {
      console.error('Error taking photo:', error);
      throw new Error('Failed to take photo');
    }
  };

  /**
   * Pick image from gallery
   */
  const pickImage = async (): Promise<{ uri: string; cancelled: boolean }> => {
    try {
      if (!permissions.mediaLibrary) {
        await requestPermissions();
        if (!permissions.mediaLibrary) {
          throw new Error('Media library permission not granted');
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      return {
        uri: result.canceled ? '' : result.assets[0].uri,
        cancelled: result.canceled
      };

    } catch (error) {
      console.error('Error picking image:', error);
      throw new Error('Failed to pick image');
    }
  };

  /**
   * Check if all required permissions are granted
   */
  const hasAllPermissions = (): boolean => {
    return permissions.camera && permissions.mediaLibrary;
  };

  /**
   * Get permission status text for UI
   */
  const getPermissionStatus = (): {
    camera: 'granted' | 'denied' | 'undetermined';
    mediaLibrary: 'granted' | 'denied' | 'undetermined';
  } => {
    return {
      camera: permissions.camera ? 'granted' : 'denied',
      mediaLibrary: permissions.mediaLibrary ? 'granted' : 'denied',
    };
  };

  return {
    permissions,
    isLoading,
    requestPermissions,
    takePhoto,
    pickImage,
    hasAllPermissions,
    getPermissionStatus,
  };
};