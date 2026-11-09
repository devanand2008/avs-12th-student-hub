export const GIFT_MILESTONE = 100000;
export const giftStatuses = [
  "requested",
  "approved",
  "dispatched",
  "delivered",
  "rejected",
] as const;
export type GiftStatus = (typeof giftStatuses)[number];
export interface GiftHistory {
  status: GiftStatus;
  gift: string;
  delivery_note: string;
  created_at: string;
  actor_id?: string;
  admin_notes?: string;
}
export interface GiftClaim {
  id: string;
  status: GiftStatus;
  gift: string;
  delivery_note: string;
  version: number;
  created_at: string;
  updated_at: string;
}
export interface StudentGift {
  eligible: boolean;
  points: number;
  milestone: number;
  claim: GiftClaim | null;
  history: GiftHistory[];
}
export interface AdminGiftClaim extends GiftClaim {
  user_id: string;
  studentName: string;
  studentId: string;
  email: string;
  points: number;
  admin_notes: string;
  history: GiftHistory[];
}
export function nextGiftStatuses(status: GiftStatus): readonly GiftStatus[] {
  return {
    requested: ["requested", "approved", "rejected"],
    approved: ["approved", "dispatched", "rejected"],
    dispatched: ["dispatched", "delivered"],
    delivered: [],
    rejected: ["rejected", "requested"],
  }[status] as GiftStatus[];
}
