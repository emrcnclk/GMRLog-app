import { Button, Text, useTheme } from '@gmrlog/ui';
import { memo, useEffect, useState } from 'react';
import { View } from 'react-native';

export interface ReviewBodyProps {
  body: string | null;
  /** Start concealed behind a spoiler gate. */
  isSpoilerHidden: boolean;
}

/**
 * The review itself.
 *
 * Long-form reading, so the type is `body` at the design system's full line
 * height with generous paragraph spacing — a wall of tight text is the fastest
 * way to make writing look unworth reading.
 *
 * The spoiler gate conceals rather than truncates: the text is not rendered at
 * all until asked for, so it cannot be revealed by selection, screen reader
 * traversal, or a screenshot of a partially-clipped view.
 */
function ReviewBodyComponent({ body, isSpoilerHidden }: ReviewBodyProps) {
  const theme = useTheme();
  const [revealed, setRevealed] = useState(!isSpoilerHidden);

  // A different review can load into this screen; re-arm the gate when it does.
  useEffect(() => {
    setRevealed(!isSpoilerHidden);
  }, [isSpoilerHidden]);

  if (body === null || body.trim().length === 0) {
    return (
      <View style={{ paddingHorizontal: theme.space('space.4') }}>
        <Text role="body" color="color.text.tertiary">
          This review is a rating only — no written notes.
        </Text>
      </View>
    );
  }

  if (!revealed) {
    return (
      <View
        style={{
          marginHorizontal: theme.space('space.4'),
          padding: theme.space('space.5'),
          gap: theme.space('space.3'),
          alignItems: 'flex-start',
          borderRadius: theme.radius('radius.lg'),
          borderWidth: 1,
          borderColor: theme.color('color.border.default'),
          backgroundColor: theme.color('color.surface.secondary'),
        }}
      >
        <Text role="label" color="color.text.primary">
          Hidden — contains spoilers
        </Text>
        <Text role="body" color="color.text.secondary">
          The author marked this review as containing spoilers.
        </Text>
        <Button
          variant="secondary"
          accessibilityLabel="Reveal review text containing spoilers"
          onPress={() => {
            setRevealed(true);
          }}
        >
          Show anyway
        </Button>
      </View>
    );
  }

  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.4') }}>
      {paragraphs.map((paragraph, index) => (
        <Text
          key={`paragraph-${String(index)}`}
          role="body"
          color="color.text.primary"
          // Prose wants more air between lines than a UI label does.
          style={{ lineHeight: theme.typography('body').lineHeight + 4 }}
        >
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

export const ReviewBody = memo(ReviewBodyComponent);
