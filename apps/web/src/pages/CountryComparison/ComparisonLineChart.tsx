import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getTooltipStyle, getAxisStyle } from "@/utils/chartStyles";

interface ComparisonLineChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData: Record<string, any>[];
  dataKey1: string;
  dataKey2: string;
  yAxisProps?: {
    reversed?: boolean;
    domain?: [number | string, number | string];
    allowDecimals?: boolean;
  };
  isDark: boolean;
}

export function ComparisonLineChart({
  chartData,
  dataKey1,
  dataKey2,
  yAxisProps,
  isDark,
}: ComparisonLineChartProps) {
  const tooltipStyle = getTooltipStyle(isDark);
  const axisStyle = getAxisStyle(isDark);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="year" {...axisStyle} />
        <YAxis {...axisStyle} {...yAxisProps} />
        <Tooltip {...tooltipStyle} />
        <Legend />
        <Line
          type="monotone"
          dataKey={dataKey1}
          stroke="#228be6"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey={dataKey2}
          stroke="#fa5252"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
