import { Settings, PriceBreakdown } from './types';

export function calculatePrice(
  P: number, 
  L: number, 
  W: number, 
  settings: Settings
): PriceBreakdown {
  const { 
    discount_multiplier: D, 
    freight_rate_per_meter_eur: F,
    customs_numerator: CN,
    customs_denominator: CD,
    warranty_rate: WR,
    commission_factor: COM,
    office_factor: OFF,
    profit_factor: PF,
    rounding_mode,
    rounding_step
  } = settings;

  // 1. Company Price
  const CompanyPriceEUR = P * D;

  // 2. Shipment
  const ShipmentEUR = L * F;

  // 3. Customs
  const CustomEUR = W * (CN / CD);

  // 4. Warranty (Based on CompanyPrice)
  const WarrantyEUR = CompanyPriceEUR * WR;

  // 5. Subtotal
  const SubtotalEUR = CompanyPriceEUR + ShipmentEUR + CustomEUR + WarrantyEUR;

  // 6. Commission
  const AfterCommission = SubtotalEUR / COM;

  // 7. Office
  const AfterOffice = AfterCommission / OFF;

  // 8. Final Sell Price
  let SellPriceEUR = AfterOffice / PF;

  // Rounding
  if (rounding_mode === 'ceil') {
    SellPriceEUR = Math.ceil(SellPriceEUR / rounding_step) * rounding_step;
  } else if (rounding_mode === 'round') {
    SellPriceEUR = Math.round(SellPriceEUR / rounding_step) * rounding_step;
  }

  return {
    P, L, W, D, F, CN, CD, WR, COM, OFF, PF,
    CompanyPriceEUR, ShipmentEUR, CustomEUR, WarrantyEUR, SubtotalEUR, 
    AfterCommission, AfterOffice, FinalSellPrice: SellPriceEUR
  };
}
