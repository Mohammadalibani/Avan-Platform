// frontend/src/components/Charts/BarChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card } from 'antd';

interface BarChartProps {
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

const BarChart: React.FC<BarChartProps> = ({
    title,
    data,
    height = 300,
    colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'],
}) => {
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
            },
            formatter: (params: any) => {
                let html = `<strong>${params[0].name}</strong><br/>`;
                params.forEach((p: any) => {
                    html += `${p.marker} ${p.seriesName}: ${p.value} نفر<br/>`;
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
                rotate: 0,
            },
            axisLine: {
                lineStyle: { color: '#e0e0e0' },
            },
        },
        yAxis: {
            type: 'value',
            axisLabel: {
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
            type: 'bar',
            data: s.data,
            barWidth: '35%',
            itemStyle: {
                borderRadius: [4, 4, 0, 0],
                color: colors[index % colors.length],
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.3)',
                },
            },
        })),
    };

    return (
        <Card title={title} bordered={false} style={{ borderRadius: 12 }}>
            <ReactECharts option={option} style={{ height }} />
        </Card>
    );
};

export default BarChart;