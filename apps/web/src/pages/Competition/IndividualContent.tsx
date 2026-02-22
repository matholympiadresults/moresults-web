import type { ChangeEvent } from "react";
import {
  Title,
  Text,
  Table,
  Group,
  TextInput,
  MultiSelect,
  Paper,
  Tabs,
  ScrollArea,
  SimpleGrid,
} from "@mantine/core";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { IconSearch } from "@tabler/icons-react";
import type { Table as TanstackTable } from "@tanstack/react-table";
import { getTableBody, getTableHead } from "@/utils/table";
import { getTooltipStyle, getAxisStyle } from "@/utils/chartStyles";
import { AWARD_OPTIONS } from "@/constants/filterOptions";

interface IndividualContentProps {
  scoreDistribution: {
    score: number;
    gold: number;
    silver: number;
    bronze: number;
    hm: number;
    none: number;
  }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: TanstackTable<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  countryTable: TanstackTable<any>;
  columnCount: number;
  countryColumnCount: number;
  countryOptions: { value: string; label: string }[];
  participationCount: number;
  countryRowCount: number;
  loading: boolean;
  error: Error | null;
  isDark: boolean;
  activeTab: string | null;
  setActiveTab: (tab: string | null) => void;
  handleSearch: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function IndividualContent({
  scoreDistribution,
  table,
  countryTable,
  columnCount,
  countryColumnCount,
  countryOptions,
  participationCount,
  countryRowCount,
  loading,
  error,
  isDark,
  activeTab,
  setActiveTab,
  handleSearch,
}: IndividualContentProps) {
  const tooltipStyle = getTooltipStyle(isDark);
  const axisStyle = getAxisStyle(isDark);

  return (
    <>
      {scoreDistribution.length > 0 && (
        <>
          <Title order={3} mt="lg" mb="sm">
            Score Distribution
          </Title>
          <Paper p="md" withBorder mb="xl">
            <SimpleGrid cols={{ base: 2, xs: 3, sm: 5 }} mb="sm">
              <Group gap="xs">
                <div
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: "#FFD700",
                    borderRadius: 2,
                  }}
                />
                <Text size="sm">Gold</Text>
              </Group>
              <Group gap="xs">
                <div
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: "#C0C0C0",
                    borderRadius: 2,
                  }}
                />
                <Text size="sm">Silver</Text>
              </Group>
              <Group gap="xs">
                <div
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: "#CD7F32",
                    borderRadius: 2,
                  }}
                />
                <Text size="sm">Bronze</Text>
              </Group>
              <Group gap="xs">
                <div
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: "#40c057",
                    borderRadius: 2,
                  }}
                />
                <Text size="sm">HM</Text>
              </Group>
              <Group gap="xs">
                <div
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: "#87CEEB",
                    borderRadius: 2,
                  }}
                />
                <Text size="sm">No award</Text>
              </Group>
            </SimpleGrid>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="score"
                  interval="equidistantPreserveStart"
                  minTickGap={1}
                  {...axisStyle}
                  label={{ value: "Points", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  {...axisStyle}
                  allowDecimals={false}
                  label={{ value: "Contestants", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      gold: "Gold",
                      silver: "Silver",
                      bronze: "Bronze",
                      hm: "HM",
                      none: "No award",
                    };
                    return [value, labels[name as string] || name];
                  }}
                  labelFormatter={(score) => `Score: ${score}`}
                />
                <Bar dataKey="none" stackId="a" fill="#87CEEB" />
                <Bar dataKey="hm" stackId="a" fill="#40c057" />
                <Bar dataKey="bronze" stackId="a" fill="#CD7F32" />
                <Bar dataKey="silver" stackId="a" fill="#C0C0C0" />
                <Bar dataKey="gold" stackId="a" fill="#FFD700" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}

      <Title order={3} mt="lg" mb="sm">
        Results
      </Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="individual">Individual ({participationCount})</Tabs.Tab>
          <Tabs.Tab value="country">Country ({countryRowCount})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="individual">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mb="md">
            <TextInput
              placeholder="Search by name..."
              leftSection={<IconSearch size={16} />}
              value={(table.getColumn("personName")?.getFilterValue() as string) ?? ""}
              onChange={handleSearch}
            />
            <MultiSelect
              placeholder="Filter by country"
              searchable
              clearable
              data={countryOptions}
              value={(table.getColumn("countryId")?.getFilterValue() as string[]) ?? []}
              onChange={(value) => {
                table.getColumn("countryId")?.setFilterValue(value);
              }}
            />
            <MultiSelect
              placeholder="Filter by award"
              clearable
              data={AWARD_OPTIONS}
              value={(table.getColumn("award")?.getFilterValue() as string[]) ?? []}
              onChange={(value) => {
                table.getColumn("award")?.setFilterValue(value);
              }}
            />
          </SimpleGrid>

          <Text size="sm" c="dimmed" mb="md">
            {table.getFilteredRowModel().rows.length} of {participationCount} contestants
          </Text>

          <ScrollArea>
            <Table striped highlightOnHover miw={800}>
              <Table.Thead>{getTableHead(table.getHeaderGroups())}</Table.Thead>
              <Table.Tbody>
                {getTableBody({
                  isLoading: loading,
                  error,
                  tableRows: table.getRowModel().rows,
                  columnCount,
                  noDataMessage: "No contestants found",
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="country">
          <Text size="sm" c="dimmed" mb="md">
            {countryRowCount} countries
          </Text>

          <ScrollArea>
            <Table striped highlightOnHover miw={900}>
              <Table.Thead>{getTableHead(countryTable.getHeaderGroups())}</Table.Thead>
              <Table.Tbody>
                {getTableBody({
                  isLoading: loading,
                  error,
                  tableRows: countryTable.getRowModel().rows,
                  columnCount: countryColumnCount,
                  noDataMessage: "No countries found",
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
