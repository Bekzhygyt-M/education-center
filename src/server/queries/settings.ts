import "server-only";

import { prisma } from "@/server/db/prisma";
import { DEFAULT_LATE_THRESHOLD_MINUTES, LATE_THRESHOLD_KEY } from "@/server/constants";

/**
 * Reads the configurable "late" threshold from the settings table.
 * Falls back to the compiled default if the row is missing, so a fresh
 * database or a deleted setting never breaks attendance marking.
 */
export async function getLateThresholdMinutes(): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: LATE_THRESHOLD_KEY },
    select: { value: true },
  });

  const parsed = Number.parseInt(setting?.value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_LATE_THRESHOLD_MINUTES;
}