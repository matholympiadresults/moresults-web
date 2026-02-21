import { useMemo, useState } from "react";
import { Source, isTeamCompetition } from "@/schemas/base";

interface UseSourceSelectionOptions {
  availableSources: Array<{ value: Source; label: string }>;
}

export function useSourceSelection({ availableSources }: UseSourceSelectionOptions) {
  const [selectedSource, setSelectedSource] = useState<Source>(Source.IMO);

  const effectiveSource = useMemo(() => {
    if (availableSources.some((s) => s.value === selectedSource)) return selectedSource;
    return availableSources[0]?.value ?? Source.IMO;
  }, [availableSources, selectedSource]);

  const isTeam = isTeamCompetition(effectiveSource);

  return { selectedSource, setSelectedSource, effectiveSource, isTeam, availableSources };
}
