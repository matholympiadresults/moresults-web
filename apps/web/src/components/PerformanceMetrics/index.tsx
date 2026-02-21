import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router";
import { Paper, Text, Group, Badge } from "@mantine/core";

export function PerformanceMetrics() {
  const location = useLocation();
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const navigationStart = useRef<number>(performance.now());
  const metricsRef = useRef<HTMLDivElement>(null);

  const checkIfLoaded = useCallback(() => {
    // Check for common loading indicators
    const hasLoader = document.querySelector(
      '[class*="Loader"], [class*="Skeleton"], [class*="loading"]'
    );
    const hasSpinner = document.querySelector('[role="progressbar"], [aria-busy="true"]');

    // Check for Mantine loader specifically
    const hasMantineLoader = document.querySelector(".mantine-Loader-root");

    return !hasLoader && !hasSpinner && !hasMantineLoader;
  }, []);

  useEffect(() => {
    // Mark navigation start time on route change
    navigationStart.current = performance.now();
    setRenderTime(null);

    let animationFrameId: number;
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 300; // 30 seconds max (100ms intervals)

    const checkComplete = () => {
      if (cancelled) return;
      attempts++;

      if (checkIfLoaded()) {
        // Double-check after a short delay to make sure it's stable
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          if (checkIfLoaded()) {
            const time = performance.now() - navigationStart.current;
            setRenderTime(time);
          } else {
            // Still loading, keep checking
            animationFrameId = requestAnimationFrame(() => {
              timeoutId = setTimeout(checkComplete, 100);
            });
          }
        }, 50);
      } else if (attempts < maxAttempts) {
        // Still loading, check again
        animationFrameId = requestAnimationFrame(() => {
          timeoutId = setTimeout(checkComplete, 100);
        });
      } else {
        // Timeout - mark current time
        const time = performance.now() - navigationStart.current;
        setRenderTime(time);
      }
    };

    // Start checking after initial render
    animationFrameId = requestAnimationFrame(() => {
      timeoutId = setTimeout(checkComplete, 50);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [location.pathname, checkIfLoaded]);

  if (!visible) return null;

  const getColor = (value: number | null) => {
    if (value === null) return "gray";
    if (value <= 200) return "green";
    if (value <= 500) return "yellow";
    return "red";
  };

  const formatMs = (value: number | null) => {
    if (value === null) return "...";
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}s`;
    }
    return `${Math.round(value)}ms`;
  };

  return (
    <Paper
      ref={metricsRef}
      shadow="md"
      p="xs"
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        opacity: 0.9,
      }}
      withBorder
    >
      <Group gap="xs">
        <Text size="xs" c="dimmed">
          {location.pathname}
        </Text>
        <Badge size="sm" color={getColor(renderTime)}>
          {formatMs(renderTime)}
        </Badge>
        <Text size="xs" c="dimmed" style={{ cursor: "pointer" }} onClick={() => setVisible(false)}>
          ✕
        </Text>
      </Group>
    </Paper>
  );
}
