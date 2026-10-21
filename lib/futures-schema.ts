import { z } from "zod";

export const FutureSchema = z.object({
  title: z.string(),
  horizon: z.string(),
  what_it_is: z.string(),
  trend: z.string(),
  why_you: z.string(),
  source_title: z.string(),
  source_url: z.string(),
});

export const FuturesSchema = z.object({
  futures: z.array(FutureSchema),
});

export type Future = z.infer<typeof FutureSchema>;
