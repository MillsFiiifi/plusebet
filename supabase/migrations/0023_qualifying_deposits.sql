-- ============================================================================
-- 0023 — Count qualifying deposits toward the withdrawal gate
-- ----------------------------------------------------------------------------
-- Every market now unlocks withdrawals after THREE separate qualifying
-- deposits, replacing the old cumulative "deposit X lifetime" gate. Paying the
-- whole sum in one go must NOT unlock withdrawals, so a running total can no
-- longer answer the question — we need a count of how many qualifying deposits
-- the player actually made.
--
-- A deposit qualifies when it is at or above the country's qualifying amount:
-- GHS 300 in Ghana, and each other market's verification amount (NGN 30,000,
-- KES 2,500, ZAR 350, …). See lib/countries.ts, which is the source of truth —
-- the thresholds below are a snapshot for the backfill only.
--
-- users.qualifying_deposits is incremented by applyDepositCredit() (the single
-- choke point every credit path goes through: admin credit, admin
-- 'Credit & resolve', and the Paystack / Moolre / Flutterwave / Korapay /
-- Telegram auto-credit pipelines) and decremented by reverseDeposit() when an
-- admin deletes a deposit that never should have counted.
--
-- Backfill: replay the payments ledger — every successful deposit row at or
-- above the player's country threshold counts. Players credited by hand before
-- the ledger existed start from whatever the ledger shows. Re-running is safe:
-- the update only touches rows still sitting at 0.
-- ============================================================================

alter table public.users
    add column if not exists qualifying_deposits integer not null default 0
        check (qualifying_deposits >= 0);

update public.users u
   set qualifying_deposits = l.n
  from (
        select p.user_id, count(*) as n
          from public.payments p
          join public.users cu on cu.id = p.user_id
         where p.status = 'success'
           and coalesce(p.metadata ->> 'type', 'deposit') = 'deposit'
           and p.amount >= case cu.country
                               when 'GH' then 300
                               when 'NG' then 30000
                               when 'KE' then 2500
                               when 'ZA' then 350
                               when 'UG' then 30000
                               when 'TZ' then 20000
                               when 'CM' then 5000
                               when 'ZM' then 200
                               when 'CI' then 5000
                               when 'RW' then 10000
                               when 'US' then 10
                               when 'GB' then 8
                               else 300
                           end
         group by p.user_id
       ) l
 where l.user_id = u.id
   and u.qualifying_deposits = 0;
