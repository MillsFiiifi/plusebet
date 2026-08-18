-- ============================================================================
-- 0022 — Sub-admin payout details
-- ----------------------------------------------------------------------------
-- Where a partner wants their commission sent. Commission balances were
-- already tracked per currency, but there was nowhere to record the account to
-- pay them into — the admin had to ask each partner out-of-band, which does
-- not scale and leaves no record of what was agreed.
--
-- The partner fills these in from their own dashboard; the admin reads them on
-- the sub-admins page when settling up.
--
-- Deliberately free-text rather than a constrained enum of networks: partners
-- span GH/NG/KE/ZA and beyond (MTN, Telecel, AirtelTigo, OPay, M-Pesa, plus
-- ordinary banks), and a whitelist here would silently block a legitimate
-- payout method the moment a new market opens.
--
-- Nullable throughout: existing partners have none of this yet, and a partner
-- must not be locked out of their dashboard for not having filled it in.
-- ============================================================================

alter table public.sub_admins
    add column if not exists payout_name    text,
    add column if not exists payout_network text,
    add column if not exists payout_number  text,
    add column if not exists payout_updated_at timestamptz;
