'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, DataTable, Dialog } from '@/components/ui'
import { CreditCard, FileText, Receipt, Plus, Star } from 'lucide-react'
import { billing } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'

type PaymentMethod = {
  id: string
  brand: string | null
  last4: string
  isDefault: boolean
}

type BillingContact = {
  yourName?: string
  companyName?: string
  workEmail?: string
  phoneNumber?: string
  country?: string
  region?: string
  city?: string
  address?: string
  postalCode?: string
  taxId?: string
}

type InvoiceRow = {
  id: string
  invoiceNo: string
  amount: number
  status: string
  createdAt: string
  pdfUrl?: string | null
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="text-sm text-text-primary">{value?.trim() ? value : '—'}</p>
    </div>
  )
}

export default function WorkspacePaymentsPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [contact, setContact] = useState<BillingContact>({})
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [brand, setBrand] = useState('visa')
  const [cardNo, setCardNo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadAll() {
    if (!currentWorkspace?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [methodsRes, contactRes, invoicesRes] = await Promise.all([
        billing.listPaymentMethods(currentWorkspace.id),
        billing.getBillingContact(currentWorkspace.id),
        billing.listInvoices(currentWorkspace.id),
      ])
      setMethods((methodsRes.data as PaymentMethod[]) ?? [])
      setContact((contactRes.data as BillingContact) ?? {})
      setInvoices((invoicesRes.data as InvoiceRow[]) ?? [])
    } catch (e: any) {
      setError(e?.message ?? t('workspaceSettings.payments.loadError', 'Failed to load payment data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [currentWorkspace?.id])

  async function addMethod() {
    if (!currentWorkspace?.id || cardNo.length < 4) return
    setSaving(true)
    try {
      await billing.addPaymentMethod({
        workspaceId: currentWorkspace.id,
        brand,
        last4: cardNo.slice(-4),
        isDefault: methods.length === 0,
      })
      setAddOpen(false)
      setCardNo('')
      await loadAll()
    } catch (e: any) {
      setError(e?.message ?? t('workspaceSettings.payments.addCardError', 'Failed to add card'))
    } finally {
      setSaving(false)
    }
  }

  async function setDefault(methodId: string) {
    if (!currentWorkspace?.id) return
    await billing.setDefaultPaymentMethod(currentWorkspace.id, methodId)
    await loadAll()
  }

  async function saveContact() {
    if (!currentWorkspace?.id) return
    setSaving(true)
    try {
      await billing.updateBillingContact(currentWorkspace.id, contact)
      setEditOpen(false)
      await loadAll()
    } catch (e: any) {
      setError(e?.message ?? t('workspaceSettings.payments.saveBillingError', 'Failed to save billing info'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" className="rounded-2xl">
          {error}
        </Alert>
      )}

      {/* ── Payment methods ─────────────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6">
        <SectionHeader
          icon={CreditCard}
          title={t('workspaceSettings.payments.paymentMethod', 'Payment method')}
          description={t('workspaceSettings.payments.paymentMethodDesc', 'Cards saved to this workspace for subscription billing.')}
          action={
            <Button
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setAddOpen(true)}
              disabled={!currentWorkspace?.id}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('workspaceSettings.payments.addPaymentMethod', 'Add method')}
            </Button>
          }
        />

        <div className="mt-5">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2/60" />
              ))}
            </div>
          ) : methods.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-2/30 px-6 py-10 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-text-tertiary/50" />
              <p className="mt-3 text-sm font-medium text-text-tertiary">
                {t('workspaceSettings.payments.noMethods', 'No saved payment methods yet.')}
              </p>
              <Button
                size="sm"
                type="button"
                className="mt-4 gap-1.5"
                onClick={() => setAddOpen(true)}
                disabled={!currentWorkspace?.id}
              >
                <Plus className="h-3.5 w-3.5" />
                {t('workspaceSettings.payments.addPaymentMethod', 'Add payment method')}
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {methods.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface-2/25 px-4 py-3.5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-surface text-xs font-bold uppercase text-text-secondary">
                      {(m.brand ?? 'card').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold capitalize text-text-primary">
                        {(m.brand ?? 'card').toLowerCase()} •••• {m.last4}
                      </p>
                      {m.isDefault && (
                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-brand-lime/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-ink dark:text-brand-lime">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          {t('workspaceSettings.payments.defaultBadge', 'Default')}
                        </span>
                      )}
                    </div>
                  </div>
                  {!m.isDefault && (
                    <Button size="sm" variant="secondary" type="button" onClick={() => void setDefault(m.id)}>
                      {t('workspaceSettings.payments.setDefault', 'Set default')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Billing information ─────────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6">
        <SectionHeader
          icon={FileText}
          title={t('workspaceSettings.payments.billingInformation', 'Billing information')}
          description={t('workspaceSettings.payments.billingInfoDesc', 'Used on invoices and receipts for this workspace.')}
          action={
            <Button variant="secondary" size="sm" type="button" onClick={() => setEditOpen(true)}>
              {t('common.edit', 'Edit')}
            </Button>
          }
        />
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          <InfoField label="Your name" value={contact.yourName} />
          <InfoField label="Company" value={contact.companyName} />
          <InfoField label="Work email" value={contact.workEmail} />
          <InfoField label="Phone" value={contact.phoneNumber} />
          <InfoField label="Country" value={contact.country} />
          <InfoField label="Region" value={contact.region} />
          <InfoField label="City" value={contact.city} />
          <InfoField label="Address" value={contact.address} />
          <InfoField label="Postal / Zip" value={contact.postalCode} />
          <InfoField label="Tax ID" value={contact.taxId} />
        </div>
      </section>

      {/* ── Invoices ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6">
        <SectionHeader
          icon={Receipt}
          title={t('workspaceSettings.payments.invoices', 'Invoices')}
          description={`${invoices.length} ${t('workspaceSettings.payments.invoiceCountLabel', 'total')}`}
        />
        <div className="mt-5">
          <DataTable
            rows={invoices}
            rowKey={(row) => row.id}
            emptyMessage={t('workspaceSettings.payments.noInvoices', 'No invoices yet.')}
            columns={[
              {
                key: 'no',
                header: 'Invoice #',
                render: (row) => <span className="font-mono text-sm font-medium text-text-primary">{row.invoiceNo}</span>,
              },
              {
                key: 'date',
                header: 'Date',
                render: (row) => <span className="text-sm text-text-secondary">{new Date(row.createdAt).toLocaleDateString()}</span>,
              },
              {
                key: 'amount',
                header: 'Amount',
                render: (row) => <span className="text-sm font-semibold text-text-primary">${Number(row.amount ?? 0).toFixed(2)}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      row.status === 'paid'
                        ? 'bg-brand-lime/15 text-brand-ink dark:text-brand-lime'
                        : 'bg-surface-2 text-text-tertiary'
                    }`}
                  >
                    {row.status}
                  </span>
                ),
              },
              {
                key: 'pdf',
                header: 'PDF',
                render: (row) =>
                  row.pdfUrl ? (
                    <a
                      className="text-sm font-medium text-brand-mid underline-offset-2 hover:underline dark:text-brand-lime"
                      href={row.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  ),
              },
            ]}
          />
        </div>
      </section>

      {/* ── Add payment method dialog ─────────────────────────── */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('workspaceSettings.payments.addPaymentMethod', 'Add payment method')}
        className="max-w-md"
      >
        <div className="mt-4 space-y-3">
          <Input
            label={t('workspaceSettings.payments.brand', 'Brand')}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="visa / mastercard"
          />
          <Input
            label={t('workspaceSettings.payments.cardNumber', 'Card number')}
            value={cardNo}
            onChange={(e) => setCardNo(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="4242 4242 4242 4242"
            maxLength={16}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={() => setAddOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button size="sm" type="button" loading={saving} onClick={() => void addMethod()} disabled={cardNo.length < 4}>
            {t('common.save', 'Save card')}
          </Button>
        </div>
      </Dialog>

      {/* ── Edit billing contact dialog ───────────────────────── */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('workspaceSettings.payments.editContactDetails', 'Edit billing information')}
        className="max-w-2xl"
      >
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label="Your name" value={contact.yourName ?? ''} onChange={(e) => setContact((p) => ({ ...p, yourName: e.target.value }))} />
          <Input label="Company name" value={contact.companyName ?? ''} onChange={(e) => setContact((p) => ({ ...p, companyName: e.target.value }))} />
          <Input label="Work email" value={contact.workEmail ?? ''} onChange={(e) => setContact((p) => ({ ...p, workEmail: e.target.value }))} />
          <Input label="Phone" value={contact.phoneNumber ?? ''} onChange={(e) => setContact((p) => ({ ...p, phoneNumber: e.target.value }))} />
          <Input label="Country" value={contact.country ?? ''} onChange={(e) => setContact((p) => ({ ...p, country: e.target.value }))} />
          <Input label="State / Region" value={contact.region ?? ''} onChange={(e) => setContact((p) => ({ ...p, region: e.target.value }))} />
          <Input label="City" value={contact.city ?? ''} onChange={(e) => setContact((p) => ({ ...p, city: e.target.value }))} />
          <Input label="Address" value={contact.address ?? ''} onChange={(e) => setContact((p) => ({ ...p, address: e.target.value }))} />
          <Input label="Postal / Zip code" value={contact.postalCode ?? ''} onChange={(e) => setContact((p) => ({ ...p, postalCode: e.target.value }))} />
          <Input label="Tax ID" value={contact.taxId ?? ''} onChange={(e) => setContact((p) => ({ ...p, taxId: e.target.value }))} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={() => setEditOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button size="sm" type="button" loading={saving} onClick={() => void saveContact()}>
            {t('common.apply', 'Save changes')}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
