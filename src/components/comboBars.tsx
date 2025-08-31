import { EChart } from '@kbox-labs/react-echarts';
import type { EChartsOption } from 'echarts';

export default function ComboBars({
  title, dataset, dim, v1, v2
}:{
  title: string;
  dataset: Array<Array<string|number>>; // [ [dim,v1,v2], ... ] con headers en la primera fila
  dim: string; v1: string; v2: string;
}) {
  const option: EChartsOption = {
    color: ['#2aa198', '#268bd2'],
    title: { text: title },
    legend: { top: 0 },
    tooltip: { trigger: 'axis' },
    dataset: { source: dataset },
    xAxis: { type: 'category', axisLabel: { rotate: 25 } },
    yAxis: { type: 'value' },
    series: [
      { type: 'bar', name: v1, encode: { x: dim, y: v1 } },
      { type: 'bar', name: v2, encode: { x: dim, y: v2 } }
    ]
  };

  // ⬅️ ocupa 100% del alto del contenedor .chart
  return <EChart option={option} autoresize style={{ width: '100%', height: '100%' }} />;
}
