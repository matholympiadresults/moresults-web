import { useMemo } from "react";
import {
  Container,
  Title,
  Text,
  Select,
  SimpleGrid,
  Paper,
  useMantineColorScheme,
} from "@mantine/core";
import { useSearchParams } from "react-router";
import {
  useCountries,
  useParticipations,
  useTeamParticipations,
  useCompetitions,
} from "@/hooks/api";
import { useEntityMap } from "@/hooks/useEntityMap";
import { useSourceSelection } from "@/hooks/useSourceSelection";
import { SourceTabs } from "@/components/SourceTabs";
import { SOURCE_OPTIONS } from "@/constants/filterOptions";
import {
  calculateStats,
  filterStatsBySource,
  calculateTeamRanks,
  getSharedAvailableSources,
  calculateTeamStats,
  filterTeamStatsBySource,
  calculateTeamRanksFromTeamParticipations,
} from "./calculateStats";
import { TeamSection } from "./TeamSection";
import { IndividualSection } from "./IndividualSection";

export function CountryComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { countries } = useCountries();
  const { participations } = useParticipations();
  const { teamParticipations } = useTeamParticipations();
  const { competitions } = useCompetitions();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const country1Code = searchParams.get("c1");
  const country2Code = searchParams.get("c2");

  const countryOptions = useMemo(
    () =>
      countries
        .filter((c) => c.code)
        .map((c) => ({ value: c.code.toLowerCase(), label: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [countries]
  );

  const competitionMap = useEntityMap(competitions);

  const country1 = useMemo(
    () => countries.find((c) => c.code.toLowerCase() === country1Code),
    [countries, country1Code]
  );

  const country2 = useMemo(
    () => countries.find((c) => c.code.toLowerCase() === country2Code),
    [countries, country2Code]
  );

  const stats1 = useMemo(
    () => (country1 ? calculateStats(participations, competitionMap, country1.id) : null),
    [participations, competitionMap, country1]
  );

  const stats2 = useMemo(
    () => (country2 ? calculateStats(participations, competitionMap, country2.id) : null),
    [participations, competitionMap, country2]
  );

  const teamStats1 = useMemo(
    () => (country1 ? calculateTeamStats(teamParticipations, competitionMap, country1.id) : null),
    [teamParticipations, competitionMap, country1]
  );

  const teamStats2 = useMemo(
    () => (country2 ? calculateTeamStats(teamParticipations, competitionMap, country2.id) : null),
    [teamParticipations, competitionMap, country2]
  );

  // Get sources where both countries have participated (intersection)
  const computedSources = useMemo(
    () => getSharedAvailableSources(stats1, stats2, SOURCE_OPTIONS, teamStats1, teamStats2),
    [stats1, stats2, teamStats1, teamStats2]
  );

  const { effectiveSource, setSelectedSource, isTeam, availableSources } = useSourceSelection({
    availableSources: computedSources,
  });

  // Calculate stats filtered by selected source
  const filteredStats1 = useMemo(
    () => filterStatsBySource(stats1, effectiveSource),
    [stats1, effectiveSource]
  );

  const filteredStats2 = useMemo(
    () => filterStatsBySource(stats2, effectiveSource),
    [stats2, effectiveSource]
  );

  const filteredTeamStats1 = useMemo(
    () => filterTeamStatsBySource(teamStats1, effectiveSource),
    [teamStats1, effectiveSource]
  );

  const filteredTeamStats2 = useMemo(
    () => filterTeamStatsBySource(teamStats2, effectiveSource),
    [teamStats2, effectiveSource]
  );

  // Calculate team ranks per competition
  const teamRanks = useMemo(
    () => calculateTeamRanks(participations, competitionMap),
    [participations, competitionMap]
  );

  const teamRanksFromTeam = useMemo(
    () => calculateTeamRanksFromTeamParticipations(teamParticipations, competitionMap),
    [teamParticipations, competitionMap]
  );

  // Filter stats by selected source and build chart data
  const chartData = useMemo(() => {
    if (!country1 || !country2) return [];

    if (isTeam) {
      if (!teamStats1 || !teamStats2) return [];
      const allYears = new Set<number>();
      teamStats1.byYearAndSource.forEach((_, key) => {
        const [year, source] = key.split("-");
        if (source === effectiveSource) allYears.add(parseInt(year));
      });
      teamStats2.byYearAndSource.forEach((_, key) => {
        const [year, source] = key.split("-");
        if (source === effectiveSource) allYears.add(parseInt(year));
      });

      return Array.from(allYears)
        .sort((a, b) => a - b)
        .map((year) => {
          const key = `${year}-${effectiveSource}`;
          const t1 = teamStats1.byYearAndSource.get(key);
          const t2 = teamStats2.byYearAndSource.get(key);
          const ranks = teamRanksFromTeam.get(key);

          return {
            year,
            [`${country1.name} Score`]: t1?.totalScore ?? null,
            [`${country2.name} Score`]: t2?.totalScore ?? null,
            [`${country1.name} Team Rank`]: ranks?.get(country1.id) ?? null,
            [`${country2.name} Team Rank`]: ranks?.get(country2.id) ?? null,
          };
        });
    }

    if (!stats1 || !stats2) return [];

    const allYears = new Set<number>();
    stats1.byYearAndSource.forEach((_, key) => {
      const [year, source] = key.split("-");
      if (source === effectiveSource) allYears.add(parseInt(year));
    });
    stats2.byYearAndSource.forEach((_, key) => {
      const [year, source] = key.split("-");
      if (source === effectiveSource) allYears.add(parseInt(year));
    });

    return Array.from(allYears)
      .sort((a, b) => a - b)
      .map((year) => {
        const key = `${year}-${effectiveSource}`;
        const s1 = stats1.byYearAndSource.get(key);
        const s2 = stats2.byYearAndSource.get(key);

        const s1Medals = s1 ? s1.gold + s1.silver + s1.bronze : 0;
        const s2Medals = s2 ? s2.gold + s2.silver + s2.bronze : 0;

        const ranks = teamRanks.get(key);
        const c1Rank = ranks?.get(country1.id) ?? null;
        const c2Rank = ranks?.get(country2.id) ?? null;

        return {
          year,
          [`${country1.name} Medals`]: s1Medals,
          [`${country2.name} Medals`]: s2Medals,
          [`${country1.name} Avg Score`]:
            s1 && s1.participants > 0
              ? parseFloat((s1.totalScore / s1.participants).toFixed(1))
              : null,
          [`${country2.name} Avg Score`]:
            s2 && s2.participants > 0
              ? parseFloat((s2.totalScore / s2.participants).toFixed(1))
              : null,
          [`${country1.name} Total Pts`]: s1?.totalScore ?? null,
          [`${country2.name} Total Pts`]: s2?.totalScore ?? null,
          [`${country1.name} Team Rank`]: c1Rank,
          [`${country2.name} Team Rank`]: c2Rank,
        };
      });
  }, [
    stats1,
    stats2,
    teamStats1,
    teamStats2,
    country1,
    country2,
    effectiveSource,
    teamRanks,
    teamRanksFromTeam,
    isTeam,
  ]);

  const handleCountry1Change = (value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("c1", value);
    } else {
      params.delete("c1");
    }
    setSearchParams(params);
  };

  const handleCountry2Change = (value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("c2", value);
    } else {
      params.delete("c2");
    }
    setSearchParams(params);
  };

  return (
    <Container size="lg">
      <Title>Compare Countries</Title>
      <Text c="dimmed" mb="lg">
        Compare olympiad performance between two countries
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="xl">
        <Select
          label="Country 1"
          placeholder="Select a country"
          searchable
          clearable
          data={countryOptions}
          value={country1Code}
          onChange={handleCountry1Change}
        />
        <Select
          label="Country 2"
          placeholder="Select a country"
          searchable
          clearable
          data={countryOptions}
          value={country2Code}
          onChange={handleCountry2Change}
        />
      </SimpleGrid>

      {country1 &&
        country2 &&
        (stats1 || teamStats1) &&
        (stats2 || teamStats2) &&
        availableSources.length > 0 && (
          <>
            <SourceTabs
              availableSources={availableSources}
              effectiveSource={effectiveSource}
              onSourceChange={setSelectedSource}
            />

            {isTeam ? (
              <TeamSection
                country1={country1}
                country2={country2}
                filteredTeamStats1={filteredTeamStats1}
                filteredTeamStats2={filteredTeamStats2}
                chartData={chartData}
                isDark={isDark}
              />
            ) : (
              <IndividualSection
                country1={country1}
                country2={country2}
                filteredStats1={filteredStats1}
                filteredStats2={filteredStats2}
                chartData={chartData}
                isDark={isDark}
              />
            )}
          </>
        )}

      {country1 &&
        country2 &&
        (stats1 || teamStats1) &&
        (stats2 || teamStats2) &&
        availableSources.length === 0 && (
          <Paper p="xl" withBorder>
            <Text c="dimmed" ta="center">
              No common competitions found between these countries
            </Text>
          </Paper>
        )}

      {(!country1 || !country2) && (
        <Paper p="xl" withBorder>
          <Text c="dimmed" ta="center">
            Select two countries above to compare their olympiad performance
          </Text>
        </Paper>
      )}
    </Container>
  );
}
