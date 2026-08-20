export type GttOrderDto = {
  transactionType: string;
  quantity: number;
  product: string;
  orderType: string;
  price: number;
};

export type GttDto = {
  id: number;
  type: string;
  status: string;
  tradingsymbol: string;
  exchange: string;
  lastPrice: number;
  triggerValues: number[];
  expiresAt: string;
  orders: GttOrderDto[];
};
