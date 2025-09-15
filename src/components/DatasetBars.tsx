import { EChart } from '@kbox-labs/react-echarts';
import type { EChartsOption } from 'echarts';
import { useEffect, useRef, useState } from 'react';

type TableDataset = Array<Array<string | number>>;

export default function DatasetBars({
  title,
  dataset,
  seriesNames = ['Inversión total', 'Presupuesto ejecutado'],
  rotateLabels = 25,
  minHeight = 320
}: {
  title: string;
  dataset: TableDataset;   // Primera fila: headers [dim, v1, v2]
  seriesNames?: [string, string] | string[];
  rotateLabels?: number;
  minHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        setReady(true);
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  }, []);

  useEffect(() => {
    // Empujar un resize para que ECharts se ajuste al ancho real
    const id = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    return () => window.clearTimeout(id);
  }, [ready, dataset]);
  const [dimKey, y1Key, y2Key] = (dataset?.[0] as string[] | undefined) ?? ['Dimensión', 'Serie A', 'Serie B'];
  const hasRows = Array.isArray(dataset) && dataset.length > 1;

  const option: EChartsOption = {
    legend: { top: 30 },
    tooltip: { trigger: 'axis' },
    dataset: { source: dataset },
    xAxis: {
      type: 'category',
      axisLabel: { rotate: rotateLabels, interval: 0 }
    },
    yAxis: { type: 'value' },
    grid: { left: 40, right: 20, bottom: 60, top: 60 },
    series: [
      { type: 'bar', name: seriesNames[0], encode: { x: dimKey, y: y1Key } },
      { type: 'bar', name: seriesNames[1], encode: { x: dimKey, y: y2Key } }
    ]
  };

  return (
    <div ref={containerRef} className="dataset-bars" style={{ width: '100%', height: minHeight }}>
      {ready && hasRows && (
        <EChart
          key={`bars-${dataset.length}`}
          option={{ ...option, title: { text: title, left: 'center', top: 10 } }}
          style={{ width: '100%', height: '100%' }}
        />
      )}
      {!hasRows && (
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6C757D', fontStyle: 'italic'
        }}>
          No hay datos para este gráfico
        </div>
      )}
      <style>{`
        .dataset-bars .echarts-for-react { width: 100% !important; height: 100% !important; }
        @media (max-width: 768px) { .dataset-bars { height: ${Math.max(260, minHeight - 40)}px; } }
        @media (max-width: 480px) { .dataset-bars { height: ${Math.max(220, minHeight - 80)}px; } }
      `}</style>
    </div>
  );
}


