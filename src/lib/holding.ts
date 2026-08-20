export type HoldingDto = {
  tradingsymbol: string;
  exchange: string;
  product: string;
  quantity: number;
  t1Quantity: number;
  usedQuantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  dayChange: number;
  dayChangePercentage: number;
};
