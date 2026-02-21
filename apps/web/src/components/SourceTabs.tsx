import { Tabs } from "@mantine/core";
import type { Source } from "@/schemas/base";

interface SourceTabsProps {
  availableSources: Array<{ value: Source; label: string }>;
  effectiveSource: Source;
  onSourceChange: (source: Source) => void;
}

export function SourceTabs({ availableSources, effectiveSource, onSourceChange }: SourceTabsProps) {
  return (
    <Tabs
      value={effectiveSource}
      onChange={(value) => value && onSourceChange(value as Source)}
      mb="xl"
    >
      <Tabs.List>
        {availableSources.map((opt) => (
          <Tabs.Tab key={opt.value} value={opt.value} fz="lg" py="sm">
            {opt.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}
