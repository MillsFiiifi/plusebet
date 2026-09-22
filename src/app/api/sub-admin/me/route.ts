import { NextResponse } from 'next/server'
import { currentSubAdmin } from '@/lib/sub-admin-session'
import { listUsersReferredBy, listCommissionsForSubAdmin } from '@/lib/users-store'
import { updateSubAdminPayout } from '@/lib/sub-admins-store'

export const dynamic = 'force-dynamic'

/** Longest value we'll store for any payout field. */
const MAX_PAYOUT_LEN = 120

export async function GET() {
  const sa = await currentSubAdmin()
  if (!sa) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const referredUsers = await listUsersReferredBy(sa.id)
  const commissions = await listCommissionsForSubAdmin(sa.id)

  const depositedCount = referredUsers.filter((u) => u.firstDepositAt).length

  return NextResponse.json({
    subAdmin: {
      id: sa.id,
      name: sa.name,
      email: sa.email,
      referralCode: sa.referralCode,
      approved: sa.approved,
      commissionBalance: sa.commissionBalance,
      totalCommissionEarned: sa.totalCommissionEarned,
      commissionBalances: sa.commissionBalances,
      totalCommissionEarnedBy: sa.totalCommissionEarnedBy,
      createdAt: sa.createdAt,
      payoutName: sa.payoutName ?? null,
      payoutNetwork: sa.payoutNetwork ?? null,
      payoutNumber: sa.payoutNumber ?? null,
      payoutUpdatedAt: sa.payoutUpdatedAt ?? null,
    },
    stats: {
      referrals: referredUsers.length,
      withDeposit: depositedCount,
      pending: referredUsers.length - depositedCount,
      commissionsCount: commissions.length,
    },
    referredUsers: referredUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      currency: u.currency,
      createdAt: u.createdAt,
      firstDepositAmount: u.firstDepositAmount,
      firstDepositAt: u.firstDepositAt,
      totalDeposited: u.totalDeposited,
    })),
    commissions,
  })
}

/**
 * Update the signed-in partner's payout details.
 *
 * Scoped to the session's own id and never to an id from the body — otherwise
 * any logged-in partner could redirect another partner's commission to their
 * own account by posting someone else's id.
 */
export async function PATCH(request: Request) {
  const sa = await currentSubAdmin()
  if (!sa) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const field = (v: unknown): string => (typeof v === 'string' ? v : '')
  const payout = {
    name: field(b.payoutName),
    network: field(b.payoutNetwork),
    number: field(b.payoutNumber),
  }

  for (const [key, value] of Object.entries(payout)) {
    if (value.length > MAX_PAYOUT_LEN) {
      return NextResponse.json(
        { error: `${key} must be ${MAX_PAYOUT_LEN} characters or fewer` },
        { status: 400 },
      )
    }
  }

  try {
    const updated = await updateSubAdminPayout(sa.id, payout)
    return NextResponse.json({
      payoutName: updated.payoutName ?? null,
      payoutNetwork: updated.payoutNetwork ?? null,
      payoutNumber: updated.payoutNumber ?? null,
      payoutUpdatedAt: updated.payoutUpdatedAt ?? null,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[sub-admin/me] payout update failed:', message)
    return NextResponse.json({ error: 'could not save payout details' }, { status: 500 })
  }
}
