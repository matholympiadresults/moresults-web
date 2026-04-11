import { Tooltip, Text } from "@mantine/core";

interface RelativeRankCellProps {
  rank: number | null;
  total: number;
}

export function RelativeRankCell({ rank, total }: RelativeRankCellProps) {
  if (rank === null) return <>-</>;
  if (total === 0) return <>{rank}</>;

  const percentile = ((rank / total) * 100).toFixed(1);

  return (
    <Tooltip label={`Top ${percentile}%`} position="right" withArrow>
      <Text span style={{ cursor: "default", whiteSpace: "nowrap" }}>
        {rank}
        <Text span c="dimmed" size="sm">
          {"\u2009/\u2009"}
          {total}
        </Text>
      </Text>
    </Tooltip>
  );
}
