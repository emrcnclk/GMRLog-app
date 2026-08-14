export type {
  AccentKey,
  ElevationStyle,
  RarityTier,
  ResolvedColorScheme,
  SemanticColorPalette,
  SemanticColorToken,
  SemanticElevationScale,
  SemanticElevationToken,
  SemanticRadiusScale,
  SemanticRadiusToken,
  SemanticSpaceScale,
  SemanticSpaceToken,
  SemanticTypeRole,
  SemanticTypographyScale,
  ThemePreference,
  ThemeTokens,
  TypographyStyle,
} from './theme/tokens';
export { TABLET_BREAKPOINT } from './theme/tokens';
export { useIsTabletUp } from './theme/use-breakpoint';
export {
  ACCENT_KEYS,
  ACCENT_LABELS,
  RARITY_LABELS,
  RARITY_PLATE_MIN,
  RARITY_TIERS,
  createThemeTokens,
  elevationScale,
  hexToRgbTriple,
  radiusScale,
  rarityGeometry,
  scrimRgbTriple,
  spaceScale,
  typographyScale,
  type RarityGeometry,
} from './theme/palettes';
export {
  ThemeProvider,
  useTheme,
  type ThemeContextValue,
  type ThemeProviderProps,
} from './theme/theme-provider';

export { Text, type TextProps } from './components/text';
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './components/button';
export { IconButton, type IconButtonProps } from './components/icon-button';
export { TextField, type TextFieldProps } from './components/text-field';
export { SearchField, type SearchFieldProps } from './components/search-field';
export { Avatar, type AvatarProps, type AvatarSize } from './components/avatar';
export { LogoMark, type LogoMarkProps } from './components/logo-mark';
export { Badge, type BadgeProps, type BadgeTone } from './components/badge';
export { Chip, type ChipProps } from './components/chip';
export { Divider, type DividerOrientation, type DividerProps } from './components/divider';
export { Card, type CardProps } from './components/card';
export { Toggle, type ToggleProps } from './components/toggle';
export { Surface, type SurfaceProps } from './components/surface';
export { Loading, type LoadingProps, type LoadingSize } from './components/loading';
export { EmptyState, type EmptyStateProps } from './components/empty-state';
export { ErrorState, type ErrorStateProps } from './components/error-state';
export { ErrorBanner, type ErrorBannerProps } from './components/error-banner';
export {
  Skeleton,
  SkeletonBlock,
  type SkeletonProps,
  type SkeletonShape,
} from './components/skeleton';

export { Screen, type ScreenEdge, type ScreenProps } from './components/screen';
export { Container, type ContainerProps } from './components/container';
export { Section, type SectionProps } from './components/section';
export { SectionKicker, type SectionKickerProps } from './components/section-kicker';
export { ScreenTitle, SCREEN_GUTTER, type ScreenTitleProps } from './components/screen-title';
export { ListItem, type ListItemProps } from './components/list-item';
export { Icon, type IconProps } from './components/icon';
export {
  BottomSheet,
  type BottomSheetAnchor,
  type BottomSheetProps,
} from './components/bottom-sheet';
export { Dialog, type DialogProps } from './components/dialog';
export {
  ToastHost,
  ToastView,
  useToast,
  type ToastContextValue,
  type ToastHostProps,
  type ToastMessage,
  type ToastTone,
  type ToastViewProps,
} from './components/toast';
export { NavHeader, type NavHeaderProps } from './components/nav-header';
export { EntityList, type EntityListProps } from './components/entity-list';
export { HeroBackButton, type HeroBackButtonProps } from './components/hero-back-button';

/** D3.28 — decoration must never reach the screen reader (PRODUCT_POLISH_AUDIT F7). */
export { HIDDEN_FROM_ASSISTIVE_TECH, type HiddenFromAssistiveTechProps } from './a11y/decorative';

/** D3.27 — Game Hub / Profile premium primitives (docs/04_UI/D3_27_UI_PRIMITIVES.md). */
export { ASPECT, AspectBox, type AspectBoxProps, type AspectName } from './components/aspect-box';
export {
  GradientScrim,
  type GradientScrimProps,
  type ScrimDirection,
} from './components/gradient-scrim';
export { HatchOverlay, type HatchOverlayProps } from './components/hatch-overlay';
export { ProgressBar, type ProgressBarProps } from './components/progress-bar';
export { StatTile, type StatTileProps } from './components/stat-tile';
export { MetricStrip, type MetricStripProps } from './components/metric-strip';
export { CornerNotch, type CornerNotchProps } from './components/corner-notch';
export { RarityBadge, rarityColorToken, type RarityBadgeProps } from './components/rarity-badge';
export {
  SegmentedTabs,
  type SegmentedTabItem,
  type SegmentedTabsProps,
} from './components/segmented-tabs';
export {
  ActivityHeatmap,
  type ActivityHeatmapProps,
  type HeatmapDay,
} from './components/activity-heatmap';
export { Rail, type RailProps } from './components/rail';
export { FadeInView, type FadeInViewProps } from './components/fade-in-view';
export {
  DistributionBars,
  type DistributionBarsProps,
  type DistributionRow,
} from './components/distribution-bars';
export { TabBarPlaceholder, type TabBarPlaceholderProps } from './components/tab-bar-placeholder';

export { FormField, type FormFieldProps } from './forms/form-field';

export {
  MOTION_DURATION,
  MOTION_EASING,
  resolveDuration,
  fadeIn,
  fadeOut,
  fadeCross,
  FADE_IMAGE_TRANSITION_MS,
  scalePressIn,
  scalePressOut,
  scalePopIn,
  slideInFromBottom,
  slideOutToBottom,
  slideInFromEnd,
  sharedTransitionPreset,
  modalPresentationAnimation,
  PRESS_OPACITY,
  MIN_TOUCH_TARGET,
  pressableMotionStyle,
  pressableStyleArray,
  releasePressScale,
  PULSE_TROUGH_OPACITY,
  PULSE_HALF_PERIOD_MS,
  pulseOpacity,
  usePulseOpacity,
  modalMotion,
  dialogExitMs,
  modalStackDuration,
  bottomSheetMotion,
  sheetSnapDuration,
  MotionProvider,
  useMotion,
  useReduceMotion,
  type MotionDurationToken,
  type MotionEasingToken,
  type MotionTiming,
  type FadePreset,
  type ScalePreset,
  type SlideAxis,
  type SlidePreset,
  type SharedTransitionPreset,
  type StackAnimationName,
  type PressableMotionStyle,
  type ModalMotionPreset,
  type ModalAnimationType,
  type BottomSheetMotionPreset,
  type SheetAnimationType,
  type MotionContextValue,
  type MotionProviderProps,
} from './motion';

export { uiPackageName } from './package-name';
