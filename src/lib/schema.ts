import { z } from "zod";

export const ThemeSchema = z.object({
  primary: z.string().default("#4f46e5"),
  background: z.string().default("#0b0b10"),
  text: z.string().default("#ffffff"),
  accent: z.string().default("#8b5cf6"),
});

export const ContentSchema = z.object({
  projectName: z.string().min(2, "Project name must be at least 2 characters"),
  headline: z.string().min(4, "Headline must be at least 4 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  logoDataUrl: z.string().optional(),
  heroImageDataUrl: z.string().optional(),
  features: z.array(z.string()).default([]),
  socialLinks: z.object({
    twitter: z.string().optional(),
    discord: z.string().optional(),
    telegram: z.string().optional(),
    website: z.string().optional(),
  }).default({}),
});

export const Web3Schema = z.object({
  contractAddress: z.string().min(10, "Contract address is required"),
  tokenTicker: z.string().min(2, "Token ticker must be at least 2 characters"),
  apyBps: z.coerce.number().int().min(0).max(10000),
  startTs: z.coerce.number().int(),
  endTs: z.coerce.number().int(),
  minStake: z.coerce.number().min(0).default(1),
  maxStake: z.coerce.number().min(0).default(1000),
  totalSupply: z.coerce.number().min(0).default(1000000),
});

export const BuilderSchema = z.object({
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  theme: ThemeSchema,
  content: ContentSchema,
  web3: Web3Schema,
  template: z.enum(["staking", "presale"]).default("staking"),
});

export type BuilderData = z.infer<typeof BuilderSchema>;
export type ThemeData = z.infer<typeof ThemeSchema>;
export type ContentData = z.infer<typeof ContentSchema>;
export type Web3Data = z.infer<typeof Web3Schema>;