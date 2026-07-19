import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Tooltip as MantineTooltip } from "@mantine/core";
import { useNavigate } from "react-router";
import { ROUTES } from "@/constants/routes";
import { getAxisStyle, getTooltipContentStyle } from "@/utils/chartStyles";

const PEARSON_TOOLTIP =
  "Pearson correlation coefficient (−1 to +1). +1 = perfect positive linear relationship, 0 = no linear relationship, −1 = perfect negative.";

export function pearsonR(points: { x: number; y: number }[]): number | null {
  const n = points.length;
  if (n < 2) return null;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (den === 0) return null;
  return num / den;
}

export interface ScatterPoint {
  x: number;
  y: number;
  name: string;
  personId: string;
}

interface ComparisonScatterChartProps {
  data: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  isDark: boolean;
  valueSuffix?: string;
  xDomain?: [number, number];
  yDomain?: [number, number];
}

interface ScatterTooltipProps {
  active?: boolean;
  payload?: { payload: ScatterPoint }[];
  xLabel: string;
  yLabel: string;
  valueSuffix: string;
  isDark: boolean;
}

function ScatterTooltip({
  active,
  payload,
  xLabel,
  yLabel,
  valueSuffix,
  isDark,
}: ScatterTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const labelFill = isDark ? "#c1c2c5" : "#495057";
  const dimFill = isDark ? "#909296" : "#868e96";
  const formatValue = (v: number) => `${Number.isInteger(v) ? v : v.toFixed(1)}${valueSuffix}`;

  return (
    <div style={{ ...getTooltipContentStyle(isDark), fontSize: 12 }}>
      <div style={{ fontWeight: 600, color: labelFill, marginBottom: 4 }}>{point.name}</div>
      <div style={{ color: labelFill }}>
        {xLabel}: {formatValue(point.x)}
      </div>
      <div style={{ color: labelFill }}>
        {yLabel}: {formatValue(point.y)}
      </div>
      <div style={{ color: dimFill, marginTop: 4 }}>Click to view contestant</div>
    </div>
  );
}

export function ComparisonScatterChart({
  data,
  xLabel,
  yLabel,
  isDark,
  valueSuffix = "",
  xDomain,
  yDomain,
}: ComparisonScatterChartProps) {
  const navigate = useNavigate();
  const axisStyle = getAxisStyle(isDark);
  const labelFill = isDark ? "#c1c2c5" : "#495057";

  const xMax = xDomain?.[1] ?? (data.length > 0 ? Math.max(...data.map((p) => p.x)) : 0);
  const yMax = yDomain?.[1] ?? (data.length > 0 ? Math.max(...data.map((p) => p.y)) : 0);
  const xMin = xDomain?.[0] ?? 0;
  const yMin = yDomain?.[0] ?? 0;
  const lineStart = Math.max(xMin, yMin);
  const lineEnd = Math.min(xMax, yMax);

  const r = pearsonR(data);
  const correlationLabel = r === null ? null : `Pearson r = ${r.toFixed(2)}`;

  return (
    <div style={{ position: "relative" }}>
      {correlationLabel && (
        <MantineTooltip label={PEARSON_TOOLTIP} multiline w={260} withArrow position="left">
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 12,
              zIndex: 1,
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: "help",
              backgroundColor: isDark ? "rgba(37, 38, 43, 0.85)" : "rgba(255, 255, 255, 0.85)",
              color: labelFill,
              border: `1px solid ${isDark ? "#373a40" : "#dee2e6"}`,
            }}
          >
            {correlationLabel}
          </div>
        </MantineTooltip>
      )}
      <ResponsiveContainer width="100%" height={520}>
        <ScatterChart margin={{ top: 30, right: 50, left: 50, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            domain={xDomain}
            allowDataOverflow
            tickMargin={8}
            padding={{ left: 8, right: 8 }}
            label={{
              value: xLabel,
              position: "insideBottom",
              offset: -25,
              fill: labelFill,
            }}
            {...axisStyle}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            domain={yDomain}
            allowDataOverflow
            tickMargin={8}
            padding={{ top: 8, bottom: 8 }}
            label={{
              value: yLabel,
              angle: -90,
              position: "insideLeft",
              offset: 0,
              style: { textAnchor: "middle" },
              fill: labelFill,
            }}
            {...axisStyle}
          />
          <ReferenceLine
            ifOverflow="hidden"
            stroke={isDark ? "#5c5f66" : "#adb5bd"}
            strokeDasharray="4 4"
            segment={[
              { x: lineStart, y: lineStart },
              { x: lineEnd, y: lineEnd },
            ]}
          />
          <Tooltip
            isAnimationActive={false}
            cursor={{ strokeDasharray: "3 3" }}
            content={
              <ScatterTooltip
                xLabel={xLabel}
                yLabel={yLabel}
                valueSuffix={valueSuffix}
                isDark={isDark}
              />
            }
          />
          <Scatter
            data={data}
            fill="#228be6"
            isAnimationActive={false}
            cursor="pointer"
            onClick={(point: { personId?: string }) => {
              if (point?.personId) navigate(ROUTES.CONTESTANT(point.personId));
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
