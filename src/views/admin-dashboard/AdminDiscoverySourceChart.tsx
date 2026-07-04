"use client";

import { useEffect, useRef, useState } from "react";

import {
  DonutChart,
  type DonutChartPeriodOption,
  type DonutChartPoint,
} from "@/shared/ui/Charts/DonutChart";

type DiscoverySourcePeriod = "all" | "month" | "today" | "week";

type DiscoverySourceStats = {
  data: DonutChartPoint[];
  period: DiscoverySourcePeriod;
  total: number;
};

type AdminDiscoverySourceChartProps = {
  description: string;
  emptyLabel: string;
  initialData: DonutChartPoint[];
  initialPeriod: DiscoverySourcePeriod;
  initialTotal: number;
  periodOptions: Array<DonutChartPeriodOption & { value: DiscoverySourcePeriod }>;
  title: string;
  totalLabel: string;
};

async function loadDiscoverySources(period: DiscoverySourcePeriod) {
  const response = await fetch(
    `/api/admin/dashboard/discovery-sources?period=${encodeURIComponent(period)}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load discovery source stats");
  }

  return (await response.json()) as DiscoverySourceStats;
}

export function AdminDiscoverySourceChart({
  description,
  emptyLabel,
  initialData,
  initialPeriod,
  initialTotal,
  periodOptions,
  title,
  totalLabel,
}: AdminDiscoverySourceChartProps) {
  const requestIdRef = useRef(0);
  const [stats, setStats] = useState<DiscoverySourceStats>({
    data: initialData,
    period: initialPeriod,
    total: initialTotal,
  });
  const [pendingPeriod, setPendingPeriod] = useState<DiscoverySourcePeriod | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (!url.searchParams.has("sourcePeriod")) {
      return;
    }

    url.searchParams.delete("sourcePeriod");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  async function handlePeriodChange(value: string) {
    const period = value as DiscoverySourcePeriod;

    if (period === stats.period || pendingPeriod) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setPendingPeriod(period);

    try {
      const nextStats = await loadDiscoverySources(period);

      if (requestIdRef.current === requestId) {
        setStats(nextStats);
      }
    } catch (error) {
      console.error("Failed to refresh discovery source chart", error);
    } finally {
      if (requestIdRef.current === requestId) {
        setPendingPeriod(null);
      }
    }
  }

  return (
    <DonutChart
      activePeriod={pendingPeriod ?? stats.period}
      data={stats.data}
      description={description}
      emptyLabel={emptyLabel}
      isLoading={pendingPeriod !== null}
      periodOptions={periodOptions}
      title={title}
      total={stats.total}
      totalLabel={totalLabel}
      onPeriodChange={handlePeriodChange}
    />
  );
}
