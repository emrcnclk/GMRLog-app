import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import type { SemanticColorToken } from '../theme/tokens';

import { Text } from './text';

export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface ToastMessage {
  id: string;
  message: string;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastViewProps {
  message: string;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle | ViewStyle[];
}

function toneText(tone: ToastTone): SemanticColorToken {
  switch (tone) {
    case 'danger':
      return 'color.status.error';
    case 'success':
      return 'color.status.success';
    case 'warning':
      return 'color.status.warning';
    case 'info':
      return 'color.status.info';
    case 'neutral':
      return 'color.text.primary';
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

/**
 * Presentational toast surface — ephemeral, dismissible (S4 Toast).
 */
export function ToastView({
  message,
  tone = 'neutral',
  actionLabel,
  onAction,
  onDismiss,
  style,
}: ToastViewProps) {
  const theme = useTheme();
  const shadow = theme.elevation('shadow.md');

  return (
    <View
      accessibilityRole="alert"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space('space.3'),
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.3'),
          borderRadius: theme.radius('radius.md'),
          backgroundColor: theme.color('color.surface.dialog'),
          borderWidth: 1,
          borderColor: theme.color('color.border.default'),
          ...shadow,
        },
        style,
      ]}
    >
      <Text role="body" color={toneText(tone)} style={{ flex: 1 }}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <Text role="label" color="color.interactive.primary">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
      {onDismiss ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={onDismiss}>
          <Text role="label" color="color.text.secondary">
            Close
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface ToastContextValue {
  show: (input: Omit<ToastMessage, 'id'> & { id?: string }) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastHostProps {
  children: ReactNode;
}

/**
 * Toast host — context `show` / `dismiss` API for ephemeral feedback.
 */
export function ToastHost({ children }: ToastHostProps) {
  const theme = useTheme();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((input: Omit<ToastMessage, 'id'> & { id?: string }) => {
    const id = input.id ?? `toast-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { ...input, id }]);
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return createElement(
    ToastContext.Provider,
    { value },
    children,
    createElement(
      View,
      {
        pointerEvents: 'box-none',
        style: {
          position: 'absolute',
          left: theme.space('space.4'),
          right: theme.space('space.4'),
          bottom: theme.space('space.6'),
          gap: theme.space('space.2'),
        },
      },
      ...toasts.map((toast) =>
        createElement(ToastView, {
          key: toast.id,
          message: toast.message,
          tone: toast.tone,
          actionLabel: toast.actionLabel,
          onAction: toast.onAction,
          onDismiss: () => {
            dismiss(toast.id);
          },
        }),
      ),
    ),
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastHost (@gmrlog/ui)');
  }
  return context;
}
