'use client'

import { useEffect, useState } from 'react'
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
    if (!currentWorkspace?.id) { setLoading(false); return }
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

  useEffect(() => { void loadAll() }, [currentWorkspace?.id])

  async function addMethod() {
    if (!currentWorkspace?.id || cardNo.length < 4) return
    setSaving(true)
    try {
      await billing.addPaymentMethod({ workspaceId: currentWorkspace.id, brand, last4: cardNo.slice(-4), isDefault: methods.length === 0 })
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
    <div className="space-y-4">
      {/* Payment method */}
      <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        <div className="flex flex-col gap-3 px-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t('workspaceSettings.payments.paymentMethod', 'Payment method')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            disabled={!currentWorkspace?.id}
            className="shrink-0 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-2 disabled:opacity-50 dark:bg-slate-800"
          >
            + {t('workspaceSettings.payments.addPaymentMethod', 'Add payment method')}
          </button>
        </div>

        {error && <div className="mx-6 mt-3"><Alert variant="error">{error}</Alert></div>}

        <div className="px-6 pb-6 pt-4">
          {loading ? (
            <p className="text-sm text-text-tertiary">{t('workspaceSettings.payments.loading', 'Loading…')}</p>
          ) : methods.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-text-tertiary">
              {t('workspaceSettings.payments.noMethods', 'No saved payment methods yet.')}
            </div>
          ) : (
            <div className="space-y-2">
              {methods.map((m) => (
                <div key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/20 px-4 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <input type="radio" checked={m.isDefault} readOnly className="text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold capitalize text-text-primary">
                        {(m.brand ?? 'card').toLowerCase()} •••• {m.last4}
                      </p>
                      {m.isDefault ? (
                        <span className="mt-0.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                          {t('workspaceSettings.payments.defaultBadge', 'Default')}
                        </span>
                      ) : (
                        <span className="text-xs text-text-tertiary">
                          {t('workspaceSettings.payments.secondaryBadge', 'Secondary')}
                        </span>
                      )}
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
        </div>
      </div>

      {/* Billing info */}
      <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        <div className="flex flex-col gap-3 px-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t('workspaceSettings.payments.billingInformation', 'Billing information')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="shrink-0 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-2 dark:bg-slate-800"
          >
            Edit
          </button>
        </div>
        <div className="grid gap-3 px-6 pb-6 pt-4 sm:grid-cols-2">
          <InfoField label="Your name" value={contact.yourName} />
          <InfoField label="Company" value={contact.companyName} />
          <InfoField label="Work email" value={contact.workEmail} />
          <InfoField label="Phone" value={contact.phoneNumber} />
          <InfoField label="Country" value={contact.country} />
          <InfoField label="Region" value={contact.region} />
          <InfoField label="City" value={contact.city} />
          <InfoField label="Address" value={contact.address} />
          <InfoField label="Postal/Zip" value={contact.postalCode} />
          <InfoField label="Tax ID" value={contact.taxId} />
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {t('workspaceSettings.payments.invoices', 'Invoices')}
          </h2>
          <span className="text-sm text-text-tertiary">{invoices.length} {t('workspaceSettings.payments.invoiceCountLabel', 'total')}</span>
        </div>
        <div className="px-6 pb-6">
          <DataTable
            rows={invoices}
            rowKey={(row) => row.id}
            emptyMessage="No invoices yet"
            columns={[
              { key: 'no', header: 'Invoice #', render: (row) => <span className="font-medium text-text-primary">{row.invoiceNo}</span> },
              { key: 'date', header: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
              { key: 'amount', header: 'Amount', render: (row) => `$${Number(row.amount ?? 0).toFixed(2)}` },
              {
                key: 'status', header: 'Status',
                render: (row) => (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${row.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-surface-2 text-text-tertiary'}`}>
                    {row.status}
                  </span>
                ),
              },
              {
                key: 'pdf', header: 'PDF',
                render: (row) => row.pdfUrl
                  ? <a className="text-emerald-600 hover:underline" href={row.pdfUrl} target="_blank" rel="noreferrer">Open</a>
                  : '—',
              },
            ]}
          />
        </div>
      </div>

      {/* Add method dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)}
        title={t('workspaceSettings.payments.addPaymentMethod', 'Add payment method')} className="max-w-md">
        <div className="mt-2 space-y-3">
          <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <Input label="Card number" value={cardNo} placeholder="4242424242424242"
            onChange={(e) => setCardNo(e.target.value.replace(/[^\d]/g, ''))} />
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

      {/* Edit contact dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}
        title={t('workspaceSettings.payments.editContactDetails', 'Edit contact details')} className="max-w-2xl">
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

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/10 px-3 py-2.5">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="mt-0.5 text-sm text-text-primary">{value?.trim() ? value : '—'}</p>
    </div>
  )
}
