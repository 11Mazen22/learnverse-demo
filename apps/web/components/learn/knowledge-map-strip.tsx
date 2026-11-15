"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Icon } from "@/components/ui/icon";
import {
  buildSubjectKnowledgeMap,
  type KnowledgeMapInputLesson,
  type KnowledgeMapInputUnit,
} from "@/lib/curriculum/knowledge-map";
import { resolveSubjectLabForLesson } from "@/lib/curriculum/subject-labs";

export type KnowledgeMapStripProps = {
  subjectKey: string;
  subjectAccent?: string | null;
  units: KnowledgeMapInputUnit[];
  lessons: KnowledgeMapInputLesson[];
  completedLessonIds: ReadonlySet<string>;
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
  activeLessonId?: string | null;
  buildLessonHref: (lessonId: string) => string;
  compact?: boolean;
};

/**
 * Clickable Knowledge Map visualizing Unit -> Sequential Lessons -> Prerequisite links
 * -> Interactive Lab badges -> Unit Boss Challenge across /learn and /lesson/[id].
 */
export function KnowledgeMapStrip({
  subjectKey,
  subjectAccent,
  units,
  lessons,
  completedLessonIds,
  uiLocale,
  contentLocale,
  activeLessonId,
  buildLessonHref,
  compact = false,
}: KnowledgeMapStripProps) {
  const map = useMemo(
    () =>
      buildSubjectKnowledgeMap({
        subjectKey,
        units,
        lessons,
        completedLessonIds,
        hasInteractiveLabForLesson: (lesson) =>
          Boolean(
            resolveSubjectLabForLesson({
              lessonIdOrSlug: lesson.id,
              lessonTitle: `${lesson.title_ar} ${lesson.title_en}`,
              subjectKey,
            }),
          ),
      }),
    [completedLessonIds, lessons, subjectKey, units],
  );

  if (map.totalLessons === 0) return null;

  const tUi = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);
  const tContent = (ar: string, en: string) => (contentLocale === "ar" ? ar : en);

  return (
    <section
      className={`noata-kmap-strip ${compact ? "is-compact" : ""}`}
      data-accent={subjectAccent ?? undefined}
      dir={uiLocale === "ar" ? "rtl" : "ltr"}
      aria-label={tUi("خريطة المفاهيم والاعتمادية", "Knowledge Map & Prerequisites")}
    >
      <div className="noata-kmap-head">
        <div className="noata-kmap-title-group">
          <Icon name="compass" size={16} />
          <div>
            <h3>{tUi("خريطة المفاهيم وتسلسل الإتقان", "Knowledge Map & Mastery Path")}</h3>
            <p>
              {tUi(
                `${map.completedLessons} من ${map.totalLessons} دروس مكتملة في هذا المسار`,
                `${map.completedLessons} of ${map.totalLessons} lessons completed in this track`,
              )}
            </p>
          </div>
        </div>

        <Link href="/boss" className="noata-kmap-boss-link">
          <Icon name="swords" size={15} />
          <span>{tUi(map.bossMilestoneLabelAr, map.bossMilestoneLabelEn)}</span>
        </Link>
      </div>

      <div className="noata-kmap-units">
        {map.units.map((unit) => (
          <div key={unit.id} className="noata-kmap-unit-group">
            <div className="noata-kmap-unit-label" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
              <span className="noata-kmap-unit-num">{unit.position}</span>
              <strong>{tContent(unit.titleAr, unit.titleEn)}</strong>
            </div>

            <ol className="noata-kmap-chain">
              {unit.lessons.map((node) => {
                const isCurrent = Boolean(activeLessonId && node.id === activeLessonId);
                return (
                  <li key={node.id} className="noata-kmap-chain-item">
                    <Link
                      href={buildLessonHref(node.id)}
                      className={`noata-kmap-node ${isCurrent ? "is-current" : ""} ${
                        node.completed ? "is-done" : ""
                      }`}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <span className="noata-kmap-node-order">
                        {node.completed ? <Icon name="check" size={12} /> : node.orderNumber}
                      </span>
                      <span
                        className="noata-kmap-node-title"
                        dir={contentLocale === "ar" ? "rtl" : "ltr"}
                      >
                        {tContent(node.titleAr, node.titleEn)}
                      </span>
                      {node.hasInteractiveLab ? (
                        <span
                          className="noata-kmap-node-badge"
                          title={tUi("يتضمن مختبرًا تفاعليًا", "Includes interactive lab")}
                        >
                          <Icon name="microscope" size={12} />
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
