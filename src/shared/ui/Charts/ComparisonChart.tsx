"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import styles from "./ComparisonChart.module.css";

export type ComparisonChartPoint = {
  label: string;
  [key: string]: number | string | undefined;
};

export type ComparisonChartSeries = {
  color: string;
  compareOnly?: boolean;
  dashed?: boolean;
  key: string;
  label: string;
  type: "bar" | "line";
};

type ComparisonChartProps = {
  comparisonLabel?: string;
  data: ComparisonChartPoint[];
  description: string;
  series: ComparisonChartSeries[];
  title: string;
  valueFormatter?: (value: number) => string;
};

function formatDefaultValue(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function ComparisonChart({
  comparisonLabel = "Сравнить с прошлым месяцем",
  data,
  description,
  series,
  title,
  valueFormatter = formatDefaultValue,
}: ComparisonChartProps) {
  const [isComparing, setIsComparing] = useState(false);
  const visibleSeries = useMemo(
    () => series.filter((item) => isComparing || !item.compareOnly),
    [isComparing, series],
  );

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className={styles.controls} aria-label={`Фильтр графика: ${title}`}>
          <button
            aria-pressed={!isComparing}
            className={!isComparing ? styles.controlActive : styles.control}
            onClick={() => setIsComparing(false)}
            type="button"
          >
            Месяц
          </button>
          <button
            aria-pressed={isComparing}
            className={isComparing ? styles.controlActive : styles.control}
            onClick={() => setIsComparing(true)}
            type="button"
          >
            Сравнить
          </button>
        </div>
      </header>

      <div className={styles.chart}>
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={data} margin={{ bottom: 0, left: -20, right: 8, top: 12 }}>
            <CartesianGrid stroke="#eef2f7" strokeDasharray="4 4" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              interval="preserveStartEnd"
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
              tickFormatter={(value) => valueFormatter(Number(value))}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                border: "1px solid rgba(15, 23, 42, 0.08)",
                borderRadius: 14,
                boxShadow: "0 16px 36px rgba(15, 23, 42, 0.1)",
                fontSize: 12,
                fontWeight: 800,
              }}
              formatter={(value, name) => [valueFormatter(Number(value)), name]}
              labelFormatter={(label) => `${label} число`}
            />
            {visibleSeries.map((item) =>
              item.type === "bar" ? (
                <Bar
                  dataKey={item.key}
                  fill={item.color}
                  key={item.key}
                  name={item.label}
                  radius={[8, 8, 0, 0]}
                />
              ) : (
                <Line
                  dataKey={item.key}
                  dot={false}
                  key={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={3}
                  type="monotone"
                  {...(item.dashed ? { strokeDasharray: "6 6" } : {})}
                />
              ),
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <footer className={styles.legend}>
        {visibleSeries.map((item) => (
          <span key={item.key}>
            <i style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </footer>

      <p className={styles.hint}>{isComparing ? comparisonLabel : "Показан текущий месяц."}</p>
    </section>
  );
}
