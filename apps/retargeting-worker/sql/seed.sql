INSERT INTO retargeting_audiences (name, platform, rule, budget_share_pct)
VALUES
  ('Warm_7d', 'meta', '{"builtin":"Warm_7d"}', 15.00),
  ('Cart_NoPurchase_3d', 'meta', '{"builtin":"Cart_NoPurchase_3d"}', 20.00),
  ('Telegram_PriceAsk_NoPay', 'meta', '{"builtin":"Telegram_PriceAsk_NoPay"}', 15.00),
  ('VIP_ClickPaid_180d', 'meta', '{"builtin":"VIP_ClickPaid_180d"}', 25.00),
  ('Telegram_Start_WebsiteOptional', 'meta', '{"builtin":"Telegram_Start_WebsiteOptional"}', 10.00)
ON CONFLICT (name) DO NOTHING;
