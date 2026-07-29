// frontend/src/components/Charts/RadarChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card } from 'antd';

interface RadarChartProps {
    title: string;
    data: {
        indicators: string[];
        series: {
            name: string;
            value: number[];
        }[];
    };
    height?: number;
    colors?: string[];
}

const RadarChart: React.FC<RadarChartProps> = ({
    title,
    data,
    height = 300,
    colors = ['#667eea', '#f093fb'],
}) => {
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                let html = `<strong>${params.name}</strong><br/>`;
                params.value.forEach((v: number, i: number) => {
                    html += `${data.indicators[i]}: ${v}%<br/>`;
                });
                return html;
            },
        },
        legend: {
            data: data.series.map(s => s.name),
            textStyle: {
                fontFamily: 'IRANSans, Vazirmatn, Tahoma',
                fontSize: 12,
            },
            bottom: 0,
        },
        radar: {
            indicator: data.indicators.map(ind => ({
                name: ind,
                max: 100,
                axisLabel: {
                    fontFamily: 'IRANSans, Vazirmatn, Tahoma',
                    fontSize: 11,
                },
            })),
            center: ['50%', '50%'],
            radius: '65%',
            shape: 'circle',
            splitArea: {
                areaStyle: {
                    color: ['rgba(102,126,234,0.02)', 'rgba(102,126,234,0.02)'],
                },
            },
        },
        series: data.series.map((s, index) => ({
            name: s.name,
            type: 'radar',
            data: [
                {
                    value: s.value,
                    name: s.name,
                    areaStyle: {
                        color: colors[index % colors.length] + '40',
                    },
                    lineStyle: {
                        color: colors[index % colors.length],
                        width: 2,
                    },
                    itemStyle: {
                        color: colors[index % colors.length],
                    },
                },
            ],
            symbol: 'circle',
            symbolSize: 6,
        })),
    };

    return (
        <Card title={title} bordered={false} style={{ borderRadius: 12 }}>
            <ReactECharts option={option} style={{ height }} />
        </Card>
    );
};

export default RadarChart;