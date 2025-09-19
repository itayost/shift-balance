import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, CreateUserInput, UpdateUserInput, User, UserRole, EmployeeLevel, EmployeePosition } from 'shiftbalance-shared';
import { useEffect, useState } from 'react';

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UserForm = ({ user, onSubmit, onCancel, isLoading }: UserFormProps) => {
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: user || {
      phone: '',
      fullName: '',
      level: EmployeeLevel.TRAINEE,
      position: EmployeePosition.SERVER,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        phone: user.phone,
        fullName: user.fullName,
        level: user.level as EmployeeLevel,
        position: user.position as EmployeePosition,
      });
    }
  }, [user, reset]);

  // Watch position to conditionally show level field
  const selectedPosition = watch('position');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          שם מלא
        </label>
        <input
          {...register('fullName')}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="ישראל ישראלי"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          מספר טלפון
        </label>
        <input
          {...register('phone')}
          type="tel"
          disabled={isEditing}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
          placeholder="0501234567"
          dir="ltr"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {selectedPosition !== EmployeePosition.SHIFT_MANAGER && (
        <div>
        <label htmlFor="level" className="block text-sm font-medium text-gray-700">
          רמה
        </label>
        <select
          {...register('level')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value={EmployeeLevel.TRAINEE}>מתלמד</option>
          <option value={EmployeeLevel.RUNNER}>רץ</option>
          <option value={EmployeeLevel.INTERMEDIATE}>בינוני</option>
          <option value={EmployeeLevel.EXPERT}>מומחה</option>
        </select>
        {errors.level && (
          <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
        )}
        </div>
      )}

      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
          סוג עובד
        </label>
        <select
          {...register('position')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value={EmployeePosition.SERVER}>מלצר</option>
          <option value={EmployeePosition.BARTENDER}>ברמן</option>
          <option value={EmployeePosition.SHIFT_MANAGER}>אחראי משמרת</option>
        </select>
        {errors.position && (
          <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 space-x-reverse">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          ביטול
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            isEditing ? 'עדכן' : 'צור משתמש'
          )}
        </button>
      </div>
    </form>
  );
};