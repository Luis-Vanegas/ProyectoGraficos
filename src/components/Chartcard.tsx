// src/components/ChartCard.tsx
import { useMemo, type CSSProperties } from 'react';
import { EChart } from '@kbox-labs/react-echarts';
import type { EChartsOption } from 'echarts';

type SeriesType = 'bar' | 'line' | 'pie';

// Matriz 2D: primera fila headers (strings), resto filas con string | number
export type TableDataset = Array<Array<string | number>>;

interface Props {
  title: string;
  dataset: TableDataset;   // [ ['Mes','Ventas'], ['Ene',1200], ... ]
  seriesType: SeriesType;
  xField?: string;         // para bar/line: nombre de la columna X (de los headers)
  yField?: string;         // para bar/line: nombre de la columna Y
  style?: CSSProperties;
}

export default function ChartCard({
  title, dataset, seriesType, xField, yField, style
}: Props) {
  const option = useMemo<EChartsOption>(() => {
    if (!dataset?.length) return { title: { text: title } };

    const [headers, ...rows] = dataset;

    if (seriesType === 'pie') {
      // Espera 2 columnas: [categoria, valor]
      const data = rows.map(r => ({
        name: String(r[0] ?? ''),
        value: Number(r[1] ?? 0),
      }));

      return {
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'item' },
        series: [{ type: 'pie', radius: '60%', data }],
      };
    }

    // bar / line usando dataset + encode en la serie
    const encode =
      xField && yField ? { x: xField, y: yField } : undefined;

    return {
      title: { text: title },
      tooltip: { trigger: 'axis' },
      dataset: { source: [headers, ...rows] },
      xAxis: { type: 'category' },
      yAxis: { type: 'value' },
      series: [
        {
          type: seriesType,
          ...(encode ? { encode } : {}),
        },
      ],
    };
  }, [dataset, seriesType, title, xField, yField]);

  return (
    <EChart
      option={option}
      style={{ width: '100%', height: 380, ...style }}
    />
  );
}
