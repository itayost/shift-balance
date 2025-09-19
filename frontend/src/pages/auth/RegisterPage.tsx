import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from 'shiftbalance-shared';
import { useAuthStore } from '../../store/auth.store';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      token: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerUser(data);
      navigate('/');
    } catch (error) {
      // Error is handled in the store with toast
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{backgroundColor: 'var(--bg-page)'}}>
      <div className="max-w-md w-full space-y-6">
        {/* Header Card */}
        <div className="card card-default text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            צור חשבון חדש
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            קיבלת טוקן הרשמה מהמנהל שלך
          </p>
        </div>
        {/* Form Card */}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="card card-default space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                טוקן הרשמה
              </label>
              <input
                {...register('token')}
                type="text"
                autoComplete="off"
                className="input"
                placeholder="הכנס את הטוקן שקיבלת"
              />
              {errors.token && (
                <p className="mt-1 text-sm text-red-600">{errors.token.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה חדשה
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pr-10"
                  placeholder="בחר סיסמה חזקה"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="card card-muted">
              <p className="text-xs text-gray-600">
                הסיסמה חייבת להכיל לפחות 8 תווים, אותיות גדולות וקטנות, מספרים ותווים מיוחדים
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'צור חשבון'
            )}
          </button>
        </form>

        {/* Footer Card */}
        <div className="card card-default text-center">
          <Link
            to="/login"
            className="font-medium text-blue-600"
          >
            כבר יש לך חשבון? התחבר
          </Link>
        </div>
      </div>
    </div>
  );
};