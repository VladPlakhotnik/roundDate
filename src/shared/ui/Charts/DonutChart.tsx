"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import styles from "./DonutChart.module.css";

export type DonutChartPoint = {
  color: string;
  count: number;
  label: string;
  percentage: number;
  source: string;
};

export type DonutChartPeriodOption = {
  label: string;
  value: string;
};

type DonutChartProps = {
  activePeriod?: string;
  data: DonutChartPoint[];
  description: string;
  emptyLabel: string;
  isLoading?: boolean;
  onPeriodChange?: (value: string) => void;
  periodOptions?: DonutChartPeriodOption[];
  title: string;
  total: number;
  totalLabel: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function DonutChart({
  activePeriod,
  data,
  description,
  emptyLabel,
  isLoading = false,
  onPeriodChange,
  periodOptions = [],
  title,
  total,
  totalLabel,
}: DonutChartProps) {
  const hasData = data.length > 0 && total > 0;

  return (
    <section
      aria-busy={isLoading}
      className={`${styles.card} ${isLoading ? styles.cardLoading : ""}`}
    >
      <header className={styles.header}>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {periodOptions.length > 0 ? (
          <div className={styles.controlsWrap}>
            <div className={styles.controls} role="group" aria-label={`Фильтр диаграммы: ${title}`}>
              {periodOptions.map((option) => (
                <button
                  aria-pressed={option.value === activePeriod}
                  className={option.value === activePeriod ? styles.controlActive : styles.control}
                  key={option.value}
                  onClick={() => onPeriodChange?.(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            {isLoading ? (
              <span className={styles.loadingIndicator} aria-hidden>
                <i />
                <i />
                <i />
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      {hasData ? (
        <div className={styles.content}>
          <div className={styles.chartWrap}>
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={data}
                  dataKey="count"
                  endAngle={-270}
                  innerRadius={70}
                  nameKey="label"
                  outerRadius={104}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={3}
                  startAngle={90}
                >
                  {data.map((item) => (
                    <Cell fill={item.color} key={item.source} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    borderRadius: 14,
                    boxShadow: "0 16px 36px rgba(15, 23, 42, 0.1)",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                  formatter={(value, name) => [formatNumber(Number(value)), name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.centerLabel} aria-hidden>
              <strong>{formatNumber(total)}</strong>
              <span>{totalLabel}</span>
            </div>
          </div>

          <ol className={styles.legend}>
            {data.map((item) => (
              <li key={item.source}>
                <span>
                  <i style={{ background: item.color }} />
                  {item.label}
                </span>
                <strong>{formatPercentage(item.percentage)}</strong>
                <em>{formatNumber(item.count)}</em>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className={styles.emptyState}>{emptyLabel}</div>
      )}
    </section>
  );
}
