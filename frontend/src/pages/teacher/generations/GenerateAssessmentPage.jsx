import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import TeacherSidebar from "../TeacherSidebar.jsx";
import {
  useGenerateAssessment,
  useReferenceMaterials,
  useUploadReferenceMaterials,
} from "../../../hooks/useGenerations.js";

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

const formatBytes = (bytes) => {
  if (typeof bytes !== "number") return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DEFAULT_COUNTS = {
  mcq: 5,
  short_text: 3,
  essay: 0,
  coding: 0,
  math: 0,
};

const toInt = (v) => {
  const n = Number.parseInt(String(v ?? "0"), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const TeacherGenerateAssessmentPage = () => {
  const navigate = useNavigate();

  const { data: materials = [], isLoading: loadingMaterials } =
    useReferenceMaterials();
  const uploadMutation = useUploadReferenceMaterials();
  const generateMutation = useGenerateAssessment();

  const [subject, setSubject] = useState("");
  const [assessmentType, setAssessmentType] = useState("quiz");
  const [difficulty, setDifficulty] = useState("easy");
  const [instructions, setInstructions] = useState("");
  const [counts, setCounts] = useState(DEFAULT_COUNTS);

  const [selectedMaterialIds, setSelectedMaterialIds] = useState(() => new Set());
  const [uploadFiles, setUploadFiles] = useState([]);

  const total = useMemo(
    () => Object.values(counts).reduce((sum, v) => sum + toInt(v), 0),
    [counts]
  );

  const canSubmit =
    subject.trim().length > 0 && total > 0 && !generateMutation.isPending;

  const toggleMaterial = (id) => {
    setSelectedMaterialIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUpload = async () => {
    if (!uploadFiles.length || uploadMutation.isPending) return;

    try {
      const uploaded = await uploadMutation.mutateAsync(uploadFiles);
      toast.success(
        `Uploaded ${uploaded.length} file${uploaded.length === 1 ? "" : "s"}.`
      );

      setSelectedMaterialIds((prev) => {
        const next = new Set(prev);
        uploaded.forEach((m) => next.add(m.id));
        return next;
      });

      setUploadFiles([]);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ?? err?.response?.data?.error ?? "Upload failed."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Subject is required.");
      return;
    }
    if (total <= 0) {
      toast.error("Total question count must be greater than 0.");
      return;
    }

    const payload = {
      subject: subject.trim(),
      assessmentType,
      difficulty,
      questionTypeCounts: {
        mcq: toInt(counts.mcq),
        short_text: toInt(counts.short_text),
        essay: toInt(counts.essay),
        coding: toInt(counts.coding),
        math: toInt(counts.math),
      },
      instructions: instructions.trim() ? instructions.trim() : undefined,
      referenceMaterialIds: Array.from(selectedMaterialIds),
    };

    try {
      const generated = await generateMutation.mutateAsync(payload);
      toast.success("Assessment generated!");
      navigate("/teacher/generations", { state: { openId: generated.id } });
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        "Failed to generate assessment.";
      toast.error(msg);
    }
  };

  return (
    <TeacherSidebar>
      <div className="max-w-3xl mx-auto pb-16 p-6">
        <div className="mb-8">
          <button
            onClick={() => navigate("/teacher/generations")}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <BackIcon />
            Back
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Generate assessment</h1>
          <p className="text-sm text-text-secondary mt-1">
            Choose the type, difficulty, and question mix.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Subject / Topic <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder='e.g. "Linear Algebra", "OOP in Java"'
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Assessment type
              </label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
              >
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Question counts
              </label>
              <p className="text-xs text-text-muted">
                Total: <span className="font-semibold text-text-secondary">{total}</span>
              </p>
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "mcq", label: "MCQ" },
                { key: "short_text", label: "Short" },
                { key: "essay", label: "Essay" },
                { key: "coding", label: "Coding" },
                { key: "math", label: "Math" },
              ].map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50"
                >
                  <span className="text-sm font-semibold text-text-primary">
                    {row.label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={counts[row.key]}
                    onChange={(e) =>
                      setCounts((prev) => ({ ...prev, [row.key]: toInt(e.target.value) }))
                    }
                    className="w-24 px-3 py-2 rounded-xl border border-neutral-200 bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-right"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Additional instructions (optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="e.g. focus on conceptual understanding, keep questions short…"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Reference materials</h3>
                <p className="text-xs text-text-muted mt-1">
                  Optional. Upload PDFs and select them for grounding (RAG).
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-background p-4">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
                Upload new
              </label>
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => setUploadFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-neutral-100 file:text-text-secondary hover:file:bg-neutral-200"
              />

              {uploadFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadFiles.map((f) => (
                    <div
                      key={f.name + f.size}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary truncate">{f.name}</p>
                        <p className="text-xs text-text-muted">{formatBytes(f.size)}</p>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                      className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {uploadMutation.isPending ? "Uploading…" : "Upload"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-background p-4">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
                Select existing
              </label>

              {loadingMaterials ? (
                <p className="text-sm text-text-secondary">Loading materials…</p>
              ) : materials.length === 0 ? (
                <p className="text-sm text-text-muted italic">No uploaded materials.</p>
              ) : (
                <div className="space-y-2">
                  {materials.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMaterialIds.has(m.id)}
                        onChange={() => toggleMaterial(m.id)}
                        className="w-4 h-4 accent-accent-500"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary truncate">{m.file_name}</p>
                        <p className="text-xs text-text-muted">
                          {m.mime_type} • {formatBytes(m.file_size)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/teacher/generations")}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2.5 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generateMutation.isPending ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </TeacherSidebar>
  );
};

export default TeacherGenerateAssessmentPage;
