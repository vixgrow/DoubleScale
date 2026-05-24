export interface PaymentItem {
  item?: string;
  price?: number;
  duration?: string;
}

export interface GroupPricingSettings {
  enabled: boolean;
  base_price: number;
  additional_person_price: number;
}

export interface GroupPricingBreakdown {
  person_count: number;
  base_price: number;
  additional_person_price: number;
  additional_persons: number;
  additional_total: number;
  total: number;
}

export interface PaymentsSettings {
  enable_payment: boolean;
  type: 'native';
  enable_items_based_on_duration: boolean;
  items: PaymentItem[];
  multi_duration_items: {
    [key: string]: PaymentItem;
  };
  payment_methods?: string[];
  enable_stripe: boolean;
  currency?: string;
  group_pricing?: GroupPricingSettings;
}
