
/**
 * Analytics component for displaying injury tracking statistics and visualizations.
 * Renders various statistics, including total reports, total injuries, body part distribution (pie chart),
 * and monthly report distribution (bar chart). Uses Ant Design for layout and Chart.js for data visualization.
 * Data is fetched using Apollo Client and requires authentication token.
 * 
 */

'use client';
import { Card, Row, Col, Statistic } from 'antd';
import { useQuery } from '@apollo/client';
import { GET_ANALYTICS } from '@/lib/apollo-client';
import { useAuth } from '@/context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics() {
  const { token } = useAuth();
  const { data, loading } = useQuery(GET_ANALYTICS, {
    skip: !token,
    context: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  if (loading) return <div>Loading analytics...</div>;

  const bodyPartChartData = {
    labels: data?.analytics.bodyPartDistribution.map(item => item.bodyPart) || [],
    datasets: [
      {
        data: data?.analytics.bodyPartDistribution.map(item => item.count) || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
      },
    ],
  };

  const monthlyChartData = {
    labels: data?.analytics.monthlyReports.map(item => item.month) || [],
    datasets: [
      {
        label: 'Number of Reports',
        data: data?.analytics.monthlyReports.map(item => item.count) || [],
        backgroundColor: '#36A2EB',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Report Distribution'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Body Part Distribution'
      }
    }
  };

  return (
    <div className="p-6">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card>
            <Statistic 
              title="Total Reports" 
              value={data?.analytics.totalReports || 0} 
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic 
              title="Total Injuries" 
              value={data?.analytics.totalInjuries || 0} 
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col span={12}>
          <Card title="Body Part Distribution">
            <Pie data={bodyPartChartData} options={pieOptions} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Monthly Report Statistics">
            <Bar data={monthlyChartData} options={barOptions} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
