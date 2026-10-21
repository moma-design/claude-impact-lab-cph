import { z } from "zod";

export const SignalSchema = z.object({
  headline: z.string(),
  what_is_changing: z.string(),
  what_it_means_for_you: z.string(),
  source_title: z.string(),
  source_url: z.string(),
});

export const SignalsSchema = z.object({
  signals: z.array(SignalSchema),
});

export type Signal = z.infer<typeof SignalSchema>;

export interface SignalsResponse {
  signals: Signal[];
  savedExample: boolean;
}
