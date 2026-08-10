import type { ReportReasonValue, UserPublicResponse } from '@gmrlog/types';
import { BottomSheet, type BottomSheetAnchor, MIN_TOUCH_TARGET, Text, useTheme } from '@gmrlog/ui';
import { Flag, User, UserX, VolumeX } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { REPORT_REASON_LABELS } from '../hooks/social-model';

export interface SocialActionMenuProps {
  user: UserPublicResponse | null;
  anchor: BottomSheetAnchor | null;
  onClose: () => void;
  onViewProfile: (userId: string) => void;
  onMute: (userId: string) => void;
  onBlock: (userId: string) => void;
  onReport: (userId: string, reason: ReportReasonValue) => void;
  mutePending: boolean;
  blockPending: boolean;
  reportPending: boolean;
}

/**
 * §15's row overflow — "View profile, Mute, Block, Report. A sheet on native,
 * a popover on web." `BottomSheet` carries the platform branch; this owns only
 * the menu content, including Report's reason list, which has no existing
 * screen anywhere in the app to match — this is the first report UI built.
 */
export function SocialActionMenu({
  user,
  anchor,
  onClose,
  onViewProfile,
  onMute,
  onBlock,
  onReport,
  mutePending,
  blockPending,
  reportPending,
}: SocialActionMenuProps) {
  const theme = useTheme();
  const [reportMode, setReportMode] = useState(false);

  useEffect(() => {
    if (user === null) {
      setReportMode(false);
    }
  }, [user]);

  const close = () => {
    setReportMode(false);
    onClose();
  };

  return (
    <BottomSheet
      visible={user !== null}
      onClose={close}
      anchor={anchor}
      title={reportMode ? 'Report' : undefined}
    >
      {reportMode ? (
        <View style={{ gap: theme.space('space.1') }}>
          {(Object.entries(REPORT_REASON_LABELS) as [ReportReasonValue, string][]).map(
            ([reason, label]) => (
              <Pressable
                key={reason}
                accessibilityRole="button"
                accessibilityLabel={label}
                disabled={reportPending}
                onPress={() => {
                  if (user) {
                    onReport(user.id, reason);
                  }
                }}
                style={{
                  minHeight: MIN_TOUCH_TARGET,
                  justifyContent: 'center',
                  paddingHorizontal: theme.space('space.3'),
                  borderRadius: theme.radius('radius.md'),
                }}
              >
                <Text role="body" color="color.text.primary">
                  {label}
                </Text>
              </Pressable>
            ),
          )}
        </View>
      ) : (
        <View style={{ gap: theme.space('space.1') }}>
          <MenuItem
            icon={<User size={18} color={theme.color('color.text.secondary')} strokeWidth={1.75} />}
            label="View profile"
            onPress={() => {
              if (user) {
                onViewProfile(user.id);
              }
              close();
            }}
          />
          <MenuItem
            icon={
              <VolumeX size={18} color={theme.color('color.text.secondary')} strokeWidth={1.75} />
            }
            label="Mute"
            loading={mutePending}
            onPress={() => {
              if (user) {
                onMute(user.id);
              }
              close();
            }}
          />
          <MenuItem
            icon={
              <UserX size={18} color={theme.color('color.text.secondary')} strokeWidth={1.75} />
            }
            label="Block"
            loading={blockPending}
            onPress={() => {
              if (user) {
                onBlock(user.id);
              }
              close();
            }}
          />
          <MenuItem
            icon={<Flag size={18} color={theme.color('color.text.secondary')} strokeWidth={1.75} />}
            label="Report"
            onPress={() => {
              setReportMode(true);
            }}
          />
        </View>
      )}
    </BottomSheet>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={loading}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.3'),
        minHeight: MIN_TOUCH_TARGET,
        paddingHorizontal: theme.space('space.3'),
        borderRadius: theme.radius('radius.md'),
      }}
    >
      {loading ? <ActivityIndicator color={theme.color('color.text.secondary')} /> : icon}
      <Text role="body" color="color.text.primary">
        {label}
      </Text>
    </Pressable>
  );
}
