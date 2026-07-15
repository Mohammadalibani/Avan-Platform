import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { login } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  username: z.string().min(10, 'کد ملی باید 10 رقم باشد').max(10),
  password: z.string().min(4, 'رمز عبور حداقل 4 کاراکتر باشد'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, setLoading, isLoading } = useAuthStore();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    try {
      const response = await login(data.username, data.password);
      setAuth(response.user, response.access_token, response.refresh_token);
      toast.success(`خوش آمدید ${response.user.full_name}`);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.error || 'خطا در ورود';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              📊
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            سامانه کارکرد آوان
          </CardTitle>
          <p className="text-slate-500 text-sm mt-2">مدیریت یکپارچه کارکرد و پیشرفته ورود اطلاعات</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                {...register('username')}
                placeholder="کد ملی"
                className="text-center"
                dir="ltr"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>
            <div>
              <Input
                {...register('password')}
                type="password"
                placeholder="رمز عبور"
                className="text-center"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
              disabled={isLoading}
            >
              {isLoading ? 'در حال ورود...' : 'ورود به سامانه'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;