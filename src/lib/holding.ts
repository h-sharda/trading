export type HoldingDto = {
  tradingsymbol: string;
  exchange: string;
  product: string;
  isin: string;
  quantity: number;
  t1Quantity: number;
  usedQuantity: number;
  realisedQuantity: number;
  authorisedQuantity: number;
  authorisedDate: string;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  dayChange: number;
  dayChangePercentage: number;
};

export function holdingNeedsEdis(holding: HoldingDto) {
  return Boolean(holding.isin) && holding.realisedQuantity > holding.authorisedQuantity;
}
