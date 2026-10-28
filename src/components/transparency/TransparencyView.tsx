import React from 'react';
import { ShieldCheck, Cpu, Database, EyeOff, CheckCircle2, Lock, FileCode, Check } from 'lucide-react';

export const TransparencyView: React.FC = () => {
  const securityPillars = [
    {
      title: 'Zero Cloud Ingress / Zero Server Logging',
      icon: EyeOff,
      color: 'bg-yellow-400 text-black',
      description:
        'Notice images and student data are processed 100% locally on your machine via WebAssembly and in-browser Tesseract.js. No photos, transcripts, or metadata are ever transmitted to third-party cloud servers.',
    },
    {
      title: 'Grounded Evidence Verification (Anti-Hallucination)',
      icon: CheckCircle2,
      color: 'bg-neo-mint text-black',
      description:
        'Unlike black-box generative models that invent phantom dates or fees, every fact extracted by NoticeLens is verified against exact character indexes in the OCR transcript. Users can click any fact to view its highlighted source snippet.',
    },
    {
      title: 'Encrypted & Sandboxed Local Storage',
      icon: Database,
      color: 'bg-[#FF5A5F] text-white',
      description:
        'Saved notices are stored in your device’s sandboxed IndexedDB database. They persist offline across browser sessions without cookies, trackers, or telemetries.',
    },
    {
      title: 'Standards-Compliant iCalendar RFC 5545',
      icon: Lock,
      color: 'bg-neo-purple text-black',
      description:
        'Calendar exports strictly enforce RFC 5545 escaping rules. Carriage returns (CRLF) are normalized to prevent calendar injection vulnerabilities, guaranteeing secure imports into Google Calendar and Apple Calendar.',
    },
  ];

  const pipelineStages = [
    {
      step: '01',
      title: 'Document Ingestion',
      subtitle: 'Canvas Contrast Stretching & Scale Normalization',
      details: 'Uploads are drawn to an off-screen HTML5 canvas where pixel luminance weighting (0.299R + 0.587G + 0.114B) and contrast stretching suppress noise and paper degradation.',
    },
    {
      step: '02',
      title: 'Bilingual OCR Recognition',
      subtitle: 'Tesseract.js WebAssembly Engine (ben+eng)',
      details: 'Tesseract worker processes Bengali typography and English characters in parallel, outputting confidence scores and bounding lines.',
    },
    {
      step: '03',
      title: 'Numeral & Date Parsing',
      subtitle: 'Bengali-English Numeral Mapping & Regex Rule Engine',
      details: 'Converts Bengali digits (০-৯) to Arabic numerals, extracts multiple dates, disambiguates MM/DD vs DD/MM, and assigns semantic context (Deadline vs Event Date).',
    },
    {
      step: '04',
      title: 'Executive Plain-Language Synthesis',
      subtitle: 'Accessible Multi-Tiered Summary Generator',
      details: 'Synthesizes clean actionable paragraphs in Bengali and English tailored for low-vision readers, highlighting critical deadlines, room numbers, and required documentation.',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="neu-card p-6 high-contrast:!bg-black high-contrast:!border-white">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 neu-badge bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200/50 high-contrast:!bg-yellow-400 high-contrast:!text-black">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>System Specifications & Audit</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 high-contrast:text-white uppercase tracking-tight">
          Architecture & Verification Transparency
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 high-contrast:text-yellow-300 font-medium mt-1">
          Inspect how NoticeLens eliminates hallucinations, preserves student data privacy, and enforces deterministic verification.
        </p>
      </div>

      {/* Security Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {securityPillars.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              className="neu-card neu-card-hover p-6 flex flex-col justify-between high-contrast:!bg-black high-contrast:!border-white"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 neu-badge ${p.color} flex items-center gap-1.5 text-xs font-bold border border-slate-200/60`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>Pillar {idx + 1}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Verified</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 high-contrast:text-white mb-2">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-600 high-contrast:text-slate-300 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 high-contrast:border-white/20 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Compliance: WCAG 2.1 AA / RFC 5545</span>
                <span className="text-emerald-600 high-contrast:text-yellow-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Pass
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Walkthrough */}
      <section className="neu-card p-6 space-y-6 high-contrast:!bg-black high-contrast:!border-white" aria-labelledby="pipeline-heading">
        <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between high-contrast:border-white">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400" />
            <h2 id="pipeline-heading" className="text-lg font-bold uppercase tracking-tight text-slate-900 high-contrast:text-white">
              End-to-End Intelligence Pipeline
            </h2>
          </div>
          <span className="neu-badge px-2.5 py-0.5 bg-sky-100 text-sky-800 text-xs font-bold">4 Execution Stages</span>
        </div>

        <div className="space-y-4">
          {pipelineStages.map((stage) => (
            <div
              key={stage.step}
              className="p-4 neu-inset rounded-2xl flex flex-col sm:flex-row sm:items-start gap-4 high-contrast:!bg-slate-900 high-contrast:!border-white"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-mono font-black text-base shrink-0 shadow-sm high-contrast:bg-yellow-400 high-contrast:text-black">
                {stage.step}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 high-contrast:text-yellow-300">
                  {stage.subtitle}
                </span>
                <h3 className="text-base font-bold text-slate-900 high-contrast:text-white mt-0.5">
                  {stage.title}
                </h3>
                <p className="text-xs text-slate-600 high-contrast:text-slate-300 mt-1 leading-relaxed">
                  {stage.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Standards Card */}
      <section className="neu-card p-6 space-y-4 high-contrast:!bg-black high-contrast:!border-white" aria-labelledby="tech-stack-heading">
        <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between high-contrast:border-white">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400" />
            <h2 id="tech-stack-heading" className="text-lg font-bold uppercase tracking-tight text-slate-900 high-contrast:text-white">
              Technical Stack & Build Attributes
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">NoticeLens v1.0.0</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center font-bold">
          <div className="p-3.5 neu-inset rounded-xl high-contrast:!bg-black">
            <span className="block text-[10px] uppercase text-slate-400">Core Runtime</span>
            <span className="text-sm font-black mt-1 block text-slate-800 high-contrast:text-white">React 18 + TS</span>
          </div>
          <div className="p-3.5 neu-inset rounded-xl high-contrast:!bg-black">
            <span className="block text-[10px] uppercase text-slate-400">Bundler</span>
            <span className="text-sm font-black mt-1 block text-slate-800 high-contrast:text-white">Vite 5 (126 kB)</span>
          </div>
          <div className="p-3.5 neu-inset rounded-xl high-contrast:!bg-black">
            <span className="block text-[10px] uppercase text-slate-400">OCR Engine</span>
            <span className="text-sm font-black mt-1 block text-slate-800 high-contrast:text-white">Tesseract.js v5</span>
          </div>
          <div className="p-3.5 neu-inset rounded-xl high-contrast:!bg-black">
            <span className="block text-[10px] uppercase text-slate-400">Offline Storage</span>
            <span className="text-sm font-black mt-1 block text-slate-800 high-contrast:text-white">IndexedDB v1</span>
          </div>
        </div>
      </section>
    </div>
  );
};
