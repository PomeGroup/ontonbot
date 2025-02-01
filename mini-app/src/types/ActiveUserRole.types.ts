export interface ActiveUserRole {
  itemId: number;
  itemType: "event" | "project"; // or string
  userId: number;
  username: string | null;
  role: "owner" | "admin" | "checkin_officer";
  status: "active" | "deactivate";
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface UserRolesBulkUpsertInput {
  itemId: number;
  itemType: "event" | "project"; // or string
  userId: number;
  username: string | null;
  photo_url: string | null;
  role: "owner" | "admin" | "checkin_officer";
  status: "active" | "deactivate";
}