import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Checkbox, Button, message, Card } from 'antd';
import {
  User,
  Lock,
  Shield,
  Zap,
  Brain,
  Battery,
  LogIn,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

const features = [
  {
    icon: Shield,
    title: '安全可靠',
    desc: '多重身份验证，数据加密传输，保障信息安全',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    icon: Zap,
    title: '高效运营',
    desc: '智能队列调度，快速换电响应，提升运营效率',
    color: 'from-amber-400 to-orange-500',
  },
  {
    icon: Brain,
    title: '智能管理',
    desc: 'AI电池健康监测，效期预警提醒，智能库存管理',
    color: 'from-violet-400 to-purple-500',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useUserStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<LoginFormValues>();

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const success = login(values.username, values.password);
      if (success) {
        message.success('登录成功，正在跳转...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        message.error('用户名或密码错误');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-3/5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-700 to-teal-600" />

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl -translate-y-48 translate-x-48" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl translate-y-40 -translate-x-40" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />

        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-3 mb-16"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                <Battery className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-xl tracking-wide">
                  SmartSwap
                </div>
                <div className="text-white/60 text-xs">智能换电平台</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-5xl font-black text-white leading-tight mb-6 tracking-tight">
                电动车电池
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                  智能换电管理系统
                </span>
              </h1>
              <p className="text-white/75 text-lg leading-relaxed max-w-xl mb-12">
                为外卖骑手、快递员提供一站式电池租赁与换电服务，
                智能调度、安全可靠、高效便捷，让每一次出行都电力满满。
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="grid grid-cols-3 gap-6"
          >
            {features.map((feature, index) => {
              const IconComp = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                  className="group"
                >
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 hover:bg-white/15 hover:border-white/25 transition-all duration-300">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComp className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-base mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-white/65 text-sm leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-white/40 text-sm mt-12"
          >
            © 2026 SmartSwap 智能换电平台 · 版权所有
          </motion.div>
        </div>
      </motion.div>

      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              <Battery className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-slate-800 font-bold text-lg">SmartSwap</div>
              <div className="text-slate-500 text-xs">智能换电平台</div>
            </div>
          </div>

          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="p-8 sm:p-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-black text-slate-800 mb-2">
                  欢迎登录
                </h2>
                <p className="text-slate-500">
                  请输入您的账号信息以访问系统
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  size="large"
                  initialValues={{ username: 'admin', remember: true }}
                  onFinish={handleSubmit}
                  requiredMark={false}
                >
                  <Form.Item
                    label={<span className="font-medium text-slate-700">账号</span>}
                    name="username"
                    rules={[{ required: true, message: '请输入账号' }]}
                  >
                    <Input
                      prefix={<User className="w-4 h-4 text-slate-400" />}
                      placeholder="请输入账号 (admin / operator)"
                      className="!h-12 !rounded-xl"
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="font-medium text-slate-700">密码</span>}
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      prefix={<Lock className="w-4 h-4 text-slate-400" />}
                      placeholder="请输入密码 (123456)"
                      className="!h-12 !rounded-xl"
                    />
                  </Form.Item>

                  <div className="flex items-center justify-between mb-6">
                    <Form.Item
                      name="remember"
                      valuePropName="checked"
                      noStyle
                    >
                      <Checkbox className="!text-slate-600">
                        <span className="text-sm">记住我</span>
                      </Checkbox>
                    </Form.Item>
                    <a
                      href="#"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      忘记密码?
                    </a>
                  </div>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<LogIn className="w-4 h-4" />}
                      className="btn-primary !w-full !h-12 !rounded-full !text-base !font-semibold !border-0"
                    >
                      {loading ? '登录中...' : '登 录'}
                    </Button>
                  </Form.Item>
                </Form>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-cyan-50 border border-primary-100"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700 mb-1.5">
                      测试账号
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-primary-700 font-medium">
                          admin / 123456
                        </span>
                        <span className="text-slate-500">管理员</span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-cyan-700 font-medium">
                          operator / 123456
                        </span>
                        <span className="text-slate-500">操作员</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </Card>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center mt-8 text-slate-400 text-xs lg:hidden"
          >
            © 2026 SmartSwap 智能换电平台 · 版权所有
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
