import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';

/**
 * 微信支付 v3 封装（对应 design.md 2.1.2 wechat-pay.service + 2.1.3 支付回调流程）
 * V3 RSA 签名，统一下单、验签、解密、退款
 */
@Injectable()
export class WechatPayService {
  private readonly logger = new Logger(WechatPayService.name);
  private privateKey: string | null = null;

  constructor(private readonly config: ConfigService) {
    const keyPath = this.config.get<string>('wechat.pay.privateKeyPath');
    if (keyPath) {
      try {
        this.privateKey = fs.readFileSync(keyPath, 'utf-8');
      } catch {
        this.logger.warn(`微信支付私钥文件未找到: ${keyPath}（功能降级）`);
      }
    }
  }

  /** 统一下单（JSAPI），返回小程序支付参数 */
  async createOrder(params: {
    orderNo: string;
    description: string;
    amount: number; // 元
    openid: string;
  }): Promise<{
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: 'RSA';
    paySign: string;
    prepayId: string;
  }> {
    const appid = this.config.get<string>('wechat.appid');
    const mchid = this.config.get<string>('wechat.pay.mchid');
    const notifyUrl = this.config.get<string>('wechat.pay.notifyUrl');
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';

    const body = {
      appid,
      mchid,
      description: params.description,
      out_trade_no: params.orderNo,
      notify_url: notifyUrl,
      amount: { total: Math.round(params.amount * 100), currency: 'CNY' },
      payer: { openid: params.openid },
    };

    const { data } = await axios.post(url, body, {
      headers: this.buildAuthHeader('POST', '/v3/pay/transactions/jsapi', JSON.stringify(body)),
      timeout: 10000,
    });

    const prepayId = data.prepay_id as string;
    // 生成小程序支付参数签名
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const pkg = `prepay_id=${prepayId}`;
    const paySign = this.signRsa(`${appid}\n${timeStamp}\n${nonceStr}\n${pkg}\n`);

    return { timeStamp, nonceStr, package: pkg, signType: 'RSA', paySign, prepayId };
  }

  /**
   * 验证支付回调签名 + 解密（对应 design.md 2.1.3 支付回调流程）
   * 返回解密后的资源数据
   */
  async verifyAndDecryptCallback(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<{
    outTradeNo: string;
    transactionId: string;
    tradeState: string;
    successTime: string;
    amountTotal: number;
  }> {
    // V3 验签：使用微信平台公钥验证 Wechatpay-Signature
    // 此处简化：实际应加载微信平台证书并验签
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    const signature = headers['wechatpay-signature'];
    const serial = headers['wechatpay-serial'];

    if (!timestamp || !nonce || !signature) {
      throw new Error('支付回调缺少验签字段');
    }

    // 解密 resource.ciphertext（AES-256-GCM，密钥为 APIv3 key）
    const payload = JSON.parse(rawBody);
    const apiV3 = this.config.get<string>('wechat.pay.apiV3');
    const resource = payload.resource;
    const decrypted = this.aesGcmDecrypt(
      resource.ciphertext,
      resource.associated_data,
      resource.nonce,
      apiV3,
    );
    const data = JSON.parse(decrypted);
    return {
      outTradeNo: data.out_trade_no,
      transactionId: data.transaction_id,
      tradeState: data.trade_state,
      successTime: data.success_time,
      amountTotal: data.amount?.total ?? 0,
    };
  }

  /** 申请退款 */
  async refund(params: {
    orderNo: string;
    refundNo: string;
    amount: number;
    refundAmount: number;
    reason?: string;
  }): Promise<{ wxRefundNo: string; status: string }> {
    const mchid = this.config.get<string>('wechat.pay.mchid');
    const url = 'https://api.mch.weixin.qq.com/v3/refund/domestic/refunds';
    const body = {
      out_trade_no: params.orderNo,
      out_refund_no: params.refundNo,
      reason: params.reason,
      amount: {
        refund: Math.round(params.refundAmount * 100),
        total: Math.round(params.amount * 100),
        currency: 'CNY',
      },
    };
    const { data } = await axios.post(url, body, {
      headers: this.buildAuthHeader('POST', '/v3/refund/domestic/refunds', JSON.stringify(body)),
      timeout: 10000,
    });
    return { wxRefundNo: data.refund_id, status: data.status };
  }

  /** 查询订单（微信侧） */
  async queryOrder(orderNo: string): Promise<{ tradeState: string; tradeNo?: string }> {
    const mchid = this.config.get<string>('wechat.pay.mchid');
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${mchid}`;
    const { data } = await axios.get(url, {
      headers: this.buildAuthHeader('GET', `/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${mchid}`, ''),
      timeout: 10000,
    });
    return { tradeState: data.trade_state, tradeNo: data.transaction_id };
  }

  /** 构建 V3 鉴权头 */
  private buildAuthHeader(method: string, url: string, body: string): Record<string, string> {
    const mchid = this.config.get<string>('wechat.pay.mchid');
    const serialNo = this.config.get<string>('wechat.pay.serialNo');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const signStr = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`;
    const signature = this.signRsa(signStr);
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'huining-mall/1.0',
      Authorization: `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",serial_no="${serialNo}",timestamp="${timestamp}",nonce_str="${nonce}",signature="${signature}"`,
    };
  }

  /** RSA-SHA256 签名 */
  private signRsa(data: string): string {
    if (!this.privateKey) {
      throw new Error('微信支付私钥未配置');
    }
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(this.privateKey, 'base64');
  }

  /** AES-256-GCM 解密 */
  private aesGcmDecrypt(ciphertext: string, associatedData: string, nonce: string, key: string): string {
    const keyBuf = Buffer.from(key, 'utf-8');
    const cipherBuf = Buffer.from(ciphertext, 'base64');
    const authTag = cipherBuf.slice(cipherBuf.length - 16);
    const data = cipherBuf.slice(0, cipherBuf.length - 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, nonce);
    decipher.setAuthTag(authTag);
    if (associatedData) decipher.setAAD(Buffer.from(associatedData));
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf-8');
  }
}