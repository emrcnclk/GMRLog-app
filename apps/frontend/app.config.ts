import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Expo app configuration (D3.15 release engineering audit).
 * Product identity chrome (final brand art) may still be refined under Design System assets.
 * Icons/splash use Expo defaults until brand assets are committed under ./assets.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GMRLOG',
  slug: 'gmrlog',
  scheme: 'gmrlog',
  version: '1.0.0-rc.1',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.gmrlog.app',
    associatedDomains: ['applinks:gmrlog.com', 'applinks:www.gmrlog.com'],
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        'GMRLOG needs photo library access so you can choose a profile or community image.',
      NSCameraUsageDescription:
        'GMRLOG needs camera access so you can take a profile or community photo.',
      UIBackgroundModes: [],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#09090B',
    },
    package: 'com.gmrlog.app',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.READ_MEDIA_IMAGES',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'gmrlog.com',
            pathPrefix: '/',
          },
          {
            scheme: 'https',
            host: 'www.gmrlog.com',
            pathPrefix: '/',
          },
          {
            scheme: 'gmrlog',
            host: '*',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#09090B',
        imageWidth: 200,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'GMRLOG needs photo library access so you can choose a profile or community image.',
        cameraPermission:
          'GMRLOG needs camera access so you can take a profile or community photo.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: process.env.APP_ENV ?? process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
    socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:4000',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '00000000-0000-0000-0000-000000000000',
    },
    releaseFlags: {
      queryPersistence: true,
      offlineMutationQueue: true,
      monitoringProvidersEnabled: false,
    },
  },
});
