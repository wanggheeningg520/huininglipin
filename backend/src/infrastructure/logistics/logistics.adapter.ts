/** 物流轨迹统一结构 */
export interface LogisticsTrace {
  time: string;
  content: string;
}

export interface LogisticsResult {
  company: string;
  trackNo: string;
  traces: LogisticsTrace[];
  isSigned: boolean;
}

/** 物流适配器统一接口（对应 design.md 2.1.2 logistics.adapter） */
export interface LogisticsAdapter {
  query(company: string, trackNo: string): Promise<LogisticsResult>;
  readonly name: string;
}