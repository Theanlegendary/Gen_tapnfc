import {
  BioTheme,
  CardDesign,
  OrderCardStatus,
  OrderStatus,
  PaymentStatus,
  ProfileTheme,
  TypographyColorKey,
  UserRole,
} from '@/src/types/models';
import { theme } from '@/src/constants/theme';
import { typographyColorMap } from '@/src/constants/themeResolver';

export const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'Sales', value: 'sales' },
  { label: 'Agent', value: 'agent' },
  { label: 'Printer Operator', value: 'printer_operator' },
  { label: 'Printer', value: 'printer' },
  { label: 'QA Inspector', value: 'qa_inspector' },
  { label: 'Shipping', value: 'shipping' },
  { label: 'Customer', value: 'customer' },
];

export const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Khmer', value: 'km' },
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Thai', value: 'th' },
] as const;

export const productTypeOptions = [
  { label: 'Wood Card', value: 'wood_card', price: 49, emoji: 'WOOD' },
  { label: 'Metal Card', value: 'metal_card', price: 89, emoji: 'METAL' },
  { label: 'PVC Card', value: 'pvc_card', price: 29, emoji: 'PVC' },
] as const;

export type ProductType = typeof productTypeOptions[number]['value'];

export const paymentMethodOptions = [
  { label: 'Online', value: 'online', color: theme.status.success },
  { label: 'Later/Manual', value: 'later_manual', color: theme.status.warning },
  { label: 'Deposit', value: 'deposit', color: theme.status.info },
  { label: 'Paid', value: 'paid', color: theme.status.success },
] as const;

export const priorityOptions = [
  { label: 'Standard', value: 'standard', color: theme.status.pending },
  { label: 'Urgent', value: 'urgent', color: theme.status.error },
] as const;

export type Priority = typeof priorityOptions[number]['value'];

export const cardDesignOptions: { label: string; value: CardDesign }[] = [
  { label: 'Classic Black', value: 'classic_black' },
  { label: 'Matte Silver', value: 'matte_silver' },
  { label: 'Gold Premium', value: 'gold_premium' },
  { label: 'Rose Gold', value: 'rose_gold' },
  { label: 'Custom Design', value: 'custom' },
];

export const paymentStatusOptions: { label: string; value: PaymentStatus }[] = [
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Partial', value: 'partial' },
  { label: 'Paid', value: 'paid' },
];

export const orderCardStatusOptions: { label: string; value: OrderCardStatus; color: string }[] = [
  { label: 'Active', value: 'active', color: theme.status.success },
  { label: 'Frozen', value: 'frozen', color: theme.status.info },
  { label: 'Closed', value: 'closed', color: theme.status.pending },
];

export const orderStatusOptions: { label: string; value: OrderStatus; color: string }[] = [
  { label: 'New', value: 'new', color: theme.status.pending },
  { label: 'Design', value: 'design', color: theme.status.warning },
  { label: 'Ready to Print', value: 'ready_to_print', color: theme.status.warning },
  { label: 'Printing', value: 'printing', color: theme.roles.printer.primary },
  { label: 'NFC Writing', value: 'nfc_writing', color: theme.roles.printer.primaryDark },
  { label: 'NFC Verification', value: 'nfc_verification', color: theme.status.info },
  { label: 'QA Pending', value: 'qa_pending', color: theme.status.info },
  { label: 'QA Failed', value: 'qa_failed', color: theme.status.error },
  { label: 'Ready', value: 'ready', color: theme.status.success },
  { label: 'Ready to Ship', value: 'ready_to_ship', color: theme.status.success },
  { label: 'Shipped', value: 'shipped', color: theme.status.active },
  { label: 'Delivered', value: 'delivered', color: theme.colors.textPrimary },
];

export const batchMaterialOptions = [
  { label: 'Wood', value: 'wood' },
  { label: 'Metal', value: 'metal' },
  { label: 'PVC', value: 'pvc' },
] as const;

export const batchPrinterTypeOptions = [
  { label: 'UV Flatbed', value: 'uv_flatbed' },
  { label: 'Thermal', value: 'thermal' },
  { label: 'Laser', value: 'laser' },
] as const;

export const paymentStatusColors: Record<PaymentStatus, string> = {
  unpaid: theme.status.error,
  partial: theme.status.warning,
  paid: theme.status.success,
};

export const bioThemeOptions: { label: string; value: BioTheme; bg: string; accent: string; text: string }[] = [
  { label: 'WhatsApp Light', value: 'vibrant_pink', bg: theme.colors.background, accent: theme.colors.primary, text: theme.colors.textPrimary },
  { label: 'Clean Dark', value: 'tech_noir', bg: '#111B21', accent: theme.colors.primary, text: '#FFFFFF' },
  { label: 'Editorial', value: 'editorial', bg: theme.colors.surface, accent: theme.colors.textPrimary, text: theme.colors.textPrimary },
  { label: 'Soft Gray', value: 'ocean_wave', bg: theme.colors.background, accent: theme.colors.primary, text: theme.colors.textPrimary },
];

export const profileThemeOptions: {
  label: string;
  value: ProfileTheme;
  bg: string;
  accent: string;
  text: string;
}[] = [
  { label: 'WhatsApp Light', value: 'aqua', bg: theme.colors.background, accent: theme.colors.primary, text: theme.colors.textPrimary },
  { label: 'Apple iOS', value: 'mono', bg: '#F5F5F7', accent: '#000000', text: '#000000' },
];

export const typographyColorOptions: { label: string; value: TypographyColorKey; color: string }[] =
  (Object.entries(typographyColorMap) as [TypographyColorKey, { label: string; color: string }][]).map(
    ([value, { label, color }]) => ({ value, label, color })
  );
