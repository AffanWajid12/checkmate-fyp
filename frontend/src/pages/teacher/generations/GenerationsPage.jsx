import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import TeacherSidebar from "../TeacherSidebar.jsx";
import { useGeneratedAssessments } from "../../../hooks/useGenerations.js";
import GeneratedAssessmentPreviewDialog from "./GeneratedAssessmentPreviewDialog.jsx";

const formatDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const TYPE_META = {
  QUIZ: { label: "Quiz", color: "bg-blue-50 text-blue-600 border-blue-200" },
  ASSIGNMENT: {
    label: "Assignment",
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
  EXAM: { label: "Exam", color: "bg-amber-50 text-amber-600 border-amber-200" },
};

const CardSkeleton = () => (
  <div className="bg-background rounded-2xl border border-neutral-200 p-5 animate-pulse flex flex-col gap-3 h-40">
    <div className="flex justify-between">
      <div className="h-3 w-24 bg-neutral-200 rounded" />
      <div className="h-4 w-16 bg-neutral-200 rounded-full" />
    </div>
    <div className="h-4 bg-neutral-200 rounded w-3/4 mt-1" />
    <div className="h-3 bg-neutral-200 rounded w-2/3" />
    <div className="mt-auto pt-3 border-t border-neutral-100">
      <div className="h-3 bg-neutral-200 rounded w-1/3" />
    </div>
  </div>
);

const GeneratedAssessmentCard = ({ item, onClick }) => {
  const typeMeta = TYPE_META[item.assessmentType] ?? TYPE_META.ASSIGNMENT;

  return (
    <div
      onClick={onClick}
      className="bg-background rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 flex flex-col gap-3 group"
    >
      <div className="flex justify-between items-start gap-3">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest truncate">
          {item.subject || "Generated"}
        </p>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${typeMeta.color}`}
        >
          {typeMeta.label}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-bold text-text-primary leading-tight group-hover:text-accent-600 transition-colors line-clamp-2">
          {item.title || `${item.subject || "Assessment"}`}
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Difficulty: <span className="font-medium text-text-secondary">{item.difficulty}</span>
          {typeof item.questionCount === "number" ? (
            <>
              <span className="mx-2">•</span>
              {item.questionCount} question{item.questionCount === 1 ? "" : "s"}
            </>
          ) : null}
        </p>
      </div>

      <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
        <span className="text-text-secondary">{formatDateTime(item.createdAt)}</span>
        <span className="text-accent-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          Preview →
        </span>
      </div>
    </div>
  );
};

const TeacherGenerationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: items = [], isLoading } = useGeneratedAssessments();
  const [previewId, setPreviewId] = useState(null);

  const openIdFromNav = location.state?.openId;
  useEffect(() => {
    if (openIdFromNav) {
      setPreviewId(openIdFromNav);
      navigate("/teacher/generations", { replace: true });
    }
  }, [openIdFromNav, navigate]);

  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return copy;
  }, [items]);

  return (
    <TeacherSidebar>
      <div className="max-w-7xl mx-auto p-6 pb-20">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Generations</h1>
            <p className="text-sm text-text-secondary mt-1">
              {isLoading
                ? "Loading generated assessments…"
                : `Showing ${sortedItems.length} generated assessment${sortedItems.length !== 1 ? "s" : ""}.`}
            </p>
          </div>

          <button
            onClick={() => navigate("/teacher/generations/new")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Generate assessment
          </button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && sortedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-accent-50 border border-accent-100 flex items-center justify-center mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-8 h-8 text-accent-400"
              >
                <path d="M12 3v4" />
                <path d="M3 12h4" />
                <path d="M17 12h4" />
                <path d="M12 17v4" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-1">
              No generated assessments
            </h2>
            <p className="text-sm text-text-secondary max-w-sm">
              Generate a new assessment to preview questions and export later.
            </p>
            <button
              onClick={() => navigate("/teacher/generations/new")}
              className="mt-5 px-4 py-2.5 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              Generate assessment
            </button>
          </div>
        )}

        {!isLoading && sortedItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedItems.map((item) => (
              <GeneratedAssessmentCard
                key={item.id}
                item={item}
                onClick={() => setPreviewId(item.id)}
              />
            ))}
          </div>
        )}

        {previewId && (
          <GeneratedAssessmentPreviewDialog
            id={previewId}
            onClose={() => setPreviewId(null)}
          />
        )}
      </div>
    </TeacherSidebar>
  );
};

export default TeacherGenerationsPage;
