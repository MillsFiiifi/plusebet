'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Copy,
  Check,
  LogOut,
  Loader2,
  Users,
  Wallet,
  AlertTriangle,
  ChevronDown,
  Landmark,
  Search,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Brand } from '@/components/brand'
import { formatMoney } from '@/lib/format-money'
import { COMMISSION_RATE } from '@/lib/domain-types'
import { SubAdminBettingAccount } from '@/components/sub-admin-betting-account'

/** "GHS 12.34 · NGN 5,000.00" — single-line summary of a currency map. */
function formatCurrencyMap(map: Record<string, number> | undefined): string {
  if (!map) return '—'
  const entries = Object.entries(map).filter(([, v]) => v > 0)
  if (entries.length === 0) return '—'
  return entries.map(([cur, amt]) => `${cur} ${formatMoney(amt, cur)}`).join(' · ')
}

interface MeResponse {
  subAdmin: {
    id: string
    name: string
    email: string
    referralCode: string
    approved: boolean
    commissionBalance: number
    totalCommissionEarned: number
    commissionBalances: Record<string, number>
    totalCommissionEarnedBy: Record<string, number>
    createdAt: string
    payoutName: string | null
    payoutNetwork: string | null
    payoutNumber: string | null
    payoutUpdatedAt: string | null
  }
  stats: {
    referrals: number
    withDeposit: number
    pending: number
    commissionsCount: number
  }
  referredUsers: {
    id: string
    name: string
    email: string
    currency: string
    createdAt: string
    firstDepositAmount: number
    firstDepositAt?: string
    totalDeposited: number
  }[]
  commissions: {
    id: string
    userId: string
    depositAmount: number
    commission: number
    currency: string
    rate: number
    createdAt: string
  }[]
}

/**
 * Collapsible section. The partner dashboard is a long single column on a
 * phone, and the sections below the fold (payout details, the referred-user
 * list) are reference material rather than things you read every visit —
 * collapsing them keeps the code and the day's earnings reachable without
 * scrolling past everything else.
 */
function Collapsible({
  icon,
  title,
  count,
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left hover:bg-secondary/40 transition-colors"
      >
        {icon}
        <span className="font-semibold text-sm">{title}</span>
        {count !== undefined && (
          <span className="text-sm text-muted-foreground tabular-nums">({count})</span>
        )}
        <ChevronDown
          className={`w-4 h-4 ml-auto shrink-0 text-muted-foreground transition-transform ${
            open ? '' : '-rotate-90'
          }`}
        />
      </button>
      {open && <div className="border-t border-border">{children}</div>}
    </section>
  )
}

/**
 * Where the admin should send this partner's commission.
 *
 * Saved separately from the rest of the dashboard, which is read-only and
 * polls every 30s — folding these inputs into that refresh would overwrite
 * whatever the partner was mid-way through typing.
 */
function PayoutDetails({
  initial,
  onSaved,
}: {
  initial: { name: string; network: string; number: string; updatedAt: string | null }
  onSaved: () => void
}) {
  const [name, setName] = useState(initial.name)
  const [network, setNetwork] = useState(initial.network)
  const [number, setNumber] = useState(initial.number)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const dirty =
    name !== initial.name || network !== initial.network || number !== initial.number

  const save = async () => {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/sub-admin/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutName: name,
          payoutNetwork: network,
          payoutNumber: number,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setErr(body.error ?? 'Could not save. Please try again.')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved()
    } catch {
      setErr('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    placeholder: string,
    inputMode?: 'numeric',
  ) => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={120}
        className="mt-1 w-full px-3 py-2.5 bg-secondary border border-border rounded-md text-sm outline-none focus:border-primary transition-colors"
      />
    </label>
  )

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-muted-foreground">
        Set where admin should send your commissions.
      </p>
      {field('Account Name', name, setName, 'John Doe')}
      {field('Network / Bank', network, setNetwork, 'MTN')}
      {field('Account Number', number, setNumber, '024 000 0000', 'numeric')}

      {err && <p className="text-xs text-destructive">{err}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={() => void save()} disabled={busy || !dirty} size="sm">
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          {saved ? 'Saved' : 'Save details'}
        </Button>
        {initial.updatedAt && !dirty && (
          <span className="text-[11px] text-muted-foreground">
            Updated {new Date(initial.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  )
}

export default function SubAdminDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<MeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [query, setQuery] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/sub-admin/me', { cache: 'no-store' })
      if (res.status === 401) {
        router.push('/sub-admin/login?next=/sub-admin/dashboard')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData((await res.json()) as MeResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    void load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    await fetch('/api/sub-admin/logout', { method: 'POST' })
    router.push('/sub-admin/login')
    router.refresh()
  }

  const copy = async (text: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* ignore */
    }
  }

  /**
   * Hand the link to the OS share sheet, which is how a partner actually
   * distributes it — straight into WhatsApp or Telegram rather than via the
   * clipboard. Falls back to copying on desktop, where share() is usually
   * absent, so the button always does something useful.
   */
  const share = async (link: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Betlixx',
          text: `Join Betlixx with my code ${data?.subAdmin.referralCode ?? ''}`,
          url: link,
        })
        return
      } catch {
        // Share sheet dismissed — fall through to copy rather than doing
        // nothing, so a cancelled share still leaves the link in hand.
      }
    }
    await copy(link, 'link')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          Failed to load dashboard: {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    )
  }

  const sa = data.subAdmin
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const referralLink = `${origin}/register?ref=${sa.referralCode}`
  const q = query.trim().toLowerCase()
  const visibleUsers = q
    ? data.referredUsers.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      )
    : data.referredUsers

  // Sum commissions whose createdAt falls in the current local day.
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayCommissions: Record<string, number> = {}
  let todayCount = 0
  for (const c of data.commissions) {
    if (new Date(c.createdAt) >= todayStart) {
      todayCommissions[c.currency] = +((todayCommissions[c.currency] ?? 0) + c.commission).toFixed(2)
      todayCount++
    }
  }

  // Group every commission by local calendar day so each day's earnings are
  // preserved as history once the day rolls over. The lifetime balance is never
  // reset — this is just a per-day view of what was earned.
  const dayStartMs = (d: Date) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x.getTime()
  }
  const todayKey = dayStartMs(new Date())
  const yesterdayKey = todayKey - 86_400_000
  const byDay = new Map<number, { totals: Record<string, number>; count: number }>()
  for (const c of data.commissions) {
    const k = dayStartMs(new Date(c.createdAt))
    const entry = byDay.get(k) ?? { totals: {}, count: 0 }
    entry.totals[c.currency] = +((entry.totals[c.currency] ?? 0) + c.commission).toFixed(2)
    entry.count++
    byDay.set(k, entry)
  }
  const dailyEarnings = [...byDay.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([k, v]) => ({
      key: k,
      label:
        k === todayKey
          ? 'Today'
          : k === yesterdayKey
            ? 'Yesterday'
            : new Date(k).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }),
      totals: v.totals,
      count: v.count,
    }))

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Brand href="/" pro={false} size={24} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5 shrink-0">
              Partner
            </span>
            <span className="text-sm text-foreground truncate hidden sm:inline">
              {sa.name}
            </span>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {!sa.approved && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
            <div className="text-amber-500">
              Your account is awaiting approval. Referrals already work, but commissions
              won&apos;t be credited until the main admin approves you.
            </div>
          </div>
        )}

        {/* Share your code — the reason a partner opens this page at all, so it
            leads and the code itself is the largest thing on the screen. */}
        <section className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            Share your code
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="font-mono text-4xl sm:text-5xl font-bold tracking-widest text-primary leading-none">
              {sa.referralCode}
            </p>
            <Button
              size="sm"
              onClick={() => void copy(sa.referralCode, 'code')}
              className="ml-auto shrink-0 gap-1.5"
            >
              {copied === 'code' ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Earn <b>{Math.round(COMMISSION_RATE * 100)}%</b> on every deposit from
            referred users.
          </p>

          <div className="flex gap-2 mt-3">
            <input
              readOnly
              value={referralLink}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Your referral link"
              className="flex-1 min-w-0 px-3 py-2.5 bg-secondary border border-border rounded-md text-xs font-mono truncate"
            />
            <Button
              size="sm"
              onClick={() => void share(referralLink)}
              aria-label="Share referral link"
              className="shrink-0 h-auto px-3.5"
            >
              {copied === 'link' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </section>

        {/* KPI tiles */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Kpi
            icon={<Users className="w-4 h-4 text-primary" />}
            label="Referrals"
            value={data.stats.referrals.toString()}
            sub={`${data.stats.withDeposit} with deposit`}
          />
          <Kpi
            icon={<Wallet className="w-4 h-4 text-success" />}
            label="Today's commission"
            value={formatCurrencyMap(todayCommissions)}
            sub={`${todayCount} deposit${todayCount === 1 ? '' : 's'} today`}
            tone="good"
          />
        </section>

        {sa.approved && <SubAdminBettingAccount />}

        {/* Payout details — collapsed by default; a partner sets this once and
            then rarely returns to it. */}
        <Collapsible
          icon={<Landmark className="w-4 h-4 text-muted-foreground" />}
          title="Payout Details"
          defaultOpen={!sa.payoutNumber}
        >
          <PayoutDetails
            initial={{
              name: sa.payoutName ?? '',
              network: sa.payoutNetwork ?? '',
              number: sa.payoutNumber ?? '',
              updatedAt: sa.payoutUpdatedAt,
            }}
            onSaved={() => void load()}
          />
        </Collapsible>

        {/* Daily earnings history */}
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold">Daily earnings</h2>
            <p className="text-xs text-muted-foreground">
              What you earned each day. Today&apos;s total rolls into history when the
              next day starts — your balance is never reset.
            </p>
          </header>
          {dailyEarnings.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No commission yet. Earnings will appear here day by day.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {dailyEarnings.map((d) => (
                <li
                  key={d.key}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm flex items-center gap-2">
                      {d.label}
                      {d.key === todayKey && (
                        <span className="text-[9px] uppercase tracking-wide text-success border border-success/30 bg-success/10 rounded-full px-1.5 py-0.5">
                          Live
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.count} deposit{d.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-success text-right">
                    +{formatCurrencyMap(d.totals)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Referred users */}
        <Collapsible
          icon={<Users className="w-4 h-4 text-muted-foreground" />}
          title="Referred Users"
          count={data.referredUsers.length}
          defaultOpen
        >
          {data.referredUsers.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No referrals yet. Share your code or link to get started.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mr-auto">
                  Referred users
                </p>
                <div className="relative w-full max-w-[220px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search user…"
                    aria-label="Search referred users"
                    className="w-full pl-8 pr-3 py-2 bg-secondary border border-border rounded-md text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              {visibleUsers.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No user matches “{query}”.
                </p>
              )}
              <div className="hidden md:grid grid-cols-[1fr_180px_120px_120px_120px] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border bg-secondary/40">
                <span>User</span>
                <span>Signed up</span>
                <span className="text-right">First deposit</span>
                <span className="text-right">Total deposited</span>
                <span className="text-right">Today&apos;s commission</span>
              </div>
              <ul className="divide-y divide-border">
                {visibleUsers.map((u) => {
                  const userCommissions = data.commissions.filter(
                    (c) => c.userId === u.id && new Date(c.createdAt) >= todayStart,
                  )
                  const totalCommission = userCommissions.reduce((sum, c) => sum + c.commission, 0)
                  const commissionCurrency = userCommissions[0]?.currency ?? u.currency
                  return (
                    <li key={u.id} className="px-4 py-3">
                      <div className="md:grid md:grid-cols-[1fr_180px_120px_120px_120px] md:gap-3 md:items-center flex flex-col gap-1">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {new Date(u.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <div className="md:text-right">
                          {u.firstDepositAt ? (
                            <p className="text-sm font-bold tabular-nums">
                              {u.currency} {formatMoney(u.firstDepositAmount, u.currency)}
                            </p>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pending</span>
                          )}
                        </div>
                        <p className="md:text-right text-sm tabular-nums">
                          {u.currency} {formatMoney(u.totalDeposited, u.currency)}
                        </p>
                        <p
                          className={`md:text-right text-sm font-bold tabular-nums ${
                            userCommissions.length > 0 ? 'text-success' : 'text-muted-foreground'
                          }`}
                        >
                          {userCommissions.length > 0
                            ? `+${commissionCurrency} ${formatMoney(totalCommission, commissionCurrency)}`
                            : '—'}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </Collapsible>
      </main>
    </div>
  )
}

function Kpi({
  icon,
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  tone?: 'good' | 'bad' | 'neutral'
}) {
  const color =
    tone === 'good'
      ? 'text-success'
      : tone === 'bad'
        ? 'text-destructive'
        : 'text-foreground'
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          {label}
        </p>
        {icon}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}
