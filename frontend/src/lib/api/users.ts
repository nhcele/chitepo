import { UpdateUserDto, User } from '@mindelta/shared';
import { apiClient } from './client';

interface ApiEnvelope<T> {
  success?: boolean;
  data: T;
  message?: string;
}

export async function updateMe(update: UpdateUserDto): Promise<User> {
  const res = await apiClient.patch<ApiEnvelope<User>>('/users/me', update);
  return res.data;
}
