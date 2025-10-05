export const expireEntries = ["never", "day", "week", "year"] as const;

export type Expiry = (typeof expireEntries)[number] | number;
