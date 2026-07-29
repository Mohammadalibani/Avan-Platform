// frontend/src/hooks/useApiQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export function useApiQuery<T>(
    key: string[],
    fetchFn: () => Promise<{ data: ApiResponse<T> }>,
    options?: {
        enabled?: boolean;
        staleTime?: number;
    }
) {
    return useQuery<T, Error>({
        queryKey: key,
        queryFn: async () => {
            const response = await fetchFn();
            if (!response.data.success) {
                throw new Error(response.data.message || 'خطا در دریافت اطلاعات');
            }
            return response.data.data;
        },
        staleTime: options?.staleTime || 5 * 60 * 1000,
        enabled: options?.enabled !== undefined ? options.enabled : true,
    });
}

export function useApiMutation<T, V>(
    mutationFn: (variables: V) => Promise<{ data: ApiResponse<T> }>,
    options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
        invalidateKeys?: string[];
    }
) {
    const queryClient = useQueryClient();

    return useMutation<T, Error, V>({
        mutationFn: async (variables: V) => {
            const response = await mutationFn(variables);
            if (!response.data.success) {
                throw new Error(response.data.message || 'خطا در عملیات');
            }
            return response.data.data;
        },
        onSuccess: (data) => {
            if (options?.invalidateKeys) {
                options.invalidateKeys.forEach((key) => {
                    queryClient.invalidateQueries({ queryKey: [key] });
                });
            }
            if (options?.onSuccess) {
                options.onSuccess(data);
            }
            message.success('عملیات با موفقیت انجام شد');
        },
        onError: (error: Error) => {
            console.error('Mutation error:', error);
            message.error(error.message || 'خطا در انجام عملیات');
            if (options?.onError) {
                options.onError(error);
            }
        },
    });
}