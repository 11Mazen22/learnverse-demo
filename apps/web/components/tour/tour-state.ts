import {
  ADMIN_WELCOME_TOUR,
  PAGE_MINI_TOURS,
  STUDENT_WELCOME_TOUR,
  TEACHER_WELCOME_TOUR,
} from "./tour-catalog.ts";
import type {
  TourDefinition,
  TourProgress,
  TourRole,
  TourStateMap,
} from "./tour-types.ts";

const TOUR_ID = /^[a-z0-9_:-]{1,100}$/;
const STATUSES = new Set<TourProgress["status"]>([
  "not_started",
  "in_progress",
  "completed",
  "skipped",
]);

export const TOUR_STORAGE_PREFIX = "noata_tour_state_v2";

export function tourStorageKey(userId: string, role: TourRole): string {
  return `${TOUR_STORAGE_PREFIX}:${userId}:${role}`;
}

export function welcomeTourForRole(role: TourRole): TourDefinition {
  if (role === "admin") return ADMIN_WELCOME_TOUR;
  if (role === "teacher") return TEACHER_WELCOME_TOUR;
  return STUDENT_WELCOME_TOUR;
}

export function tourDefinitionById(tourId: string): TourDefinition | null {
  const welcome = [STUDENT_WELCOME_TOUR, TEACHER_WELCOME_TOUR, ADMIN_WELCOME_TOUR].find(
    (tour) => tour.id === tourId,
  );
  if (welcome) return welcome;
  return Object.values(PAGE_MINI_TOURS).find((tour) => tour.id === tourId) ?? null;
}

export function roleCanUseTour(tour: TourDefinition, role: TourRole | null): boolean {
  return Boolean(role && (tour.role === "all" || tour.role === role));
}

function routePatternMatches(pattern: string, pathname: string): boolean {
  if (pattern === pathname) return true;
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, index) =>
    /^\[[^\]]+\]$/.test(part) ? Boolean(pathParts[index]) : part === pathParts[index],
  );
}

export function pageTourForPath(pathname: string | null, role: TourRole | null): TourDefinition | null {
  if (!pathname || !role) return null;
  for (const [route, tour] of Object.entries(PAGE_MINI_TOURS)) {
    if (routePatternMatches(route, pathname) && roleCanUseTour(tour, role)) return tour;
  }
  return null;
}

function validIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function sanitizeTourState(value: unknown): TourStateMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const clean: TourStateMap = {};
  for (const [tourId, candidate] of Object.entries(value)) {
    if (!TOUR_ID.test(tourId) || !candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      continue;
    }
    const row = candidate as Record<string, unknown>;
    if (
      !STATUSES.has(row.status as TourProgress["status"]) ||
      !Number.isInteger(row.stepIndex) ||
      Number(row.stepIndex) < 0 ||
      !Number.isInteger(row.version) ||
      Number(row.version) < 1 ||
      !validIsoDate(row.updatedAt)
    ) {
      continue;
    }
    clean[tourId] = {
      status: row.status as TourProgress["status"],
      stepIndex: Number(row.stepIndex),
      version: Number(row.version),
      updatedAt: row.updatedAt,
      automaticDismissed: row.automaticDismissed === true,
      completedAt: validIsoDate(row.completedAt) ? row.completedAt : null,
    };
  }
  return clean;
}

export function mergeTourStates(local: TourStateMap, remote: TourStateMap): TourStateMap {
  const merged: TourStateMap = { ...local };
  for (const [tourId, candidate] of Object.entries(remote)) {
    const current = merged[tourId];
    if (
      !current ||
      candidate.version > current.version ||
      (candidate.version === current.version && Date.parse(candidate.updatedAt) >= Date.parse(current.updatedAt))
    ) {
      merged[tourId] = candidate;
    }
  }
  return merged;
}

export type TourProgressRow = {
  automatic_dismissed: boolean;
  completed_at: string | null;
  status: string;
  step_index: number;
  tour_id: string;
  tour_version: number;
  updated_at: string;
};

export function tourStateFromRows(rows: readonly TourProgressRow[]): TourStateMap {
  return sanitizeTourState(
    Object.fromEntries(
      rows.map((row) => [
        row.tour_id,
        {
          status: row.status,
          stepIndex: row.step_index,
          version: row.tour_version,
          updatedAt: row.updated_at,
          automaticDismissed: row.automatic_dismissed,
          completedAt: row.completed_at,
        },
      ]),
    ),
  );
}

export function progressIsCurrent(
  progress: TourProgress | undefined,
  tour: TourDefinition,
): boolean {
  return Boolean(progress && progress.version === tour.version);
}
