/**
 * AppIcon - shared icon component using Solar Icons.
 */

import type { ComponentProps, ComponentType } from 'react';
import {
  AddCircle,
  AltArrowLeft,
  AltArrowRight,
  Archive,
  ArchiveUp,
  ArrowLeft,
  Bell,
  Bolt,
  BoltCircle,
  Box,
  Calendar,
  CalendarDate,
  Card,
  CheckCircle,
  CheckRead,
  ClipboardList,
  ClockCircle,
  CloseCircle,
  DangerCircle,
  DangerTriangle,
  Delivery,
  Dollar,
  DollarMinimalistic,
  Download,
  Eye,
  EyeClosed,
  FileText,
  FlipHorizontal,
  Gallery,
  GraphUp,
  History,
  Home,
  InfoCircle,
  Letter,
  Link,
  Logout,
  Magnifier,
  MapPoint,
  MenuDots,
  PenNewRound,
  Phone,
  Printer,
  QrCode,
  RecordCircle,
  Refresh,
  Restart,
  Scanner,
  Settings,
  Share,
  Shield,
  ShieldCheck,
  SmartphoneVibration,
  Snowflake,
  SquareArrowRightUp,
  Stars,
  Target,
  TrashBinTrash,
  Upload,
  User,
  UserCircle,
  UserPlus,
  UserRounded,
  UsersGroupRounded,
  VerifiedCheck,
  VideoFrame,
  Wallet,
} from '@solar-icons/react-native/Linear';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { usePreferences } from '@/src/hooks/usePreferences';

const DEFAULT_ICON_SIZE = 22;
type SolarIconProps = ComponentProps<typeof Archive>;
type SolarIcon = ComponentType<SolarIconProps>;

/** Plain plus for filled circular buttons (avoids circle-on-circle from AddCircle). */
function PlusSimple({ size = DEFAULT_ICON_SIZE, color = 'currentColor' }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 7v10M7 12h10" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

const icons = {
  Archive,
  ArchiveRestore: ArchiveUp,
  ArrowLeft,
  BadgeDollarSign: DollarMinimalistic,
  BadgeCheck: VerifiedCheck,
  Bell,
  Calendar,
  CalendarDays: CalendarDate,
  CheckCheck: CheckRead,
  ChevronLeft: AltArrowLeft,
  ChevronRight: AltArrowRight,
  ClipboardList,
  Clock: ClockCircle,
  CreditCard: Card,
  Circle: RecordCircle,
  CircleAlert: DangerCircle,
  CircleCheck: CheckCircle,
  CircleDollarSign: Dollar,
  CircleUserRound: UserCircle,
  ExternalLink: SquareArrowRightUp,
  Download,
  Eye,
  EyeOff: EyeClosed,
  FileText,
  FileVideo: VideoFrame,
  FlipHorizontal,
  Home,
  History,
  Image: Gallery,
  Info: InfoCircle,
  Link,
  LogOut: Logout,
  MapPin: MapPoint,
  Mail: Letter,
  MoreHorizontal: MenuDots,
  Nfc: SmartphoneVibration,
  Package: Box,
  PenLine: PenNewRound,
  Phone,
  Printer,
  Plus: AddCircle,
  PlusSimple,
  QrCode,
  RefreshCw: Refresh,
  RotateCcw: Restart,
  ScanLine: Scanner,
  Search: Magnifier,
  Settings,
  Share,
  Shield,
  ShieldCheck,
  Snowflake,
  Sparkles: Stars,
  Target,
  Trash2: TrashBinTrash,
  TriangleAlert: DangerTriangle,
  TrendingUp: GraphUp,
  Truck: Delivery,
  Upload,
  User,
  UserPlus,
  UserRound: UserRounded,
  Users: UsersGroupRounded,
  Wallet,
  X: CloseCircle,
  Zap: Bolt,
  ZapOff: BoltCircle,
} satisfies Record<string, SolarIcon>;

export type AppIconName = keyof typeof icons;

interface AppIconProps extends Omit<SolarIconProps, 'size' | 'color'> {
  name: AppIconName;
  size?: number;
  color?: string;
}

export function AppIcon({
  name,
  size = DEFAULT_ICON_SIZE,
  color,
  ...rest
}: AppIconProps) {
  const { colors } = usePreferences();
  const Icon = icons[name] as SolarIcon | undefined;
  const resolvedColor = color ?? colors.textPrimary;

  if (!Icon) {
    return <View style={{ width: size, height: size }} />;
  }

  return <Icon size={size} color={resolvedColor} {...rest} />;
}
