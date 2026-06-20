import { useState, useEffect } from 'react';
import {
  Steps,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Result,
  Space,
  Typography,
  Divider,
  Alert,
  Tag,
  message,
} from 'antd';
import {
  PackagePlus,
  CheckCircle2,
  Printer,
  ArrowLeft,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useBatteryStore } from '@/store/batteryStore';
import { generateBatchId, generateOrderId } from '@/utils/dateUtils';
import type { BatteryBatch } from '@/types';

const { Title, Text } = Typography;

interface FormValues {
  batchId: string;
  supplier: string;
  quantity: number;
  manufactureDate: dayjs.Dayjs;
  expiryDate: dayjs.Dayjs;
  warehouseLocation: string;
  capacity: number;
  healthScore: number;
}

const suppliers = ['宁德时代', '比亚迪', '国轩高科', '孚能科技', '亿纬锂能'];

const inspectionItems = [
  { key: 'appearance', label: '外观检查', desc: '检查外壳是否有变形、划痕、漏液' },
  { key: 'voltage', label: '电压测试', desc: '测量开路电压是否在正常范围' },
  { key: 'capacity', label: '容量测试', desc: '充放电测试实际容量' },
  { key: 'insulation', label: '绝缘检测', desc: '检测绝缘电阻是否达标' },
  { key: 'bms', label: 'BMS通信', desc: '验证BMS通信协议正常' },
];

export default function WarehouseInPage() {
  const { addBatch } = useBatteryStore();
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm<FormValues>();
  const [formValues, setFormValues] = useState<FormValues | null>(null);
  const [inspection, setInspection] = useState<string[]>([]);
  const [createdBatch, setCreatedBatch] = useState<BatteryBatch | null>(null);
  const [receiptNo, setReceiptNo] = useState('');

  useEffect(() => {
    form.setFieldsValue({
      batchId: generateBatchId(),
      healthScore: 100,
      capacity: 60,
    });
  }, [form]);

  const handleNext = async () => {
    if (current === 0) {
      try {
        const values = await form.validateFields();
        if (values.manufactureDate && values.expiryDate) {
          if (values.expiryDate.isBefore(values.manufactureDate)) {
            message.error('到期日期不能早于生产日期');
            return;
          }
        }
        setFormValues(values);
        setCurrent(1);
      } catch {
        message.warning('请完善表单信息');
      }
    } else if (current === 1) {
      if (inspection.length < inspectionItems.length) {
        message.warning(`请完成全部质检项 (${inspection.length}/${inspectionItems.length})`);
        return;
      }
      if (!formValues) return;

      const newBatch = addBatch({
        batchId: formValues.batchId,
        supplier: formValues.supplier,
        quantity: formValues.quantity,
        availableQty: formValues.quantity,
        manufactureDate: formValues.manufactureDate.format('YYYY-MM-DD'),
        expiryDate: formValues.expiryDate.format('YYYY-MM-DD'),
        warehouseLocation: formValues.warehouseLocation,
        capacity: formValues.capacity,
        healthScore: formValues.healthScore,
      });

      setCreatedBatch(newBatch);
      setReceiptNo(generateOrderId().replace('ORD', 'RCP'));
      setCurrent(2);
      message.success('入库成功！');
    }
  };

  const handlePrev = () => {
    setCurrent(current - 1);
  };

  const handleReset = () => {
    setCurrent(0);
    setFormValues(null);
    setInspection([]);
    setCreatedBatch(null);
    setReceiptNo('');
    form.resetFields();
    form.setFieldsValue({
      batchId: generateBatchId(),
      healthScore: 100,
      capacity: 60,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const stepTitles = ['录入信息', '质检确认', '入库完成'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <PackagePlus className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">到货验收入库</h1>
          </div>
          <p className="text-slate-500 text-sm ml-12">
            新批次电池到货后，填写入库信息并完成质检流程
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-0">
        <div className="max-w-4xl mx-auto py-6">
          <Steps
            current={current}
            items={stepTitles.map((title, idx) => ({
              title,
              status: current === idx ? 'process' : current > idx ? 'finish' : 'wait',
            }))}
            className="mb-10"
          />

          {current === 0 && (
            <Form
              form={form}
              layout="vertical"
              initialValues={{ batchId: generateBatchId(), healthScore: 100, capacity: 60 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                <Form.Item
                  name="batchId"
                  label="批次号"
                  rules={[{ required: true, message: '请输入批次号' }]}
                  className="mb-5"
                >
                  <Input placeholder="自动生成，可编辑" />
                </Form.Item>

                <Form.Item
                  name="supplier"
                  label="供应商"
                  rules={[{ required: true, message: '请选择供应商' }]}
                  className="mb-5"
                >
                  <Select
                    placeholder="请选择供应商"
                    options={suppliers.map((s) => ({ label: s, value: s }))}
                  />
                </Form.Item>

                <Form.Item
                  name="quantity"
                  label="数量"
                  rules={[{ required: true, message: '请输入数量' }]}
                  className="mb-5"
                >
                  <InputNumber
                    min={1}
                    max={99999}
                    placeholder="请输入数量"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  name="warehouseLocation"
                  label="库位编号"
                  rules={[{ required: true, message: '请输入库位编号' }]}
                  className="mb-5"
                >
                  <Input placeholder="如 A-01-03" />
                </Form.Item>

                <Form.Item
                  name="manufactureDate"
                  label="生产日期"
                  rules={[{ required: true, message: '请选择生产日期' }]}
                  className="mb-5"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    disabledDate={(d) => d && d.isAfter(dayjs())}
                  />
                </Form.Item>

                <Form.Item
                  name="expiryDate"
                  label="到期日期"
                  rules={[{ required: true, message: '请选择到期日期' }]}
                  className="mb-5"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    disabledDate={(d) =>
                      d &&
                      d.isBefore(
                        form.getFieldValue('manufactureDate') || dayjs()
                      )
                    }
                  />
                </Form.Item>

                <Form.Item
                  name="capacity"
                  label="容量 (Ah)"
                  rules={[{ required: true, message: '请输入容量' }]}
                  className="mb-5"
                >
                  <InputNumber
                    min={1}
                    max={1000}
                    placeholder="如 60"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  name="healthScore"
                  label="健康度 (%)"
                  rules={[{ required: true, message: '请输入健康度' }]}
                  className="mb-5"
                >
                  <InputNumber
                    min={0}
                    max={100}
                    placeholder="0-100"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </div>

              <div className="flex justify-end mt-8">
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRight size={16} />}
                  onClick={handleNext}
                >
                  下一步
                </Button>
              </div>
            </Form>
          )}

          {current === 1 && formValues && (
            <div>
              <Alert
                message="请核对录入信息并完成质检项"
                type="info"
                showIcon
                className="mb-6"
              />

              <Title level={5} className="!mb-3 !text-slate-700">
                入库信息核对
              </Title>
              <Descriptions bordered column={2} size="small" className="mb-8">
                <Descriptions.Item label="批次号" span={2}>
                  <Text copyable className="font-mono">
                    {formValues.batchId}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="供应商">
                  <Tag color="blue">{formValues.supplier}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="数量">
                  <span className="font-semibold">{formValues.quantity}</span> 块
                </Descriptions.Item>
                <Descriptions.Item label="生产日期">
                  {formValues.manufactureDate.format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="到期日期">
                  {formValues.expiryDate.format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="库位">
                  {formValues.warehouseLocation}
                </Descriptions.Item>
                <Descriptions.Item label="容量">
                  {formValues.capacity} Ah
                </Descriptions.Item>
                <Descriptions.Item label="健康度" span={2}>
                  {formValues.healthScore}%
                </Descriptions.Item>
              </Descriptions>

              <Title level={5} className="!mb-3 !text-slate-700">
                <div className="flex items-center gap-2">
                  <FileCheck size={18} />
                  质检项清单
                  <Tag color={inspection.length === inspectionItems.length ? 'green' : 'orange'}>
                    {inspection.length}/{inspectionItems.length}
                  </Tag>
                </div>
              </Title>

              <div className="space-y-3 mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <Checkbox
                  indeterminate={
                    inspection.length > 0 &&
                    inspection.length < inspectionItems.length
                  }
                  checked={inspection.length === inspectionItems.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setInspection(inspectionItems.map((i) => i.key));
                    } else {
                      setInspection([]);
                    }
                  }}
                  className="!mb-2"
                >
                  <span className="font-medium">全选质检项</span>
                </Checkbox>
                <Divider className="!my-2" />
                {inspectionItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start gap-3 py-2 px-2 hover:bg-white rounded-md transition-colors"
                  >
                    <Checkbox
                      checked={inspection.includes(item.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setInspection([...inspection, item.key]);
                        } else {
                          setInspection(
                            inspection.filter((k) => k !== item.key)
                          );
                        }
                      }}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-700">
                        {item.label}
                        {inspection.includes(item.key) && (
                          <CheckCircle2
                            size={14}
                            className="inline-block ml-2 text-green-500"
                          />
                        )}
                      </div>
                      <div className="text-sm text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  size="large"
                  icon={<ArrowLeft size={16} />}
                  onClick={handlePrev}
                >
                  上一步
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircle2 size={16} />}
                  onClick={handleNext}
                >
                  确认入库
                </Button>
              </div>
            </div>
          )}

          {current === 2 && createdBatch && (
            <div>
              <Result
                status="success"
                icon={<CheckCircle2 className="text-green-500" size={64} />}
                title="入库成功！"
                subTitle="电池批次已成功入库，请妥善保管入库单据。"
                extra={[
                  <Space key="actions" size="middle" wrap>
                    <Button
                      type="primary"
                      size="large"
                      icon={<Printer size={16} />}
                      onClick={handlePrint}
                    >
                      打印入库单
                    </Button>
                    <Button size="large" onClick={handleReset}>
                      继续入库
                    </Button>
                  </Space>,
                ]}
                className="!py-4"
              />

              <Card className="border-dashed mt-4" title="入库单据">
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="入库单号" span={2}>
                    <Text copyable className="font-mono font-bold">
                      {receiptNo}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="批次号">
                    <Text copyable className="font-mono">
                      {createdBatch.batchId}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="供应商">
                    <Tag color="blue">{createdBatch.supplier}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="入库数量">
                    <span className="font-semibold">{createdBatch.quantity}</span> 块
                  </Descriptions.Item>
                  <Descriptions.Item label="库位">
                    {createdBatch.warehouseLocation}
                  </Descriptions.Item>
                  <Descriptions.Item label="生产日期">
                    {createdBatch.manufactureDate}
                  </Descriptions.Item>
                  <Descriptions.Item label="到期日期">
                    {createdBatch.expiryDate}
                  </Descriptions.Item>
                  <Descriptions.Item label="容量">
                    {createdBatch.capacity} Ah
                  </Descriptions.Item>
                  <Descriptions.Item label="健康度">
                    {createdBatch.healthScore}%
                  </Descriptions.Item>
                  <Descriptions.Item label="质检项" span={2}>
                    <Space wrap>
                      {inspectionItems.map((item) => (
                        <Tag key={item.key} color="green">
                          <CheckCircle2 size={12} className="inline mr-1" />
                          {item.label}
                        </Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="入库时间" span={2}>
                    {createdBatch.createdAt}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
