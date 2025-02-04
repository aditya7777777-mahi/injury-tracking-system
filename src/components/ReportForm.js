'use client';
import { Form, Input, DatePicker, Button, Space, Card } from 'antd';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';

const BodyMap = dynamic(() => import('./BodyMap'), { ssr: false });

export default function ReportForm({ initialData, onSubmit, loading, readonly }) {
  const [form] = Form.useForm();
  const [mounted, setMounted] = useState(false);
  const [injuries, setInjuries] = useState([]);

  useEffect(() => {
    setMounted(true);
    if (initialData?.injuries) {
      setInjuries(initialData.injuries);
    }
  }, [initialData]);

  if (!mounted) {
    return <div className="loading-form">Loading form...</div>;
  }

  const handleBodyMapChange = (newInjuries) => {
    setInjuries(newInjuries.map((injury, index) => ({
      id: index + 1,
      location: injury.location,
      bodyPart: injury.bodyPart
    })));
  };

  const handleSubmit = async (values) => {
    const formData = {
      ...values,
      injuries: injuries.map(injury => ({
        location: injury.location,
        bodyPart: injury.bodyPart
      }))
    };
    await onSubmit(formData);
  };

  return (
    <div className="report-form-container max-w-[1200px] mx-auto p-4">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...initialData,
          injuryDateTime: initialData?.injuryDateTime ? dayjs(initialData.injuryDateTime) : undefined,
        }}
        onFinish={handleSubmit}
        disabled={readonly}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="reporterName"
            label="Reporter Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="injuryDateTime"
            label="Date & Time of Injury"
            rules={[{ required: true }]}
          >
            {readonly ? (
              <div>{dayjs(initialData?.injuryDateTime).format('MMMM D, YYYY h:mm A')}</div>
            ) : (
              <DatePicker 
                showTime 
                style={{ width: '100%' }}
                disabledDate={current => current && current > dayjs().endOf('day')}
                format="MMM D, YYYY h:mm A"
                showSecond={false}
              />
            )}
          </Form.Item>
        </div>

        <Form.Item label="Body Map" className="mt-4">
          <div className="flex justify-center">
            <div className="w-full max-w-[500px]">
              <BodyMap onChange={handleBodyMapChange} initialInjuries={injuries} />
            </div>
          </div>
        </Form.Item>

        <Form.Item className="mt-4">
          {!readonly && (
            <Space className="w-full justify-end">
              <Button onClick={() => form.resetFields()}>
                Reset
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Space>
          )}
        </Form.Item>
      </Form>
    </div>
  );
}
