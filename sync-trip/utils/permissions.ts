// permissions.ts
import { Platform } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  PermissionStatus,
  Permission,
} from 'react-native-permissions';

const ANDROID_STORAGE: Permission =
  Platform.Version as number >= 33
    ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
    : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

export async function ensureGalleryPermission(): Promise<boolean> {
  let status: PermissionStatus = await check(ANDROID_STORAGE);

  if (status === RESULTS.UNAVAILABLE) {
    console.warn('This feature is not available on this device.');
    return false;
  }

  if (status === RESULTS.DENIED) {
    status = await request(ANDROID_STORAGE, {
      title: 'Access your photos',
      message: 'We need permission to your gallery so you can set a profile picture.',
      buttonPositive: 'OK',
      buttonNegative: 'Cancel',
    });
  }

  if (status === RESULTS.BLOCKED) {
    // you could link to settings here
    console.warn('Permission is blocked—open settings to grant it.');
    return false;
  }

  return status === RESULTS.GRANTED;
}
