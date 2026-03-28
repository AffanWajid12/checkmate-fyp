import { useState } from "react";
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

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const _normalizeType = (t) => String(t ?? "").toLowerCase().trim().replace("-", "_");

const IconMCQ = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8 12l2.3 2.3L16 8.6" />
  </svg>
);

const IconShort = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path d="M5 7h14" />
    <path d="M5 12h10" />
    <path d="M5 17h14" />
  </svg>
);

const IconEssay = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h6" />
  </svg>
);

const IconCode = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path d="M8 9l-3 3 3 3" />
    <path d="M16 9l3 3-3 3" />
    <path d="M14 7l-4 10" />
  </svg>
);

const IconMath = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path d="M7 7h10" />
    <path d="M9 7l6 10" />
    <path d="M15 7l-6 10" />
    <path d="M7 17h10" />
  </svg>
);

const TYPE_BADGE = {
  mcq: { label: "MCQ", icon: <IconMCQ />, color: "bg-accent-50 text-accent-500 border-accent-200" },
  short_text: { label: "Short", icon: <IconShort />, color: "bg-green-50 text-green-700 border-green-200" },
  short: { label: "Short", icon: <IconShort />, color: "bg-green-50 text-green-700 border-green-200" },
  essay: { label: "Essay", icon: <IconEssay />, color: "bg-purple-50 text-purple-700 border-purple-200" },
  coding: { label: "Code", icon: <IconCode />, color: "bg-blue-50 text-blue-700 border-blue-200" },
  code: { label: "Code", icon: <IconCode />, color: "bg-blue-50 text-blue-700 border-blue-200" },
  math: { label: "Math", icon: <IconMath />, color: "bg-amber-50 text-amber-700 border-amber-200" },
};

const TypePill = ({ type }) => {
  const t = _normalizeType(type);
  const meta = TYPE_BADGE[t] ?? {
    label: String(type || "?"),
    color: "bg-neutral-50 text-text-secondary border-neutral-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${meta.color}`}
    >
      {meta.icon ? <span className="-mt-px">{meta.icon}</span> : null}
      {meta.label}
    </span>
  );
};

const stripOuterMathDelimiters = (s) => {
  let t = (s ?? "").toString().trim();

  if (t.startsWith("\\(") && t.endsWith("\\)")) {
    t = t.slice(2, -2).trim();
  } else if (t.startsWith("\\[") && t.endsWith("\\]")) {
    t = t.slice(2, -2).trim();
  } else if (t.startsWith("$$") && t.endsWith("$$")) {
    t = t.slice(2, -2).trim();
  } else if (t.startsWith("$") && t.endsWith("$")) {
    t = t.slice(1, -1).trim();
  }

  return t;
};

const stripCodeFences = (s) => {
  const t = (s ?? "").toString();
  if (!t.includes("```")) return t;

  const parts = t.split("```");
  // If it's a single fenced block, prefer returning its contents.
  if (parts.length === 3) {
    const middle = parts[1];
    const lines = middle.split(/\r?\n/);
    // drop optional language header line
    if (lines.length > 0 && /^[a-zA-Z0-9+_-]+\s*$/.test(lines[0])) {
      return lines.slice(1).join("\n").trimEnd();
    }
    return middle.trimEnd();
  }

  // Otherwise, keep text but remove the fences.
  return parts.join("");
};

const InlineMathSafe = ({ latex }) => (
  <InlineMath
    math={latex}
    renderError={() => (
      <span className="font-mono text-xs text-text-secondary">{`$${latex}$`}</span>
    )}
  />
);

const BlockMathSafe = ({ latex }) => (
  <BlockMath
    math={latex}
    renderError={() => (
      <pre className="font-mono text-xs text-text-secondary whitespace-pre-wrap">{`$$\n${latex}\n$$`}</pre>
    )}
  />
);

const InlineCode = ({ children }) => (
  <code className="px-1 py-0.5 rounded bg-neutral-100 border border-neutral-200 font-mono text-[0.85em] text-text-primary">
    {children}
  </code>
);

const renderPlainTextWithMath = (text, keyPrefix) => {
  const nodes = [];
  let cursor = 0;

  const pushPlain = (t, key) => {
    if (!t) return;
    nodes.push(
      <span key={key} className="whitespace-pre-wrap">
        {t}
      </span>
    );
  };

  const findNext = (str, from) => {
    const patterns = [
      { open: "$$", close: "$$", kind: "block" },
      { open: "\\[", close: "\\]", kind: "block" },
      { open: "\\(", close: "\\)", kind: "inline" },
      { open: "$", close: "$", kind: "inline" },
    ];

    let best = null;
    for (const p of patterns) {
      const idx = str.indexOf(p.open, from);
      if (idx === -1) continue;
      if (best === null || idx < best.idx) best = { ...p, idx };
    }
    return best;
  };

  while (cursor < text.length) {
    const next = findNext(text, cursor);
    if (!next) {
      pushPlain(text.slice(cursor), `${keyPrefix}-t-${cursor}`);
      break;
    }

    // Avoid treating $$ as $.
    if (next.open === "$" && text.slice(next.idx, next.idx + 2) === "$$") {
      cursor = next.idx + 2;
      continue;
    }

    pushPlain(text.slice(cursor, next.idx), `${keyPrefix}-t-${cursor}`);

    const openLen = next.open.length;
    const endIdx = text.indexOf(next.close, next.idx + openLen);
    if (endIdx === -1) {
      pushPlain(text.slice(next.idx), `${keyPrefix}-t-${next.idx}`);
      break;
    }

    const latex = text.slice(next.idx + openLen, endIdx);
    const cleaned = latex.trim();
    if (cleaned) {
      nodes.push(
        next.kind === "block" ? (
          <BlockMathSafe key={`${keyPrefix}-m-${next.idx}`} latex={cleaned} />
        ) : (
          <InlineMathSafe key={`${keyPrefix}-m-${next.idx}`} latex={cleaned} />
        )
      );
    }

    cursor = endIdx + next.close.length;
  }

  return nodes;
};

const renderTextWithMath = (raw) => {
  const s = (raw ?? "").toString();
  if (!s.trim()) return <span className="text-text-muted italic">—</span>;

  // Fast path: if it's entirely a math block, render as math.
  const outer = stripOuterMathDelimiters(s);
  if (outer !== s) {
    const isBlock = s.trim().startsWith("$$") || s.trim().startsWith("\\[");
    return isBlock ? <BlockMathSafe latex={outer} /> : <InlineMathSafe latex={outer} />;
  }

  // Tokenize code fences first; text segments then get math tokenization.
  const segments = s.split("```");
  const nodes = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isCode = i % 2 === 1;
    if (isCode) {
      const code = stripCodeFences("```" + seg + "```");
      nodes.push(
        <pre
          key={`code-${i}`}
          className="mt-3 mb-3 px-4 py-4 rounded-2xl bg-neutral-900 text-white text-xs whitespace-pre-wrap wrap-break-word overflow-x-hidden min-h-24"
        >
          <code className="font-mono">{code}</code>
        </pre>
      );
      continue;
    }

    // Inline code segments: `...` (handled before math parsing inside each plain chunk)
    const text = seg;
    let cursor = 0;
    while (cursor < text.length) {
      const start = text.indexOf("`", cursor);
      if (start === -1) {
        nodes.push(...renderPlainTextWithMath(text.slice(cursor), `seg-${i}-${cursor}`));
        break;
      }

      const end = text.indexOf("`", start + 1);
      if (end === -1) {
        // Unclosed backtick; treat as plain.
        nodes.push(...renderPlainTextWithMath(text.slice(cursor), `seg-${i}-${cursor}`));
        break;
      }

      nodes.push(...renderPlainTextWithMath(text.slice(cursor, start), `seg-${i}-${cursor}`));

      const code = text.slice(start + 1, end);
      if (code) {
        nodes.push(
          <InlineCode key={`icode-${i}-${start}`}>{code}</InlineCode>
        );
      }

      cursor = end + 1;
    }
  }

  return nodes.length === 1 ? nodes[0] : <>{nodes}</>;
};

const renderCoding = (raw) => {
  const code = stripCodeFences(raw).trimEnd();
  if (!code) return <span className="text-text-muted italic">—</span>;
  return (
    <pre className="mt-3 mb-3 px-4 py-4 rounded-2xl bg-neutral-900 text-white text-xs whitespace-pre-wrap wrap-break-word overflow-x-hidden min-h-24">
      <code className="font-mono">{code}</code>
    </pre>
  );
};

const _normalizeAnswerText = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'");

const _getMcqCorrectIndex = (q) => {
  const options = Array.isArray(q?.options) ? q.options : [];
  if (options.length === 0) return null;

  const raw =
    q?.correctAnswer ??
    q?.correct_answer ??
    q?.expectedAnswer ??
    q?.expected_answer ??
    q?.answer ??
    "";

  if (typeof raw === "number" && Number.isFinite(raw)) {
    const idx0 = raw;
    if (idx0 >= 0 && idx0 < options.length) return idx0;
    const idx1 = raw - 1;
    if (idx1 >= 0 && idx1 < options.length) return idx1;
    return null;
  }

  const s = String(raw ?? "").trim();
  if (!s) return null;

  // If LLM returned letter (A/B/C/...) or "Option B".
  const letterMatch = /\b([A-Z])\b/i.exec(s);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const idx = letter.charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) return idx;
  }

  // If LLM returned a number.
  const num = Number(s);
  if (Number.isFinite(num)) {
    if (num >= 0 && num < options.length) return num;
    if (num - 1 >= 0 && num - 1 < options.length) return num - 1;
  }

  // Preferred contract: expectedAnswer matches one of the option strings.
  const needle = _normalizeAnswerText(s);
  const exactIdx = options.findIndex((o) => _normalizeAnswerText(o) === needle);
  if (exactIdx !== -1) return exactIdx;

  // Fallback: substring match (helps when expectedAnswer repeats the option with extra punctuation).
  const containsIdx = options.findIndex((o) => {
    const hay = _normalizeAnswerText(o);
    return hay && (hay.includes(needle) || needle.includes(hay));
  });
  return containsIdx !== -1 ? containsIdx : null;
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
                      {_normalizeType(q.type) === "coding" || _normalizeType(q.type) === "code"
                        ? renderCoding(q.text)
                        : renderTextWithMath(q.text)}
                    </div>

                    {_normalizeType(q.type) === "mcq" && Array.isArray(q.options) && q.options.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(() => {
                          const correctIdx = _getMcqCorrectIndex(q);
                          return q.options.map((opt, idx) => {
                            const isCorrect = correctIdx === idx;
                            return (
                              <div
                                key={idx}
                                className={`px-3 py-2 rounded-xl border text-sm flex items-start gap-2 ${
                                  isCorrect
                                    ? "bg-green-50 border-green-200 text-green-800"
                                    : "bg-neutral-50 border-neutral-200 text-text-secondary"
                                }`}
                              >
                                <div className="shrink-0 flex items-center gap-2">
                                  <span className="font-semibold">
                                    {String.fromCharCode(65 + idx)}.
                                  </span>
                                  {isCorrect ? (
                                    <span className="text-green-600" title="Correct answer">
                                      <CheckIcon />
                                    </span>
                                  ) : null}
                                </div>
                                <div className="min-w-0">{renderTextWithMath(opt)}</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                        Expected answer
                      </p>
                      <div className="mt-2 text-sm text-text-primary">
                        {_normalizeType(q.type) === "coding" || _normalizeType(q.type) === "code"
                          ? renderCoding(q.expectedAnswer)
                          : renderTextWithMath(q.expectedAnswer)}
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
