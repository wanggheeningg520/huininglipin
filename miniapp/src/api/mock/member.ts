// =============================================================================
// Mock 数据 - 会员域
// =============================================================================

import type { AddressVO, UserInfoVO, LoginResultVO } from '../../types';

export const mockUserInfo: UserInfoVO = {
  id: 1001,
  nickname: '慧宁用户',
  avatar: 'https://cdn.example.com/mock/avatar.png',
  phone: '13888888888',
  level: 1,
  points: 268
};

export function mockLogin(): LoginResultVO {
  return {
    token: 'mock_token_' + Date.now(),
    user: {
      id: 1001,
      nickname: '慧宁用户',
      avatar: 'https://cdn.example.com/mock/avatar.png',
      phone: null
    }
  };
}

export const mockAddresses: AddressVO[] = [
  { id: 1, name: '张三', phone: '13888888888', province: '北京市', city: '北京市', district: '朝阳区', detail: '慧宁路 1 号 2 栋 3 单元 401', isDefault: true },
  { id: 2, name: '李四', phone: '13999999999', province: '北京市', city: '北京市', district: '海淀区', detail: '中关村大街 5 号', isDefault: false }
];