// frontend/src/components/Charts/PieChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card } from 'antd';

interface PieChartProps {
    title: string;
    data: {
        name: string;
        value: number;
    }[];
    height?: number;
    colors?: string[];
}

const PieChart: React.FC<PieChartProps> = ({
    title,
    data,
    height = 300,
    colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#f6d365', '#fda085'],
}) => {
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                return `<strong>${params.name}</strong><br/>
                        مقدار: ${params.value} نفر<br/>
                        درصد: ${params.percent}%`;
            },
        },
        legend: {
            orient: 'vertical',
            right: 'left',
            textStyle: {
                fontFamily: 'IRANSans, Vazirmatn, Tahoma',
                fontSize: 12,
            },
        },
        series: [
            {
                name: title,
                type: 'pie',
                radius: ['45%', '75%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 2,
                },
                label: {
                    show: true,
                    formatter: '{b}\n{d}%',
                    fontFamily: 'IRANSans, Vazirmatn, Tahoma',
                    fontSize: 11,
                },
                labelLine: {
                    length: 10,
                    length2: 15,
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold',
                    },
                    scale: true,
                    scaleSize: 10,
                },
                data: data.map((item, index) => ({
                    ...item,
                    itemStyle: {
                        color: colors[index % colors.length],
                    },
                })),
            },
        ],
    };

    return (
        <Card title={title} bordered={false} style={{ borderRadius: 12 }}>
            <ReactECharts option={option} style={{ height }} />
        </Card>
    );
};

export default PieChart;