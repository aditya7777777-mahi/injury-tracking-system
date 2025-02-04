
/**
 * Report Detail Page Component
 * 
 * A page component that displays, edits and deletes a specific injury report.
 * It provides functionality to:
 * - View report details in read-only mode
 * - Edit report information through a form
 * - Delete report with confirmation modal
 * - Handle API interactions for update and delete operations
 * 
 */

'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_REPORT, UPDATE_REPORT, DELETE_REPORT } from '@/lib/apollo-client';
import { Card, Skeleton, Typography, message, Space, Button, Modal } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const { Title } = Typography;
const ReportForm = dynamic(() => import('@/components/ReportForm'), { ssr: false });

export default function ReportDetail() {
  const router = useRouter();
  const id = usePathname().split('/')[2];
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading } = useQuery(GET_REPORT, {
    variables: { id },
    skip: !token,
    context: {
      headers: { Authorization: `Bearer ${token}` }
    },
    fetchPolicy: 'network-only'
  });

  const [updateReport, { loading: updating }] = useMutation(UPDATE_REPORT, {
    context: {
      headers: { Authorization: `Bearer ${token}` }
    }
  });

  const [deleteReport, { loading: deleting }] = useMutation(DELETE_REPORT, {
    context: {
      headers: { Authorization: `Bearer ${token}` }
    }
  });

  const handleUpdate = async (formData) => {
    try {
      const result = await updateReport({
        variables: {
          id,
          input: formData
        }
      });
      if (result.data?.updateReport.success) {
        message.success('Report updated successfully');
        setIsEditing(false);
      } else {
        throw new Error(result.data?.updateReport.message);
      }
    } catch (error) {
      message.error('Failed to update report: ' + error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deleteReport({
        variables: { id }
      });
      if (result.data?.deleteReport.success) {
        message.success('Report deleted successfully');
        router.push('/');
      } else {
        throw new Error(result.data?.deleteReport.message);
      }
    } catch (error) {
      message.error('Failed to delete report: ' + error.message);
    }
  };

  if (loading) return <Skeleton active />;
  if (!data?.report) return <div>Report not found</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Report Details</Title>
        <Space>
          <Button 
            type={isEditing ? "default" : "primary"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Report'}
          </Button>
          <Button 
            danger 
            onClick={() => setIsDeleting(true)}
          >
            Delete Report
          </Button>
        </Space>
      </div>

      <Card>
        <ReportForm 
          initialData={data.report}
          readonly={!isEditing}
          onSubmit={handleUpdate}
          loading={updating}
        />
      </Card>

      <Modal
        title="Confirm Delete"
        open={isDeleting}
        onOk={handleDelete}
        onCancel={() => setIsDeleting(false)}
        confirmLoading={deleting}
        okText="Yes, Delete"
        cancelText="Cancel"
      >
        <p>Are you sure you want to delete this report? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
