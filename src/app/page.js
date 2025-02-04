'use client';
import { useState, useMemo, Suspense } from 'react';
import { ConfigProvider, Table, Button, DatePicker, Input, Layout, Space, Typography, FloatButton, Modal, message, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';
import { useQuery, useMutation } from '@apollo/client';
import { REPORTS_QUERY, CREATE_REPORT } from '@/lib/apollo-client';
import ReportForm from '@/components/ReportForm';
import Analytics from '@/components/Analytics';

const { Header } = Layout;
const { Title } = Typography;

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { user, isLoading, login, logout, token } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); 
  
  const { loading, data } = useQuery(REPORTS_QUERY, {
    skip: !token,
    context: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const [createReport] = useMutation(CREATE_REPORT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const columns = [
    {
      title: 'Reporter Name',
      dataIndex: 'reporterName',
      sorter: (a, b) => a.reporterName.localeCompare(b.reporterName),
    },
    {
      title: 'Injury Date & Time',
      dataIndex: 'injuryDateTime',
      render: (date) => dayjs(date).format('MMM D, YYYY h:mm A'),
      sorter: (a, b) => new Date(a.injuryDateTime) - new Date(b.injuryDateTime),
    },
    {
      title: 'Report Date',
      dataIndex: 'createdAt',
      render: (date) => dayjs(date).format('MMM D, YYYY h:mm A'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Link href={`/report/${record.id}`}>View Details</Link>
      ),
    },
  ];
 

  // Custom theme for Ant Design components
  const theme = {
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1890ff',
      fontSize: 14,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    components: {
      Layout: {
        bodyBg: '#fff',
        headerBg: '#fff',
        headerPadding: '24px',
      },
      Table: {
        headerBg: '#fafafa',
        headerColor: '#262626',
        rowHoverBg: '#f5f5f5',
      },
      Button: {
        primaryColor: '#fff',
        borderRadius: 4,
      },
      DatePicker: {
        borderRadius: 4,
      },
      Input: {
        borderRadius: 4,
      },
    },
  };

  const filteredReports = useMemo(() => {
    if (!data?.reports) return [];
    
    return data.reports.filter(report => {
      const matchesSearch = report.reporterName.toLowerCase()
        .includes(searchText.toLowerCase());
      
      const matchesDateRange = !dateRange || (
        dayjs(report.injuryDateTime).isAfter(dateRange[0]) && 
        dayjs(report.injuryDateTime).isBefore(dateRange[1])
      );

      return matchesSearch && matchesDateRange;
    });
  }, [data?.reports, searchText, dateRange]);

  const showNewReportModal = () => {
    setIsModalOpen(true);
  };
  const handleFormSubmit = async (formData) => {
    try {
      setFormSubmitting(true);
      await createReport({
        variables: {
          input: formData
        }
      });
      message.success('Report created successfully');
      setIsModalOpen(false);
    } catch (error) {
      message.error('Failed to create report: ' + error.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const items = [
    {
      key: 'all',
      label: 'All Reports',
      children: (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Input
              placeholder="Search by reporter name"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <DatePicker.RangePicker
              onChange={(dates) => setDateRange(dates)}
              style={{ width: 300 }}
            />
          </Space>
          <Table
            columns={columns}
            dataSource={filteredReports}
            rowKey="id"
            loading={loading}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} reports`
            }}
          />
        </>
      )
    },
    {
      key: 'analytics',
      label: 'Analytics',
      children: <Analytics />
    }
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={2}>Welcome to Injury Tracking System</Title>
        <Button type="primary" onClick={login}>
          Login to Continue
        </Button>
      </div>
    );
  }

  return (
    <ConfigProvider theme={theme}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: 'auto',
          background: '#fff'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <Title level={2} style={{ margin: 0 }}>Injury Tracking System</Title>
            <Space>
              <span style={{ marginRight: '16px' }}>
                <UserOutlined /> {user?.email}
              </span>
              <Button 
                icon={<LogoutOutlined />}
                onClick={logout}
                type="link"
              >
                Logout
              </Button>
            </Space>
          </div>
          <Tabs 
            items={items}
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{
              marginBottom: 0,
              borderBottom: '1px solid #f0f0f0'
            }}
          />
        </Header>
        
        <FloatButton icon={<PlusOutlined />} onClick={showNewReportModal} style={{backgroundColor: '#1890ff'}} />

        <Modal
          title="Create New Injury Report"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={800}
        >
          <ReportForm 
            onSubmit={handleFormSubmit}
            loading={formSubmitting}
          />
        </Modal>
      </Layout>
    </ConfigProvider>
  );
}
