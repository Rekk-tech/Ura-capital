import { z } from "zod";

const scenarioKeyPattern = /^[A-Z0-9][A-Z0-9_-]{0,63}$/;
const positiveIntegerPattern = /^[1-9]\d*$/;

export const noQueryParamsSchema = z.object({}).strict();

export const scenarioSnapshotParamsSchema = z.object({
  scenarioKey: z
    .string()
    .min(1)
    .max(64)
    .regex(scenarioKeyPattern, "scenarioKey must use uppercase letters, numbers, underscores, or hyphens"),
  cycle: z
    .string()
    .regex(positiveIntegerPattern, "cycle must be a positive integer")
    .transform((value, ctx) => {
      const parsed = Number(value);
      if (!Number.isSafeInteger(parsed) || parsed < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "cycle must be a positive safe integer",
        });
        return z.NEVER;
      }
      return parsed;
    }),
});

export type ScenarioSnapshotParams = z.infer<typeof scenarioSnapshotParamsSchema>;
