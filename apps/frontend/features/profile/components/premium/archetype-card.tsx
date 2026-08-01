import type { PlayerArchetypeResponse } from '@gmrlog/types';
import { Card, RarityBadge, Rail, Text, rarityColorToken, useTheme } from '@gmrlog/ui';
import {
  BookOpen,
  CircleCheckBig,
  Compass,
  Flame,
  Gem,
  Layers,
  Library,
  PenLine,
  Swords,
  Timer,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { View } from 'react-native';

import { resolveArchetypePair, type ResolvedArchetype } from '../../hooks/archetype-catalog';

const ICONS: Record<string, LucideIcon> = {
  library: Library,
  'circle-check-big': CircleCheckBig,
  flame: Flame,
  compass: Compass,
  'pen-line': PenLine,
  timer: Timer,
  layers: Layers,
  swords: Swords,
  'book-open': BookOpen,
  gem: Gem,
  trophy: Trophy,
  users: Users,
};

export interface ArchetypeSectionProps {
  archetypes: readonly PlayerArchetypeResponse[];
  isPending: boolean;
}

/**
 * D3.27 Phase 3 — Player archetypes.
 *
 * Primary and secondary are the two highest-scoring badges the server awarded;
 * remaining badges follow in a rail. Nothing is computed client-side beyond
 * ordering and the rarity band.
 */
function ArchetypeSectionComponent({ archetypes, isPending }: ArchetypeSectionProps) {
  const theme = useTheme();
  const pair = useMemo(() => resolveArchetypePair(archetypes), [archetypes]);

  if (isPending && archetypes.length === 0) {
    return null;
  }

  if (pair.primary === null) {
    return null;
  }

  return (
    <View style={{ gap: theme.space('space.3') }}>
      <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.1') }}>
        <Text role="title">Player archetype</Text>
        <Text role="meta" color="color.text.tertiary">
          Derived from your library, reviews and social activity.
        </Text>
      </View>

      <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.3') }}>
        <ArchetypeCard archetype={pair.primary} slot="Primary" expanded />
        {pair.secondary !== null ? (
          <ArchetypeCard archetype={pair.secondary} slot="Secondary" expanded={false} />
        ) : null}
      </View>

      {pair.others.length > 0 ? (
        <Rail title="Also earned" gap={theme.space('space.2')}>
          {pair.others.map((archetype) => (
            <CompactArchetype key={archetype.profile.key} archetype={archetype} />
          ))}
        </Rail>
      ) : null}
    </View>
  );
}

interface ArchetypeCardProps {
  archetype: ResolvedArchetype;
  slot: string;
  /** Primary shows strengths and weaknesses; secondary stays compact. */
  expanded: boolean;
}

export function ArchetypeCard({ archetype, slot, expanded }: ArchetypeCardProps) {
  const theme = useTheme();
  const { profile, rarity } = archetype;
  const Icon = ICONS[profile.icon] ?? Trophy;
  const accent = theme.color(rarityColorToken(rarity));

  return (
    <Card
      accessibilityRole="summary"
      accessibilityLabel={`${slot} archetype: ${profile.title}, ${rarity}. ${profile.explanation}`}
      style={{ gap: theme.space('space.3'), borderColor: accent }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.3') }}>
        <View
          style={{
            width: theme.space('space.12'),
            height: theme.space('space.12'),
            borderRadius: theme.radius('radius.full'),
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.color('color.surface.secondary'),
            borderWidth: 1,
            borderColor: accent,
          }}
        >
          <Icon size={22} color={accent} />
        </View>

        <View style={{ flex: 1, gap: theme.space('space.1') }}>
          <Text role="meta" color="color.text.tertiary">
            {slot}
          </Text>
          <Text role="title">{profile.title}</Text>
        </View>

        <RarityBadge tier={rarity} />
      </View>

      <Text role="body" color="color.text.secondary">
        {profile.explanation}
      </Text>

      {expanded ? (
        <View style={{ gap: theme.space('space.3') }}>
          <TraitList
            label="Strengths"
            traits={profile.strengths}
            color={theme.color('color.status.success')}
          />
          <TraitList
            label="Watch out for"
            traits={profile.weaknesses}
            color={theme.color('color.status.warning')}
          />
        </View>
      ) : null}
    </Card>
  );
}

function TraitList({
  label,
  traits,
  color,
}: {
  label: string;
  traits: readonly string[];
  color: string;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space('space.1') }}>
      <Text role="label" color="color.text.secondary">
        {label}
      </Text>
      {traits.map((trait) => (
        <View
          key={trait}
          style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.2') }}
        >
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: theme.radius('radius.full'),
              backgroundColor: color,
            }}
          />
          <Text role="body" color="color.text.secondary" style={{ flex: 1 }}>
            {trait}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CompactArchetype({ archetype }: { archetype: ResolvedArchetype }) {
  const theme = useTheme();
  const Icon = ICONS[archetype.profile.icon] ?? Trophy;
  const accent = theme.color(rarityColorToken(archetype.rarity));

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${archetype.profile.title}, ${archetype.rarity}`}
      style={{
        width: 132,
        gap: theme.space('space.2'),
        padding: theme.space('space.3'),
        borderRadius: theme.radius('radius.lg'),
        backgroundColor: theme.color('color.surface.secondary'),
        borderWidth: 1,
        borderColor: theme.color('color.border.default'),
      }}
    >
      <Icon size={18} color={accent} />
      <Text role="label" numberOfLines={2}>
        {archetype.profile.title}
      </Text>
      <RarityBadge tier={archetype.rarity} />
    </View>
  );
}

export const ArchetypeSection = memo(ArchetypeSectionComponent);
