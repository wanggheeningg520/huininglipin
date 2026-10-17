// =============================================================================
// 会员域 API
// 对应 design.md 2.2.2 接口 18-24
// =============================================================================

import { http } from '../request';
import type { LoginResultVO, UserInfoVO, AddressVO } from '../types';
import { mockLogin, mockUserInfo, mockAddresses } from '../mock/member';

// 18. 微信登录 POST /member/auth/login
export function login(code: string): Promise<LoginResultVO> {
  return http.post<LoginResultVO>('/member/auth/login', { code }, {
    auth: false,
    mock: async () => mockLogin()
  });
}

// 19. 手机号授权绑定 POST /member/auth/phone
export function bindPhone(code: string): Promise<{ phone: string }> {
  return http.post<{ phone: string }>('/member/auth/phone', { code }, {
    mock: async () => ({ phone: '13888888888' })
  });
}

// 20. 用户信息查询 GET /member/user
export function fetchUserInfo(): Promise<UserInfoVO> {
  return http.get<UserInfoVO>('/member/user', undefined, {
    mock: async () => mockUserInfo
  });
}

// 21. 收货地址列表 GET /member/address
export function fetchAddressList(): Promise<AddressVO[]> {
  return http.get<AddressVO[]>('/member/address', undefined, {
    mock: async () => mockAddresses
  });
}

// 22. 新增地址 POST /member/address
export function createAddress(data: Omit<AddressVO, 'id'>): Promise<{ id: number }> {
  return http.post<{ id: number }>('/member/address', data, {
    mock: async () => ({ id: Math.floor(Math.random() * 10000) })
  });
}

// 22. 编辑地址 PUT /member/address/{id}
export function updateAddress(id: number, data: Omit<AddressVO, 'id'>): Promise<{ id: number }> {
  return http.put<{ id: number }>(`/member/address/${id}`, data, {
    mock: async () => ({ id })
  });
}

// 23. 删除地址 DELETE /member/address/{id}
export function removeAddress(id: number): Promise<null> {
  return http.delete<null>(`/member/address/${id}`, {
    mock: async () => null
  });
}

// 24. 设置默认地址 PATCH /member/address/{id}/default
export function setDefaultAddress(id: number): Promise<null> {
  return http.patch<null>(`/member/address/${id}/default`, undefined, {
    mock: async () => null
  });
}