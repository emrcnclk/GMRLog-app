import { Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { CachedImage } from '../../../src/assets/cached-image';
import { initialsFromName } from '../hooks/community-model';

/**
 * §13's emblem numbers. Compositional constants rather than spacing values —
 * the same class as `RARITY_PLATE_MIN` (1.4) and `AUTH_MEASURE` (3.10): 44 is
 * not on the space scale (`space.10` is 40, `space.12` is 48), and the overlap
 * is defined as half the emblem, so the two must move together.
 */
export const COMMUNITY_EMBLEM_SIZE = 44;
export const COMMUNITY_EMBLEM_OVERLAP = COMMUNITY_EMBLEM_SIZE / 2;
/** §13's "3px background-coloured ring" — a mat, drawn as padding, not a border. */
export const COMMUNITY_EMBLEM_RING = 3;

export interface CommunityEmblemProps {
  name: string;
  avatarUrl: string | null;
}

/**
 * `SCREEN_REDESIGNS_2.md` §13 — "a 44px squircle emblem at `radius.md` with a
 * 3px background-coloured ring".
 *
 * **Not `Avatar`.** That primitive is circular by contract (`radius.full`,
 * hard-coded) and sizes itself only from the space scale, so it can express
 * neither of §13's two defining properties. Overriding both through its `style`
 * prop would leave its inner `Image` sized from the space token and cropped by a
 * box that disagrees with it. This is a feature composition of `CachedImage`
 * plus the same initials fallback, not a new design-system primitive — a circle
 * is still the right default everywhere `Avatar` is used.
 *
 * The ring is the card's own background drawn as padding, which is what "a
 * background-coloured ring" means: the emblem punches a hole in the banner
 * rather than sitting on a drawn outline. Depth from surface, not from a line.
 */
export function CommunityEmblem({ name, avatarUrl }: CommunityEmblemProps) {
  const theme = useTheme();
  const inner = COMMUNITY_EMBLEM_SIZE;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${name} emblem`}
      style={{
        padding: COMMUNITY_EMBLEM_RING,
        borderRadius: theme.radius('radius.md') + COMMUNITY_EMBLEM_RING,
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: theme.radius('radius.md'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {avatarUrl === null ? (
          <Text role="headline" color="color.text.secondary">
            {initialsFromName(name)}
          </Text>
        ) : (
          <CachedImage
            source={{ uri: avatarUrl }}
            style={{ width: inner, height: inner }}
            contentFit="cover"
            priority="high"
            accessibilityIgnoresInvertColors
          />
        )}
      </View>
    </View>
  );
}
