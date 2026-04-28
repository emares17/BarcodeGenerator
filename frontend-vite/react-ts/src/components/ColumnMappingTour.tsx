import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePostHog } from '@posthog/react';
import { X } from 'lucide-react';
import { BARCODE_COLUMN_HELP, TEXT_FIELDS_HELP, HEADER_ROW_HELP } from './columnMappingHelp';
import type { HelpContent } from './columnMappingHelp';

const TOUR_KEY = 'lgu_col_map_tour_v1';
const ALLOWED_ROUTES = ['/dashboard', '/upload'];

const steps: HelpContent[] = [
  {
    title: 'Quick note on Column Mapping',
    body: "Before you generate, make sure the column numbers below match your actual file. It takes 30 seconds and prevents mismatched labels.",
  },
  BARCODE_COLUMN_HELP,
  TEXT_FIELDS_HELP,
  {
    ...HEADER_ROW_HELP,
    body: HEADER_ROW_HELP.body + " That's it — you're ready to generate.",
  },
];

export default function ColumnMappingTour() {
  const location = useLocation();
  const posthog = usePostHog();

  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(TOUR_KEY); } catch { return false; }
  });
  const [step, setStep] = useState(0);
  const hasTrackedMount = useRef(false);

  useEffect(() => {
    if (hasTrackedMount.current) return;
    if (!visible || !ALLOWED_ROUTES.includes(location.pathname)) return;
    hasTrackedMount.current = true;
    posthog?.capture('column_mapping_tour_shown', { step: 0 });
  }, [visible, location.pathname, posthog]);

  if (!visible || !ALLOWED_ROUTES.includes(location.pathname)) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const dismiss = (completed: boolean) => {
    try { localStorage.setItem(TOUR_KEY, '1'); } catch {}
    posthog?.capture('column_mapping_tour_dismissed', { step, completed });
    setVisible(false);
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-card border border-border rounded-[16px] shadow-xl p-5 z-50">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-foreground pr-2">{current.title}</p>
        <button
          onClick={() => dismiss(false)}
          className="flex-shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{current.body}</p>

      {current.example && (
        <pre className="text-[10px] font-heading bg-secondary/50 rounded-[8px] p-2 whitespace-pre-wrap text-muted-foreground leading-relaxed mb-3">
          {current.example}
        </pre>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Tour progress">
          {steps.map((_, i) => (
            <span
              key={i}
              role="tab"
              aria-label={`Step ${i + 1} of ${steps.length}`}
              aria-current={i === step ? 'step' : undefined}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          {!isLast && (
            <button
              onClick={() => dismiss(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              Skip
            </button>
          )}
          <button
            onClick={() => isLast ? dismiss(true) : setStep(s => s + 1)}
            className="h-7 px-3 bg-primary text-primary-foreground font-heading text-xs font-medium rounded-full hover:bg-primary/90 transition-colors cursor-pointer border-none"
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
