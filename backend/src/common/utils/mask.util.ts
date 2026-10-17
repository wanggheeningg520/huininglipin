/** 脱敏工具类（对应 spec.md 4.3 规则4 手机号脱敏） */
export class MaskUtil {
  /** 手机号脱敏：保留前 3 后 4，中间 4 位 * */
  static maskPhone(phone: string | null): string | null {
    if (!phone || phone.length < 7) return phone;
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  }

  /** 姓名脱敏：保留首字，其余 * */
  static maskName(name: string | null): string | null {
    if (!name) return name;
    if (name.length <= 1) return name;
    return `${name[0]}${'*'.repeat(name.length - 1)}`;
  }

  /** 身份证脱敏：保留前 4 后 4 */
  static maskIdCard(id: string | null): string | null {
    if (!id || id.length < 8) return id;
    return `${id.slice(0, 4)}**********${id.slice(-4)}`;
  }
}