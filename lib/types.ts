export interface User {
  id: string;
  email: string;
  displayName: string;
  isGuest: boolean;
}

export interface Island {
  islandId: string;
  userId: string;
  name: string;
  colorHex: string;
  icon: string;
  archived: boolean;
  angleDeg?: number;
  createdAt: string;
}

export interface Entry {
  entryId: string;
  islandId: string;
  userId: string;
  minutesSpent: number;
  moodScore: number;
  note: string | null;
  sentimentScore: number | null;
  loggedAt: string;
}

export interface PassionScore {
  islandId: string;
  passionScore: number;
  mostRecentHoursAgo: number;
}

export interface SessionPayload {
  userId: string;
  isGuest: boolean;
}
