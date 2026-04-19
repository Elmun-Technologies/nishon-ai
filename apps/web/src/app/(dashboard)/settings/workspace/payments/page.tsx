'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, DataTable, Dialog } from '@/components/ui'
import { CreditCard, FileText } from 'lucide-react'
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
      <Card className="rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t('workspaceSettings.payments.paymentMethod', 'Payment method')}
            </h2>
          </div>
          <Button size="sm" type="button" variant="secondary" className="shrink-0 border-violet-500/30" onClick={() => setAddOpen(true)} disabled={!currentWorkspace?.id}>
            + {t('workspaceSettings.payments.addPaymentMethod', 'Add payment method')}
          </Button>
        </div>
        {error && <Alert className="mt-3" variant="error">{error}</Alert>}
        {loading ? (
          <p className="mt-4 text-sm text-text-tertiary">{t('workspaceSettings.payments.loading', 'Loading…')}</p>
        ) : methods.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-2/30 p-8 text-center text-sm text-text-tertiary">
            {t('workspaceSettings.payments.noMethods', 'No saved payment methods yet.')}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {methods.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-2/25 px-4 py-3 dark:bg-slate-950/40"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <input type="radio" checked={m.isDefault} readOnly className="text-violet-600" aria-label="default" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold capitalize text-text-primary">
                      {(m.brand ?? 'card').toLowerCase()} •••• {m.last4}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {m.isDefault ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                          {t('workspaceSettings.payments.defaultBadge', 'Default')}
                        </span>
                      ) : (
                        <span className="text-label text-text-tertiary">
                          {t('workspaceSettings.payments.secondaryBadge', 'Secondary')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!m.isDefault && (
                  <Button size="sm" variant="secondary" type="button" onClick={() => void setDefault(m.id)}>
                    {t('workspaceSettings.payments.setDefault', 'Set default')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t('workspaceSettings.payments.billingInformation', 'Billing information')}
            </h2>
          </div>
          <Button variant="secondary" size="sm" type="button" className="shrink-0 border-violet-500/30" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Info label="Your name" value={contact.yourName} />
          <Info label="Company" value={contact.companyName} />
          <Info label="Work email" value={contact.workEmail} />
          <Info label="Phone" value={contact.phoneNumber} />
          <Info label="Country" value={contact.country} />
          <Info label="Region" value={contact.region} />
          <Info label="City" value={contact.city} />
          <Info label="Address" value={contact.address} />
          <Info label="Postal/Zip" value={contact.postalCode} />
          <Info label="Tax ID" value={contact.taxId} />
        </div>
      </Card>

      <Card className="rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{t('workspaceSettings.payments.invoices', 'Invoices')}</h2>
          <p className="text-label text-text-tertiary">
            {invoices.length} {t('workspaceSettings.payments.invoiceCountLabel', 'total')}
          </p>
        </div>
        <div className="mt-3">
          <DataTable
            rows={invoices}
            rowKey={(row) => row.id}
            emptyMessage="No invoices yet"
            columns={[
              { key: 'no', header: 'Invoice #', render: (row) => <span className="font-medium text-text-primary">{row.invoiceNo}</span> },
              { key: 'date', header: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
              { key: 'amount', header: 'Amount', render: (row) => `$${Number(row.amount ?? 0).toFixed(2)}` },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <span className={`rounded-full px-2 py-1 text-xs ${row.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-2 text-text-tertiary'}`}>
                    {row.status}
                  </span>
                ),
              },
              {
                key: 'pdf',
                header: 'PDF',
                render: (row) =>
                  row.pdfUrl ? (
                    <a className="text-violet-600 hover:underline dark:text-violet-400" href={row.pdfUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    '—'
                  ),
              },
            ]}
          />
        </div>
      </Card>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title={t('workspaceSettings.payments.addPaymentMethod', 'Add payment method')} className="max-w-md">
        <div className="mt-2 space-y-3">
          <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <Input
            label="Card number"
            value={cardNo}
            onChange={(e) => setCardNo(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="4242424242424242"
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={() => setAddOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button size="sm" type="button" loading={saving} onClick={() => void addMethod()}>
            {t('common.save', 'Save')}
          </Button>
        </div>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title={t('workspaceSettings.payments.editContactDetails', 'Edit contact details')} className="max-w-2xl">
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Input label="Your name" value={contact.yourName ?? ''} onChange={(e) => setContact((p) => ({ ...p, yourName: e.target.value }))} />
          <Input label="Company name" value={contact.companyName ?? ''} onChange={(e) => setContact((p) => ({ ...p, companyName: e.target.value }))} />
          <Input label="Work email" value={contact.workEmail ?? ''} onChange={(e) => setContact((p) => ({ ...p, workEmail: e.target.value }))} />
          <Input label="Phone" value={contact.phoneNumber ?? ''} onChange={(e) => setContact((p) => ({ ...p, phoneNumber: e.target.value }))} />
          <Input label="Country" value={contact.country ?? ''} onChange={(e) => setContact((p) => ({ ...p, country: e.target.value }))} />
          <Input label="State/Region" value={contact.region ?? ''} onChange={(e) => setContact((p) => ({ ...p, region: e.target.value }))} />
          <Input label="City" value={contact.city ?? ''} onChange={(e) => setContact((p) => ({ ...p, city: e.target.value }))} />
          <Input label="Address" value={contact.address ?? ''} onChange={(e) => setContact((p) => ({ ...p, address: e.target.value }))} />
          <Input label="Postal/Zip code" value={contact.postalCode ?? ''} onChange={(e) => setContact((p) => ({ ...p, postalCode: e.target.value }))} />
          <Input label="Tax ID" value={contact.taxId ?? ''} onChange={(e) => setContact((p) => ({ ...p, taxId: e.target.value }))} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={() => setEditOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button size="sm" type="button" loading={saving} onClick={() => void saveContact()}>
            {t('common.apply', 'Apply')}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/20 px-3 py-2">
      <p className="text-label text-text-tertiary">{label}</p>
      <p className="mt-1 text-body-sm text-text-primary">{value?.trim() ? value : '—'}</p>
    </div>
  )
}
