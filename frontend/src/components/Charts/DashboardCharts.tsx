// frontend/src/components/Charts/DashboardCharts.tsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Select, Space, Typography } from 'antd';
import BarChart from './BarChart';
import PieChart from './PieChart';
import LineChart from './LineChart';
import RadarChart from './RadarChart';

const { Text } = Typography;
const { Option } = Select;

// ===== داده‌های نمونه =====
const departmentData = {
    categories: ['فناوری اطلاعات', 'منابع انسانی', 'مالی', 'آموزش', 'بازرگانی', 'پشتیبانی'],
    series: [
        { name: 'پرسنل', data: [35, 25, 20, 15, 10, 8] },
        { name: 'تکمیل شده', data: [30, 18, 15, 10, 5, 3] },
    ],
};

const pieData = [
    { name: 'فناوری اطلاعات', value: 35 },
    { name: 'منابع انسانی', value: 25 },
    { name: 'مالی', value: 20 },
    { name: 'آموزش', value: 15 },
    { name: 'بازرگانی', value: 10 },
    { name: 'پشتیبانی', value: 8 },
];

const trendData = {
    categories: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر'],
    series: [
        { name: 'تکمیل اطلاعات', data: [65, 72, 68, 85, 90, 95, 92] },
        { name: 'تایید نهایی', data: [45, 52, 58, 65, 70, 82, 88] },
        { name: 'در انتظار', data: [30, 25, 20, 15, 10, 8, 5] },
    ],
};

const radarData = {
    indicators: ['فنی', 'مدیریتی', 'تحلیلی', 'ارتباطی', 'خلاقیت', 'تعهد'],
    series: [
        { name: 'کارشناس ارشد', value: [85, 70, 80, 65, 75, 90] },
        { name: 'کارشناس', value: [65, 55, 60, 70, 60, 75] },
    ],
};

const DashboardCharts: React.FC = () => {
    const [period, setPeriod] = useState('1404');

    return (
        <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text strong style={{ fontSize: 16 }}>📊 مصورسازی داده‌ها</Text>
                <Space>
                    <Text>دوره:</Text>
                    <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
                        <Option value="1404">۱۴۰۴</Option>
                        <Option value="1403">۱۴۰۳</Option>
                        <Option value="1402">۱۴۰۲</Option>
                    </Select>
                </Space>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <BarChart
                        title="📊 توزیع پرسنل در ادارات"
                        data={departmentData}
                    />
                </Col>
                <Col xs={24} lg={12}>
                    <PieChart
                        title="🥧 سهم پرسنل بر اساس اداره"
                        data={pieData}
                    />
                </Col>
                <Col xs={24} lg={12}>
                    <LineChart
                        title="📈 روند تکمیل و تایید اطلاعات"
                        data={trendData}
                        height={320}
                    />
                </Col>
                <Col xs={24} lg={12}>
                    <RadarChart
                        title="🕸️ مقایسه مهارت‌ها"
                        data={radarData}
                        height={320}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default DashboardCharts;