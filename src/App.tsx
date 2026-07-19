import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import InputPanel from "./components/InputPanel";
import PreviewPanel from "./components/PreviewPanel";
import { tailorCV } from "./services/openaiService";
import { generatePDF } from "./services/pdfService";
import type { ResumeData, Status, Model, Mode } from "./types";

function getDefaultModel(): Model {
  if (import.meta.env.VITE_LLM_BASE_URL) return "local";
  if (import.meta.env.VITE_OPENAI_API_KEY) return "openai";
  return "local";
}

export default function App() {
  const { t } = useTranslation();

  const [mode, setMode] = useState<Mode>("tailor");

  const LOADING_STEPS = useMemo(() => {
    const key = mode === "format" ? "common:loading.format" : "common:loading.tailor";
    return [
      t(`${key}.step1`),
      t(`${key}.step2`),
      t(`${key}.step3`),
      t(`${key}.step4`),
    ];
  }, [t, mode]);

  const [cvText, setCvText] = useState("");
  const [jdText, setJdText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<Model>(getDefaultModel);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setResumeData(null);
    setStatus("generating");
    setStepIndex(0);

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    try {
      const data = await tailorCV(cvText, jdText, model, mode);
      clearInterval(stepTimer);
      setStepIndex(LOADING_STEPS.length);
      setResumeData(data);
      setStatus("success");
    } catch (err) {
      clearInterval(stepTimer);
      setError(
        err instanceof Error ? err.message : t("common:errors.generic"),
      );
      setStatus("error");
    }
  }, [cvText, jdText, model, mode, t, LOADING_STEPS]);

  const handleDownload = useCallback(async () => {
    if (!resumeData) return;
    try {
      await generatePDF(resumeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common:errors.pdfFailed"));
      setStatus("error");
    }
  }, [resumeData, t]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setResumeData(null);
    setError(null);
    setStepIndex(0);
  }, []);

  const canGenerate = !!cvText.trim() && status !== "generating";

  return (
    <div className="min-h-screen flex flex-col">
      <Header model={model} onModelChange={setModel} />
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
        <div className="flex-1 min-w-0">
          <InputPanel
            cvText={cvText}
            jdText={jdText}
            onCvChange={setCvText}
            onJdChange={setJdText}
            onGenerate={handleGenerate}
            canGenerate={canGenerate}
            isGenerating={status === "generating"}
            mode={mode}
            onModeChange={setMode}
          />
        </div>
        <div className="flex-1 min-w-0">
          <PreviewPanel
            status={status}
            stepIndex={stepIndex}
            loadingSteps={LOADING_STEPS}
            resumeData={resumeData}
            error={error}
            onDownload={handleDownload}
            onReset={handleReset}
            onDataChange={setResumeData}
          />
        </div>
      </main>
    </div>
  );
}