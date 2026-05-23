export type Category =
  | "銀行口座"
  | "パスワード"
  | "書類"
  | "クレジットカード"
  | "その他";

export interface VaultItem {
  id: string;
  category: Category;
  title: string;
  content: string;
  remarks: string;
  fileUrl: string;
  fileName: string;
  // Firestore Timestamp または Date 両対応
  createdAt: Date | { toDate: () => Date };
}

export interface VaultItemInput {
  category: Category;
  title: string;
  content: string;
  remarks: string;
  file: File | null;
}

export interface CategoryConfig {
  icon: string;
  color: string;      // アクセントカラー（濃）
  lightBg: string;    // カード背景
  border: string;     // ボーダー色
  badge: string;      // バッジ背景
  badgeText: string;  // バッジ文字色
}

export const CATEGORIES: Category[] = [
  "銀行口座",
  "パスワード",
  "書類",
  "クレジットカード",
  "その他",
];

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  銀行口座: {
    icon: "🏦",
    color: "#2563EB",
    lightBg: "#EFF6FF",
    border: "#BFDBFE",
    badge: "#DBEAFE",
    badgeText: "#1D4ED8",
  },
  パスワード: {
    icon: "🔑",
    color: "#7C3AED",
    lightBg: "#F5F3FF",
    border: "#DDD6FE",
    badge: "#EDE9FE",
    badgeText: "#5B21B6",
  },
  書類: {
    icon: "📄",
    color: "#059669",
    lightBg: "#F0FDF4",
    border: "#BBF7D0",
    badge: "#DCFCE7",
    badgeText: "#047857",
  },
  クレジットカード: {
    icon: "💳",
    color: "#D97706",
    lightBg: "#FFFBEB",
    border: "#FDE68A",
    badge: "#FEF3C7",
    badgeText: "#B45309",
  },
  その他: {
    icon: "📁",
    color: "#6B7280",
    lightBg: "#F9FAFB",
    border: "#E5E7EB",
    badge: "#F3F4F6",
    badgeText: "#374151",
  },
};

export function getItemDate(item: VaultItem): Date {
  if (item.createdAt instanceof Date) return item.createdAt;
  if (typeof item.createdAt === "object" && "toDate" in item.createdAt) {
    return item.createdAt.toDate();
  }
  return new Date();
}
