import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Types ──

type ChartType = 'bar' | 'hbar' | 'line' | 'area' | 'pie' | 'doughnut' | 'radar' | 'polar' | 'wordcloud' | 'funnel' | 'graph' | 'gantt';
type LegendPos = 'top' | 'bottom' | 'left' | 'right' | 'none';

interface ChartOpts {
  showTitle: boolean;
  titleText: string;
  legendPos: LegendPos;
  showValues: boolean;
  showPercent: boolean;
  showGrid: boolean;
  animation: boolean;
}

// ── Chart Type Configs ──

const CHART_TYPES: { id: ChartType; labelKey: string; icon: string }[] = [
  { id: 'bar', labelKey: 'bar', icon: '▊' },
  { id: 'hbar', labelKey: 'hbar', icon: '▐' },
  { id: 'line', labelKey: 'line', icon: '╱' },
  { id: 'area', labelKey: 'area', icon: '▓' },
  { id: 'pie', labelKey: 'pie', icon: '◕' },
  { id: 'doughnut', labelKey: 'doughnut', icon: '◎' },
  { id: 'radar', labelKey: 'radar', icon: '⬡' },
  { id: 'polar', labelKey: 'polar', icon: '✿' },
  { id: 'funnel', labelKey: 'funnel', icon: '▽' },
  { id: 'wordcloud', labelKey: 'wordcloud', icon: '☁' },
  { id: 'graph', labelKey: 'graph', icon: '◈' },
  { id: 'gantt', labelKey: 'gantt', icon: '▬' },
];

// ── Themes ──

interface ChartTheme {
  id: string;
  nameKey: string;
  colors: string[];
  bg: string;
  text: string;
  subtext: string;
  grid: string;
  axis: string;
}

const THEMES: ChartTheme[] = [
  { id: 'material', nameKey: 'themeMaterial', bg: '#ffffff', text: '#1f2937', subtext: '#6b7280', grid: '#e5e7eb', axis: '#9ca3af', colors: ['#4F86F7', '#36CFC9', '#FAAD14', '#F5222D', '#722ED1', '#13C2C2', '#FA8C16', '#2F54EB'] },
  { id: 'vibrant', nameKey: 'themeVibrant', bg: '#ffffff', text: '#1f2937', subtext: '#6b7280', grid: '#e5e7eb', axis: '#9ca3af', colors: ['#FF4D4F', '#52C41A', '#1890FF', '#FAAD14', '#EB2F96', '#13C2C2', '#722ED1', '#FA541C'] },
  { id: 'pastel', nameKey: 'themePastel', bg: '#fdfdff', text: '#52525b', subtext: '#a1a1aa', grid: '#f0f0f5', axis: '#d4d4d8', colors: ['#93C5FD', '#86EFAC', '#FDE68A', '#FCA5A5', '#D8B4FE', '#A5F3FC', '#FBCFE8', '#FED7AA'] },
  { id: 'aurora', nameKey: 'themeAurora', bg: '#fafbff', text: '#1e293b', subtext: '#64748b', grid: '#e8eaf0', axis: '#94a3b8', colors: ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'] },
  { id: 'nord', nameKey: 'themeNord', bg: '#f8f9fc', text: '#2e3440', subtext: '#616e88', grid: '#e5e9f0', axis: '#a3b1c5', colors: ['#5E81AC', '#88C0D0', '#81A1C1', '#8FBCBB', '#A3BE8C', '#EBCB8B', '#D08770', '#B48EAD'] },
  { id: 'sunset', nameKey: 'themeSunset', bg: '#fffcf8', text: '#292524', subtext: '#78716c', grid: '#f5ebe0', axis: '#c8b8a8', colors: ['#F97316', '#EF4444', '#E11D48', '#C026D3', '#7C3AED', '#2563EB', '#0891B2', '#059669'] },
  { id: 'ocean', nameKey: 'themeOcean', bg: '#f5f9ff', text: '#1e3a5f', subtext: '#6b8ab0', grid: '#dbeafe', axis: '#93b4d4', colors: ['#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#0EA5E9', '#06B6D4', '#0E7490'] },
  { id: 'neon', nameKey: 'themeNeon', bg: '#0c0c1d', text: '#e2e8f0', subtext: '#94a3b8', grid: '#1e1e3a', axis: '#3b3b5c', colors: ['#00E5A0', '#FF3860', '#FFD600', '#3B82F6', '#A855F7', '#F97316', '#06B6D4', '#EC4899'] },
];

// ── Sample Data ──

function getSampleData(chartType: ChartType): string[][] {
  switch (chartType) {
    case 'hbar':
      return [['Language', '2024', '2025'], ['JavaScript', '2800', '3100'], ['Python', '2400', '2900'], ['Java', '1900', '1700'], ['TypeScript', '1500', '2000'], ['Go', '900', '1200']];
    case 'pie': case 'doughnut':
      return [['Category', 'Value'], ['Chrome', '65'], ['Firefox', '15'], ['Safari', '10'], ['Edge', '7'], ['Other', '3']];
    case 'polar':
      return [['Activity', 'Hours'], ['Running', '80'], ['Swimming', '25'], ['Cycling', '60'], ['Yoga', '15'], ['Walking', '45']];
    case 'radar':
      return [['Skill', 'Team A', 'Team B'], ['Speed', '85', '70'], ['Power', '90', '80'], ['Stamina', '75', '85'], ['Technique', '88', '65'], ['Strategy', '70', '90']];
    case 'funnel':
      return [['Stage', 'Count'], ['Visit', '5000'], ['Inquiry', '3500'], ['Order', '2000'], ['Click', '1200'], ['Purchase', '600']];
    case 'wordcloud':
      return [['Word', 'Weight'], ['JavaScript', '100'], ['TypeScript', '85'], ['React', '80'], ['Vue', '65'], ['Node.js', '75'], ['Python', '70'], ['Docker', '55'], ['Kubernetes', '50'], ['GraphQL', '45'], ['Rust', '40'], ['Go', '60'], ['ECharts', '35'], ['CSS', '55'], ['HTML', '50'], ['Git', '65']];
    case 'graph':
      return [['Source', 'Target', 'Weight'], ['A', 'B', '5'], ['A', 'C', '3'], ['B', 'D', '4'], ['C', 'D', '2'], ['C', 'E', '6'], ['D', 'F', '3'], ['E', 'F', '4'], ['B', 'E', '2']];
    case 'gantt':
      return [['Task', 'Start', 'Duration'], ['Design', '2026-01-01', '14'], ['Frontend', '2026-01-10', '21'], ['Backend', '2026-01-15', '18'], ['Testing', '2026-02-01', '12'], ['Deploy', '2026-02-10', '5']];
    default:
      return [['Month', 'Sales', 'Profit', 'Expenses'], ['Jan', '120', '45', '75'], ['Feb', '190', '68', '122'], ['Mar', '150', '55', '95'], ['Apr', '220', '82', '138'], ['May', '180', '65', '115'], ['Jun', '250', '95', '155']];
  }
}

// ── Helpers ──

function parseCsv(text: string): string[][] {
  return text.trim().split('\n').map((line) => {
    if (line.includes('\t')) return line.split('\t').map((c) => c.trim());
    return line.split(',').map((c) => c.trim());
  }).filter((row) => row.some((c) => c !== ''));
}

function toCsv(table: string[][]): string {
  return table.map((row) => row.join(',')).join('\n');
}

const isArcType = (t: ChartType) => ['pie', 'doughnut', 'polar'].includes(t);
const isLineType = (t: ChartType) => t === 'line' || t === 'area';
const noAxis = (t: ChartType) => ['pie', 'doughnut', 'polar', 'radar', 'wordcloud', 'funnel', 'graph', 'gantt'].includes(t);

// ── Build ECharts Option ──

function buildOption(chartType: ChartType, table: string[][], theme: ChartTheme, opts: ChartOpts): echarts.EChartsOption {
  if (table.length < 2) return {};

  const headers = table[0];
  const rows = table.slice(1);
  const labels = rows.map((r) => r[0] || '');

  // Title
  const title: echarts.TitleComponentOption | undefined = opts.showTitle && opts.titleText
    ? { text: opts.titleText, left: 'center', top: 4, textStyle: { color: theme.text, fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter, system-ui, sans-serif' } }
    : undefined;

  // Legend
  const legendPosMap: Record<string, string> = { top: 'top', bottom: 'bottom', left: 'left', right: 'right' };
  const legend: echarts.LegendComponentOption | undefined = opts.legendPos !== 'none'
    ? { show: true, [opts.legendPos]: opts.showTitle ? 36 : 14, textStyle: { color: theme.text, fontSize: 12 }, itemGap: 14 }
    : { show: false };

  // Common tooltip
  const tooltip: echarts.TooltipComponentOption = {
    trigger: isArcType(chartType) ? 'item' : 'axis',
    backgroundColor: theme.id === 'neon' ? '#1e1e3a' : '#ffffff',
    borderColor: theme.id === 'neon' ? '#3b3b5c' : '#e5e7eb',
    textStyle: { color: theme.id === 'neon' ? '#e2e8f0' : '#1f2937' },
    confine: true,
  };

  // Arc charts (pie, doughnut, polar)
  if (isArcType(chartType)) {
    const data = rows.map((r) => ({ name: r[0] || '', value: parseFloat(r[1]) || 0 }));
    const total = data.reduce((s, d) => s + d.value, 0);

    if (chartType === 'pie' || chartType === 'doughnut') {
      return {
        title,
        tooltip: { ...tooltip, trigger: 'item' },
        legend: opts.legendPos !== 'none' ? { ...legend, [opts.legendPos]: opts.showTitle ? 36 : 14 } : { show: false },
        color: theme.colors,
        animation: opts.animation,
        series: [{
          type: 'pie',
          radius: chartType === 'doughnut' ? ['40%', '65%'] : '65%',
          center: ['50%', '65%'],
          data,
          label: {
            show: opts.showValues || opts.showPercent,
            formatter: (params: any) => {
              const parts: string[] = [];
              if (opts.showValues) parts.push(`${params.value}`);
              if (opts.showPercent) parts.push(`${((params.value / total) * 100).toFixed(1)}%`);
              return parts.join(' · ');
            },
            color: theme.id === 'neon' ? '#cbd5e1' : theme.text,
            fontSize: 12,
            fontWeight: 'bold',
          },
          labelLine: { show: opts.showValues || opts.showPercent, lineStyle: { color: theme.subtext } },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
        }],
      };
    }

    // Polar (rose chart)
    return {
      title,
      tooltip: { ...tooltip, trigger: 'item' },
      legend: opts.legendPos !== 'none' ? { ...legend, [opts.legendPos]: opts.showTitle ? 36 : 14 } : { show: false },
      color: theme.colors,
      animation: opts.animation,
      polar: { radius: ['10%', '70%'] },
      angleAxis: {
        max: Math.max(...data.map((d) => d.value)) * 1.2,
        show: true,
        axisLine: { lineStyle: { color: theme.grid } },
        axisTick: { show: true, lineStyle: { color: theme.grid } },
        axisLabel: { show: false },
        splitLine: { lineStyle: { color: theme.grid } },
      },
      radiusAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLine: { show: true, lineStyle: { color: theme.grid } },
        axisTick: { show: true, lineStyle: { color: theme.grid } },
        axisLabel: { color: theme.text, fontSize: 12 },
        splitLine: { show: true, lineStyle: { color: theme.grid } },
      },
      series: [{
        type: 'bar',
        data: data.map((d, i) => ({ value: d.value, itemStyle: { color: theme.colors[i % theme.colors.length] } })),
        coordinateSystem: 'polar',
        label: {
          show: opts.showValues,
          position: 'insideEnd',
          rotate: 0,
          formatter: '{c}',
          color: '#fff',
          fontSize: 11,
          fontWeight: 'bold',
          textShadowColor: 'rgba(0,0,0,0.6)',
          textShadowBlur: 4,
          textBorderColor: 'rgba(0,0,0,0.3)',
          textBorderWidth: 1,
        },
      }],
    };
  }

  // Radar chart
  if (chartType === 'radar') {
    const datasets = headers.slice(1);
    const indicator = labels.map((l) => ({ name: l, max: 100 }));
    const seriesData = datasets.map((name, di) => ({
      name,
      value: rows.map((r) => parseFloat(r[di + 1]) || 0),
      areaStyle: { opacity: 0.15 },
      lineStyle: { width: 2 },
      symbol: 'circle',
      symbolSize: 6,
    }));

    return {
      title,
      tooltip: { ...tooltip, trigger: 'item' },
      legend: opts.legendPos !== 'none' ? { ...legend, [opts.legendPos]: opts.showTitle ? 36 : 14 } : { show: false },
      color: theme.colors,
      animation: opts.animation,
      radar: {
        indicator,
        shape: 'polygon',
        center: ['50%', opts.showTitle ? '62%' : '55%'],
        radius: '65%',
        axisName: { color: theme.text, fontSize: 12 },
        splitArea: { areaStyle: { color: [theme.bg, theme.bg] } },
        splitLine: { lineStyle: { color: theme.grid } },
        axisLine: { lineStyle: { color: theme.grid } },
      },
      series: [{
        type: 'radar',
        data: seriesData,
        label: {
          show: opts.showValues,
          color: theme.id === 'neon' ? '#cbd5e1' : theme.text,
          fontSize: 11,
          fontWeight: 'bold',
          formatter: (params: any) => String(params.value),
        },
      }],
    };
  }

  // Funnel chart
  if (chartType === 'funnel') {
    const data = rows.map((r) => ({ name: r[0] || '', value: parseFloat(r[1]) || 0 }));
    return {
      title,
      tooltip: { ...tooltip, trigger: 'item' },
      legend: opts.legendPos !== 'none' ? { ...legend, [opts.legendPos]: opts.showTitle ? 36 : 14 } : { show: false },
      color: theme.colors,
      animation: opts.animation,
      series: [{
        type: 'funnel',
        left: '10%', top: opts.showTitle ? 60 : 30, bottom: 20, width: '80%',
        min: 0, max: Math.max(...data.map((d) => d.value)),
        minSize: '10%', maxSize: '100%',
        sort: 'descending',
        gap: 4,
        data,
        label: {
          show: opts.showValues,
          position: 'inside',
          formatter: '{b}: {c}',
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
        },
        itemStyle: { borderColor: theme.bg, borderWidth: 1 },
      }],
    };
  }

  // Word Cloud
  if (chartType === 'wordcloud') {
    const data = rows.map((r, i) => ({ name: r[0] || '', value: parseFloat(r[1]) || 0, textStyle: { color: theme.colors[i % theme.colors.length] } }));
    return {
      title,
      tooltip: { trigger: 'item' },
      series: [{
        type: 'wordCloud',
        left: 'center', top: opts.showTitle ? 50 : 20, width: '90%', height: '75%',
        sizeRange: [14, 60],
        rotationRange: [-30, 30],
        rotationStep: 15,
        gridSize: 8,
        drawOutOfBound: false,
        layoutAnimation: opts.animation,
        data,
        textStyle: { fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 'bold' },
        emphasis: { textStyle: { textShadowBlur: 8, textShadowColor: 'rgba(0,0,0,0.2)' } },
      }],
    };
  }

  // Graph (relationship diagram)
  if (chartType === 'graph') {
    // Collect unique nodes from source/target columns
    const nodeSet = new Set<string>();
    rows.forEach((r) => { if (r[0]) nodeSet.add(r[0]); if (r[1]) nodeSet.add(r[1]); });
    const nodes = Array.from(nodeSet).map((name, i) => ({
      name,
      symbolSize: 30 + (rows.filter((r) => r[0] === name || r[1] === name).length * 6),
      itemStyle: { color: theme.colors[i % theme.colors.length] },
    }));
    const links = rows.filter((r) => r[0] && r[1]).map((r) => ({ source: r[0], target: r[1], value: parseFloat(r[2]) || 1 }));

    return {
      title,
      tooltip: { trigger: 'item' },
      legend: opts.legendPos !== 'none' ? { ...legend, [opts.legendPos]: opts.showTitle ? 36 : 14 } : { show: false },
      color: theme.colors,
      animation: opts.animation,
      series: [{
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        data: nodes,
        links,
        force: { repulsion: 200, gravity: 0.1, edgeLength: [80, 160] },
        label: {
          show: true,
          color: theme.id === 'neon' ? '#e2e8f0' : theme.text,
          fontSize: 12,
          fontWeight: 'bold',
        },
        lineStyle: { color: theme.subtext, width: 1.5, curveness: 0.15 },
        emphasis: { focus: 'adjacency', lineStyle: { width: 3 } },
      }],
    };
  }

  // Gantt chart (stacked horizontal bars: invisible offset + visible duration)
  if (chartType === 'gantt') {
    const tasks = rows.map((r) => r[0] || '');
    const startDates = rows.map((r) => r[1] || '');
    const durations = rows.map((r) => parseFloat(r[2]) || 0);
    const startTimes = startDates.map((d) => new Date(d).getTime());
    const validStarts = startTimes.filter((t) => !isNaN(t));
    const minTime = validStarts.length ? Math.min(...validStarts) : Date.now();
    const dayMs = 86400000;
    const offsets = startTimes.map((st) => Math.max(0, (st - minTime) / dayMs));
    const totalDays = Math.max(...offsets.map((o, i) => o + durations[i])) + 3;

    return {
      title,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = (Array.isArray(params) ? params : [params]).find((x: any) => x.seriesName === 'Duration');
          if (!p) return '';
          const taskIdx = p.dataIndex;
          const start = new Date(minTime + offsets[taskIdx] * dayMs);
          const end = new Date(minTime + (offsets[taskIdx] + durations[taskIdx]) * dayMs);
          const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return `<b>${tasks[taskIdx]}</b><br/>${fmt(start)} → ${fmt(end)}<br/>${durations[taskIdx]} days`;
        },
      },
      grid: { top: opts.showTitle ? 60 : 30, bottom: 30, left: 100, right: 40 },
      xAxis: {
        type: 'value',
        min: 0,
        max: totalDays,
        axisLabel: {
          color: theme.subtext,
          formatter: (v: number) => {
            const d = new Date(minTime + v * dayMs);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          },
        },
        splitLine: { show: opts.showGrid, lineStyle: { color: theme.grid } },
        axisLine: { lineStyle: { color: theme.axis } },
      },
      yAxis: {
        type: 'category',
        data: tasks,
        axisLabel: { color: theme.text, fontSize: 12 },
        axisLine: { lineStyle: { color: theme.axis } },
        axisTick: { show: false },
        inverse: true,
      },
      series: [
        {
          name: 'Offset',
          type: 'bar',
          stack: 'gantt',
          data: offsets,
          itemStyle: { color: 'transparent' },
          barWidth: '50%',
          emphasis: { itemStyle: { color: 'transparent' } },
        },
        {
          name: 'Duration',
          type: 'bar',
          stack: 'gantt',
          data: durations.map((d, i) => ({
            value: d,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: theme.colors[i % theme.colors.length] + 'cc' },
                { offset: 1, color: theme.colors[i % theme.colors.length] },
              ]),
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: '50%',
          label: {
            show: opts.showValues,
            position: 'right',
            formatter: (params: any) => `${params.value}d`,
            color: theme.id === 'neon' ? '#cbd5e1' : theme.text,
            fontSize: 11,
            fontWeight: 'bold',
          },
        },
      ],
    };
  }

  // Bar, H-Bar, Line, Area
  const isHorizontal = chartType === 'hbar';
  const datasets = headers.slice(1);

  const series: echarts.SeriesOption[] = datasets.map((name, di) => {
    const color = theme.colors[di % theme.colors.length];
    const isLine = isLineType(chartType);
    const singleSeries = datasets.length === 1;
    const barData = rows.map((r, ri) => {
      const val = parseFloat(r[di + 1]) || 0;
      if (!isLine && singleSeries) {
        return { value: val, itemStyle: { color: theme.colors[ri % theme.colors.length] } };
      }
      return val;
    });
    const base: echarts.SeriesOption = {
      name,
      data: barData,
      type: isLine ? 'line' : 'bar',
      itemStyle: { color, borderRadius: isLine ? 0 : (isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]) },
      label: {
        show: opts.showValues,
        position: isHorizontal ? 'right' : (isLine ? 'top' : 'top'),
        distance: isHorizontal ? 5 : 0,
        color: theme.id === 'neon' ? '#cbd5e1' : theme.text,
        fontSize: 11,
        fontWeight: 'bold',
      },
    };
    if (isLine) {
      (base as any).smooth = true;
      (base as any).symbolSize = 6;
      (base as any).lineStyle = { width: 2 };
      if (chartType === 'area') {
        (base as any).areaStyle = { opacity: 0.2, color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '88' },
          { offset: 1, color: color + '11' },
        ]) };
      }
    }
    return base;
  });

  return {
    title,
    tooltip,
    legend: opts.legendPos !== 'none' ? { ...legend, [opts.legendPos]: opts.showTitle ? 36 : 14 } : { show: false },
    color: theme.colors,
    animation: opts.animation,
    grid: {
      top: opts.showTitle ? 95 : 56,
      bottom: 40,
      left: 50,
      right: 24,
      containLabel: true,
    },
    xAxis: isHorizontal
      ? { type: 'value', splitLine: { show: opts.showGrid, lineStyle: { color: theme.grid } }, axisLine: { lineStyle: { color: theme.axis } }, axisLabel: { color: theme.subtext } }
      : { type: 'category', data: labels, axisLine: { lineStyle: { color: theme.axis } }, axisLabel: { color: theme.subtext }, axisTick: { lineStyle: { color: theme.grid } } },
    yAxis: isHorizontal
      ? { type: 'category', data: labels, axisLine: { lineStyle: { color: theme.axis } }, axisLabel: { color: theme.subtext }, axisTick: { lineStyle: { color: theme.grid } } }
      : { type: 'value', splitLine: { show: opts.showGrid, lineStyle: { color: theme.grid } }, axisLine: { lineStyle: { color: theme.axis } }, axisLabel: { color: theme.subtext } },
    series,
  };
}

// ── Main Component ──

export default function ChartGenerator() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('chart');
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  const [chartType, setChartType] = useState<ChartType>('bar');
  const [themeId, setThemeId] = useState('material');
  const [table, setTable] = useState<string[][]>(getSampleData('bar'));
  const [csvMode, setCsvMode] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [options, setOptions] = useState<ChartOpts>({
    showTitle: true, titleText: 'My Chart', legendPos: 'top',
    showValues: true, showPercent: false, showGrid: true, animation: true,
  });

  useCleanup(() => { instanceRef.current?.dispose(); });

  const theme = useMemo(() => THEMES.find((t) => t.id === themeId) || THEMES[0], [themeId]);

  // Init ECharts
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });
    instanceRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(chartRef.current);
    return () => { ro.disconnect(); chart.dispose(); };
  }, []);

  // Update chart when data/options/theme change
  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart) return;
    const opt = buildOption(chartType, table, theme, options);
    chart.setOption(opt, { notMerge: true });
  }, [chartType, table, theme, options]);

  const switchChartType = useCallback((ct: ChartType) => {
    setChartType(ct);
    setTable(getSampleData(ct));
  }, []);

  // Table editing
  const updateCell = (r: number, c: number, val: string) => {
    setTable((prev) => prev.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? val : cell) : row));
  };
  const addRow = () => setTable((prev) => [...prev, prev[0].map(() => '')]);
  const removeRow = (idx: number) => { if (table.length > 2) setTable((prev) => prev.filter((_, i) => i !== idx)); };
  const addCol = () => setTable((prev) => prev.map((row, i) => [...row, i === 0 ? `Series ${row.length}` : '0']));
  const removeCol = (idx: number) => { if (table[0].length > 2) setTable((prev) => prev.map((row) => row.filter((_, i) => i !== idx))); };

  const toggleCsv = () => {
    if (!csvMode) { setCsvText(toCsv(table)); setCsvMode(true); }
    else { const parsed = parseCsv(csvText); if (parsed.length >= 2 && parsed[0].length >= 2) setTable(parsed); setCsvMode(false); }
  };

  // Export PNG
  const downloadPng = useCallback(() => {
    const chart = instanceRef.current;
    if (!chart) return;
    const url = chart.getDataURL({ type: 'png', pixelRatio: 3, backgroundColor: theme.bg });
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart.png';
    a.click();
  }, [theme.bg]);

  const showPercentToggle = isArcType(chartType);

  return (
    <ToolShell title={name} description={desc} headerRight={<button className="btn" onClick={downloadPng}>{ui.downloadPng}</button>}>
      <div className="chart-layout">
        {/* ── Left: Controls ── */}
        <div className="chart-controls">
          <div className="chart-section">
            <label className="chart-section-label">{ui.chartType}</label>
            <div className="chart-type-grid">
              {CHART_TYPES.map((ct) => (
                <button key={ct.id} className={`chart-type-btn${chartType === ct.id ? ' chart-type-active' : ''}`} onClick={() => switchChartType(ct.id)} title={ui[ct.labelKey]}>
                  <span className="chart-type-icon">{ct.icon}</span>
                  <span className="chart-type-label">{ui[ct.labelKey]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <label className="chart-section-label">{ui.theme}</label>
            <div className="chart-theme-grid">
              {THEMES.map((th) => (
                <button key={th.id} className={`chart-theme-btn${themeId === th.id ? ' chart-theme-active' : ''}`} onClick={() => setThemeId(th.id)} title={ui[th.nameKey]} style={{ background: th.bg, borderColor: themeId === th.id ? th.colors[0] : 'var(--border)' }}>
                  <div className="chart-theme-swatches">{th.colors.slice(0, 5).map((c, i) => <span key={i} className="chart-theme-swatch" style={{ background: c }} />)}</div>
                  <span className="chart-theme-name" style={{ color: th.text }}>{ui[th.nameKey]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <label className="chart-section-label">{t('common.settings')}</label>
            <div className="chart-options-grid">
              <div className="chart-opt-row">
                <label className="chart-opt-label">{ui.title}</label>
                <div className="chart-opt-inline">
                  <input type="checkbox" checked={options.showTitle} onChange={(e) => setOptions((o) => ({ ...o, showTitle: e.target.checked }))} />
                  <input className="input-field" value={options.titleText} onChange={(e) => setOptions((o) => ({ ...o, titleText: e.target.value }))} disabled={!options.showTitle} style={{ flex: 1 }} />
                </div>
              </div>
              <div className="chart-opt-row">
                <label className="chart-opt-label">{ui.legend}</label>
                <div className="chart-opt-btns">
                  {(['top', 'bottom', 'left', 'right', 'none'] as LegendPos[]).map((pos) => (
                    <button key={pos} className={`panel-btn panel-btn-sm${options.legendPos === pos ? ' accent' : ''}`} onClick={() => setOptions((o) => ({ ...o, legendPos: pos }))}>{pos === 'none' ? ui.none : pos}</button>
                  ))}
                </div>
              </div>
              <div className="chart-opt-toggles">
                <label className="terminal-toggle"><input type="checkbox" checked={options.showValues} onChange={(e) => setOptions((o) => ({ ...o, showValues: e.target.checked }))} /><span>{ui.showValues}</span></label>
                {showPercentToggle && <label className="terminal-toggle"><input type="checkbox" checked={options.showPercent} onChange={(e) => setOptions((o) => ({ ...o, showPercent: e.target.checked }))} /><span>{ui.showPercent}</span></label>}
                <label className="terminal-toggle"><input type="checkbox" checked={options.showGrid} onChange={(e) => setOptions((o) => ({ ...o, showGrid: e.target.checked }))} /><span>{ui.gridLines}</span></label>
                <label className="terminal-toggle"><input type="checkbox" checked={options.animation} onChange={(e) => setOptions((o) => ({ ...o, animation: e.target.checked }))} /><span>{ui.animation}</span></label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Chart + Data ── */}
        <div className="chart-main">
          <div className="chart-preview-container" style={{ background: theme.bg }}>
            <div ref={chartRef} className="chart-preview" />
          </div>

          <div className="chart-data-section">
            <div className="chart-data-header">
              <label className="chart-section-label">{ui.dataInput}</label>
              <div className="chart-data-actions">
                <button className="panel-btn panel-btn-sm" onClick={addCol}>+ {ui.addSeries}</button>
                <button className="panel-btn panel-btn-sm" onClick={addRow}>+ {ui.addRow}</button>
                <button className={`panel-btn panel-btn-sm${csvMode ? ' accent' : ''}`} onClick={toggleCsv}>CSV</button>
              </div>
            </div>
            {csvMode ? (
              <textarea className="tool-textarea chart-csv-input" value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder={ui.csvPlaceholder} />
            ) : (
              <div className="chart-table-wrap">
                <table className="chart-data-table">
                  <thead><tr>{table[0]?.map((h, ci) => (
                    <th key={ci}><div className="chart-th-inner"><input value={h} onChange={(e) => updateCell(0, ci, e.target.value)} />{ci > 0 && table[0].length > 2 && <button className="chart-col-remove" onClick={() => removeCol(ci)} title="Remove">×</button>}</div></th>
                  ))}</tr></thead>
                  <tbody>{table.slice(1).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => <td key={ci}><input value={cell} onChange={(e) => updateCell(ri + 1, ci, e.target.value)} /></td>)}
                      {table.length > 2 && <td className="chart-row-actions"><button className="chart-row-remove" onClick={() => removeRow(ri + 1)} title="Remove">×</button></td>}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
