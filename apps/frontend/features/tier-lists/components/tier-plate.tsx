import { Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { rankOpacity } from '../hooks/tier-list-model';

/** §20: "a 44px-wide label plate on the left at radius.sm". Not on the space scale (Avatar's `sizeOverride` precedent). */
const PLATE_WIDTH = 44;

export interface TierPlateProps {
  /** A ranked-row letter (S/A/B/C/D) — the tray has no plate, it has a kicker. */
  label: string;
  /** Position among the ranked rows, 0 = S (brightest). */
  rankIndex: number;
  rankCount: number;
}

/**
 * §20's tier-row plate. "No coloured tier bands" rules out a rank colour
 * ramp, so rank is carried the way §23's retention grid carries it — opacity
 * on the existing border/text tokens, brightest at S, dimmest at D.
 */
export function TierPlate({ label, rankIndex, rankCount }: TierPlateProps) {
  const theme = useTheme();
  const opacity = rankOpacity(rankIndex, rankCount);

  return (
    <View
      style={{
        width: PLATE_WIDTH,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius('radius.sm'),
        backgroundColor: theme.color('color.surface.secondary'),
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          borderRadius: theme.radius('radius.sm'),
          borderWidth: 1,
          borderColor: theme.color('color.border.default'),
          opacity,
        }}
      />
      <Text role="headline" color="color.text.primary" style={{ opacity }}>
        {label}
      </Text>
    </View>
  );
}
