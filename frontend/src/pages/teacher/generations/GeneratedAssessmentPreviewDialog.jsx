import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BlockMath, InlineMath } from "react-katex";

import apiClient from "../../../utils/apiClient.js";
import { useGeneratedAssessment } from "../../../hooks/useGenerations.js";

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TYPE_BADGE = {
  mcq: { label: "MCQ" },
  short_text: { label: "Short" },
  essay: { label: "Essay" },
  coding: { label: "Code" },
  math: { label: "Math" },
};

const TypePill = ({ type }) => {
  const meta = TYPE_BADGE[type] ?? { label: String(type || "?") };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-neutral-50 text-text-secondary border-neutral-200">
      {meta.label}
    </span>
  );
};

const stripMathDelimiters = (s) => {
  let t = (s ?? "").toString().trim();

  if (t.startsWith("\\(") && t.endsWith("\\)")) {
    t = t.slice(2, -2).trim();
  }
  if (t.startsWith("\\[") && t.endsWith("\\]")) {
    t = t.slice(2, -2).trim();
  }
  if (t.startsWith("$$") && t.endsWith("$$")) {
    t = t.slice(2, -2).trim();
  } else if (t.startsWith("$") && t.endsWith("$")) {
    t = t.slice(1, -1).trim();
  }

  return t;
};

const MathText = ({ value }) => {
  const latex = useMemo(() => stripMathDelimiters(value), [value]);
  const isBlock = latex.includes("\\\\") || latex.includes("\n") || latex.length > 60;

  if (!latex) {
    return <span className="text-text-muted italic">—</span>;
  }

  return isBlock ? <BlockMath math={latex} /> : <InlineMath math={latex} />;
};

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    window.URL.revokeObjectURL(url);
  }
};

const guessFilename = (assessment) => {
  const safe = (s) =>
    String(s ?? "")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .slice(0, 80);

  const base = safe(assessment?.title) || safe(assessment?.subject) || "generated-assessment";
  return `${base}.docx`;
};

const getDownloadFilenameFromHeaders = (headers) => {
  const cd = headers?.["content-disposition"];
  if (!cd) return null;

  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
  const raw = match?.[1] ?? match?.[2];
  if (!raw) return null;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const GeneratedAssessmentPreviewDialog = ({ id, onClose }) => {
  const { data: assessment, isLoading, error } = useGeneratedAssessment(id);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!assessment?.id || exporting) return;

    setExporting(true);
    try {
      const resp = await apiClient.get(
        `/api/generated-assessments/${assessment.id}/export.docx`,
        { responseType: "blob" }
      );

      const filename =
        getDownloadFilenameFromHeaders(resp.headers) || guessFilename(assessment);

      downloadBlob(new Blob([resp.data]), filename);
      toast.success("DOCX downloaded.");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 501) {
        toast("DOCX export is not yet implemented on the server.", { icon: "🚧" });
      } else {
        toast.error(err?.response?.data?.message ?? err?.message ?? "Export failed.");
      }
    } finally {
      setExporting(false);
    }
  };

  const questions = assessment?.questions ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-background rounded-2xl shadow-2xl border border-neutral-100 w-full max-w-4xl mx-4 overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-neutral-100">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-text-primary truncate">
              {assessment?.title ?? "Generated assessment"}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              {assessment?.subject ? `${assessment.subject} • ` : ""}
              {assessment?.assessmentType ? `${assessment.assessmentType} • ` : ""}
              {assessment?.difficulty ?? ""}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              disabled={exporting || isLoading || !assessment}
              className="px-3 py-2 rounded-xl bg-primary text-text-inverse text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting ? "Exporting…" : "Export as DOCX"}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-neutral-100 transition-colors"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          {isLoading && (
            <div className="p-6">
              <p className="text-sm text-text-secondary">Loading preview…</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-6">
              <p className="text-sm text-error">Failed to load preview.</p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="p-6 space-y-4">
              {questions.length === 0 ? (
                <div className="text-sm text-text-muted italic">No questions.</div>
              ) : (
                questions.map((q) => (
                  <div
                    key={q.index}
                    className="bg-background rounded-2xl border border-neutral-200 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-text-secondary">
                          Q{q.index}
                        </span>
                        <TypePill type={q.type} />
                      </div>
                      <div className="text-xs text-text-muted flex items-center gap-2">
                        <span>{q.marks} mark{q.marks === 1 ? "" : "s"}</span>
                        <span className="text-neutral-300">•</span>
                        <span className="capitalize">{q.difficulty}</span>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-text-primary leading-relaxed">
                      {q.type === "math" ? <MathText value={q.text} /> : q.text}
                    </div>

                    {q.type === "mcq" && Array.isArray(q.options) && q.options.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-text-secondary"
                          >
                            <span className="font-semibold mr-2">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                        Expected answer
                      </p>
                      <div className="mt-2 text-sm text-text-primary">
                        {q.type === "math" ? (
                          <MathText value={q.expectedAnswer} />
                        ) : (
                          q.expectedAnswer
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratedAssessmentPreviewDialog;
