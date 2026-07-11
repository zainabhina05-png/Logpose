import { z } from "zod";

export const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Display name is required").max(100),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const IslandSchema = z.object({
  name: z.string().min(1, "Island name is required").max(100),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .default("#C9973B"),
  icon: z.string().max(50).default("island"),
});

export const IslandUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  icon: z.string().max(50).optional(),
  archived: z.boolean().optional(),
});

export const EntrySchema = z.object({
  islandId: z.string().uuid("Invalid island ID"),
  minutesSpent: z.number().int().min(1).max(1440),
  moodScore: z.number().int().min(1).max(5),
  note: z.string().max(2000).optional(),
});

export const EntriesQuerySchema = z.object({
  islandId: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type IslandInput = z.infer<typeof IslandSchema>;
export type EntryInput = z.infer<typeof EntrySchema>;
