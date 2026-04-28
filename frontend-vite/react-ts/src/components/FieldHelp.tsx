import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Info } from 'lucide-react';
import { usePostHog } from '@posthog/react';
import type { HelpContent } from './columnMappingHelp';

interface FieldHelpProps extends HelpContent {
  fieldName: string;
}

export default function FieldHelp({ title, body, example, fieldName }: FieldHelpProps) {
  const posthog = usePostHog();

  return (
    <Popover className="relative inline-flex">
      <PopoverButton
        aria-label={`More information about ${fieldName.replace(/_/g, ' ')}`}
        onClick={() => posthog?.capture('column_mapping_help_opened', { field: fieldName })}
        className="inline-flex items-center justify-center p-0.5 rounded text-muted-foreground hover:text-primary data-[open]:text-primary transition-colors bg-transparent border-none cursor-pointer"
      >
        <Info className="w-3.5 h-3.5" />
      </PopoverButton>
      <PopoverPanel
        anchor="bottom start"
        className="z-50 w-64 bg-card border border-border rounded-[12px] shadow-lg p-4 mt-1"
      >
        <p className="text-xs font-semibold text-foreground mb-1.5">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
        {example && (
          <pre className="mt-2.5 text-[10px] font-heading bg-secondary/50 rounded-[8px] p-2 whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {example}
          </pre>
        )}
      </PopoverPanel>
    </Popover>
  );
}
