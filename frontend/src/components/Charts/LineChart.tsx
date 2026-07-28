// frontend/src/components/Charts/LineChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card } from 'antd';

interface LineChartProps {
    title: string;
    data: {
        categories: string[];
        series: {
            name: string;
            data: number[];
        }[];
    };
    height?: number;
    colors?: string[];
}

const LineChart: React.FC<LineChartProps> = ({
    title,
    data,
    height = 300,
    colors = ['#667eea', '#f093fb', '#43e97b'],
}) => {
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                let html = `<strong>${params[0].name}</strong><br/>`;
                params.forEach((p: any) => {
                    html += `${p.marker} ${p.seriesName}: ${p.value}%<br/>`;
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
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '8%',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: data.categories,
            axisLabel: {
                fontFamily: 'IRANSans, Vazirmatn, Tahoma',
                fontSize: 11,
            },
            axisLine: {
                lineStyle: { color: '#e0e0e0' },
            },
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 100,
            axisLabel: {
                formatter: '{value}%',
                fontFamily: 'IRANSans, Vazirmatn, Tahoma',
                fontSize: 11,
            },
            splitLine: {
                lineStyle: {
                    color: '#f0f0f0',
                    type: 'dashed',
                },
            },
        },
        series: data.series.map((s, index) => ({
            name: s.name,
            type: 'line',
            data: s.data,
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
                width: 3,
                color: colors[index % colors.length],
            },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: colors[index % colors.length] + '80' },
                        { offset: 1, color: colors[index % colors.length] + '10' },
                    ],
                },
            },
            itemStyle: {
                color: colors[index % colors.length],
            },
            emphasis: {
                focus: 'series',
            },
        })),
    };

    return (
        <Card title={title} bordered={false} style={{ borderRadius: 12 }}>
            <ReactECharts option={option} style={{ height }} />
        </Card>
    );
};

export default LineChart;