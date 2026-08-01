import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { loadFrontendEnv } from '../../../lib/env';
import { useConnectivityStore } from '../../../src/state/stores';
import { buildDiagnostics, type DiagnosticsSnapshot } from '../model/diagnostics-model';
import { buildStorageInfo, type StorageInfoSnapshot } from '../model/storage-model';

interface ExpoExtra {
  appEnv?: string;
  apiUrl?: string;
}

function readAppMeta(): { version: string; build: string; environment: string; apiUrl: string } {
  const env = loadFrontendEnv();
  const extra = (Constants.expoConfig?.extra ?? undefined) as ExpoExtra | undefined;
  const nativeBuild =
    typeof Constants.nativeBuildVersion === 'string' ? Constants.nativeBuildVersion : null;
  const iosBuild = Constants.expoConfig?.ios?.buildNumber;
  const androidCode = Constants.expoConfig?.android?.versionCode;
  const build =
    nativeBuild ??
    (typeof iosBuild === 'string' ? iosBuild : null) ??
    (typeof androidCode === 'number' ? String(androidCode) : '0');

  return {
    version: Constants.expoConfig?.version ?? '0.0.0',
    build,
    environment: extra?.appEnv ?? env.APP_ENV,
    apiUrl: extra?.apiUrl ?? env.EXPO_PUBLIC_API_URL,
  };
}

export function useDiagnostics(): DiagnosticsSnapshot {
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [networkType, setNetworkType] = useState<string | null>(null);
  const meta = useMemo(() => readAppMeta(), []);

  useEffect(() => {
    let mounted = true;
    void NetInfo.fetch().then((state) => {
      if (mounted) {
        setNetworkType(state.type);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return buildDiagnostics({
    appVersion: meta.version,
    buildNumber: meta.build,
    environment: meta.environment,
    apiUrl: meta.apiUrl,
    platform: `${Platform.OS} ${String(Platform.Version)}`,
    isOnline,
    networkType,
  });
}

export function useStorageActions() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const info: StorageInfoSnapshot = useMemo(() => {
    const entryCount = queryClient.getQueryCache().getAll().length;
    return buildStorageInfo(entryCount);
  }, [queryClient, busy, message]);

  const clearImage = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      await Image.clearDiskCache();
      await Image.clearMemoryCache();
      setMessage('Image cache cleared.');
    } catch {
      setMessage('Could not clear image cache.');
    } finally {
      setBusy(false);
    }
  }, []);

  const clearQuery = useCallback(() => {
    setBusy(true);
    setMessage(null);
    try {
      queryClient.clear();
      setMessage('React Query cache cleared.');
    } finally {
      setBusy(false);
    }
    return Promise.resolve();
  }, [queryClient]);

  const clearApp = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      await Image.clearDiskCache();
      await Image.clearMemoryCache();
      queryClient.clear();
      setMessage('App cache cleared. SecureStore session tokens were kept.');
    } catch {
      setMessage('Could not clear app cache.');
    } finally {
      setBusy(false);
    }
  }, [queryClient]);

  return { info, busy, message, clearImage, clearQuery, clearApp };
}
