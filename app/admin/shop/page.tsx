'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Clock3,
  Coins,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  EmptyState,
  Field,
  Input,
  Modal,
  SearchInput,
  Segmented,
  Select,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { date, number } from '@/lib/format'
import type { Order, OrderStatus, Product } from '@/lib/types'

type ProductStatus = Product['status']

const PRODUCT_STATUS: Record<ProductStatus, { label: string; tone: 'success' | 'gray' | 'danger' }> = {
  active: { label: 'Faol', tone: 'success' },
  draft: { label: 'Draft', tone: 'gray' },
  out: { label: 'Tugagan', tone: 'danger' },
}

const ORDER_STATUS: Record<OrderStatus, { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Kutilmoqda', tone: 'warning' },
  done: { label: 'Bajarildi', tone: 'success' },
  cancelled: { label: 'Bekor qilindi', tone: 'danger' },
}

const EMPTY_PRODUCT: Product = {
  id: '',
  name: '',
  description: '',
  category: 'Aksesuar',
  price: 500,
  stock: 0,
  status: 'active',
  image: null,
  emoji: '🎁',
  sold: 0,
}

export default function ShopPage() {
  const products = useAppStore((state) => state.products)
  const orders = useAppStore((state) => state.orders)
  const upsertProduct = useAppStore((state) => state.upsertProduct)
  const deleteProduct = useAppStore((state) => state.deleteProduct)
  const changeOrderStatus = useAppStore((state) => state.setOrderStatus)
  const { toast } = useToast()

  const [tab, setTab] = useState<'products' | 'orders'>('products')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [productStatus, setProductStatus] = useState<'all' | ProductStatus>('all')

  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const [orderStatus, setOrderStatus] = useState<'all' | OrderStatus>('all')
  const [orderPeriod, setOrderPeriod] = useState('90')
  const [orderSearch, setOrderSearch] = useState('')

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((product) => {
      if (category !== 'all' && product.category !== category) return false
      if (productStatus !== 'all' && product.status !== productStatus) return false
      if (term && !product.name.toLowerCase().includes(term)) return false
      return true
    })
  }, [products, category, productStatus, search])

  const orderCounts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((order) => order.status === 'pending').length,
      done: orders.filter((order) => order.status === 'done').length,
      cancelled: orders.filter((order) => order.status === 'cancelled').length,
    }),
    [orders],
  )

  const filteredOrders = useMemo(() => {
    const term = orderSearch.trim().toLowerCase()
    const limit = orderPeriod === 'all' ? Infinity : Number(orderPeriod) * 86_400_000
    const anchor = new Date('2026-11-08T09:00:00+05:00').getTime()
    return orders
      .filter((order) => {
        if (orderStatus !== 'all' && order.status !== orderStatus) return false
        if (limit !== Infinity && anchor - new Date(order.createdAt).getTime() > limit) return false
        if (term && !`${order.userName} ${order.productName} ${order.id}`.toLowerCase().includes(term))
          return false
        return true
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }, [orders, orderStatus, orderPeriod, orderSearch])

  const pendingOrders = useMemo(
    () => filteredOrders.filter((order) => order.status === 'pending'),
    [filteredOrders],
  )
  const historyOrders = useMemo(
    () => filteredOrders.filter((order) => order.status !== 'pending'),
    [filteredOrders],
  )

  const activeProducts = products.filter((product) => product.status === 'active').length
  const totalStock = products.reduce((total, product) => total + product.stock, 0)
  const totalSold = products.reduce((total, product) => total + product.sold, 0)

  const saveProduct = (product: Product) => {
    if (!product.name.trim()) {
      toast({ title: 'Mahsulot nomini kiriting', tone: 'warning' })
      return
    }
    const next: Product = {
      ...product,
      id: product.id || `product-${Date.now()}`,
      name: product.name.trim(),
      description: product.description.trim(),
    }
    upsertProduct(next)
    toast({
      title: product.id ? 'Mahsulot yangilandi' : 'Mahsulot qo\'shildi',
      description: next.name,
    })
    setEditing(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteProduct(deleteTarget.id)
    toast({ title: 'Mahsulot o\'chirildi', description: deleteTarget.name })
    setDeleteTarget(null)
  }

  const updateOrder = (order: Order, status: OrderStatus) => {
    changeOrderStatus(order.id, status)
    toast({
      title: status === 'done' ? 'Buyurtma bajarildi' : 'Buyurtma bekor qilindi',
      description: `${order.id} · ${order.userName}`,
      tone: status === 'done' ? 'success' : 'warning',
    })
  }

  return (
    <PageTransition>
      <div className="flex h-[calc(100dvh-177px)] flex-col gap-2.5 overflow-hidden min-[430px]:h-[calc(100dvh-153px)] sm:gap-3.5 sm:h-[calc(100dvh-161px)] [@media(max-height:720px)]:gap-2">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
              <span className="text-ink-3">Dashboard</span>
              <span className="text-placeholder">/</span>
              <span className="text-ink">Do'kon</span>
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <h1 className="h2 truncate text-ink">Do'kon</h1>
              <Badge tone="brand">{number(products.length)} mahsulot</Badge>
            </div>
            <p className="mt-0.5 hidden truncate text-[12px] text-ink-3 sm:block">
              Coin do'koni mahsulotlari, buyurtmalar va sovg'alar
            </p>
          </div>
          {tab === 'products' ? (
            <Button onClick={() => setEditing({ ...EMPTY_PRODUCT })} className="h-10 sm:h-11">
              <Plus className="h-4 w-4" />
              <span className="max-[360px]:hidden">Yangi mahsulot</span>
            </Button>
          ) : null}
        </div>

        <div className="flex shrink-0" role="tablist" aria-label="Do'kon bo'limlari">
          <div className="inline-flex rounded-[12px] border border-line bg-white p-1 shadow-card">
            {(
              [
                { value: 'products', label: 'Mahsulotlar', count: products.length },
                { value: 'orders', label: 'Buyurtmalar', count: orderCounts.pending },
              ] as const
            ).map((item) => {
              const active = tab === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.value)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[12px] font-semibold transition',
                    active ? 'bg-ink text-white shadow-sm' : 'text-ink-3 hover:text-ink',
                  )}
                >
                  {item.value === 'products' ? (
                    <Package className="h-3.5 w-3.5" />
                  ) : (
                    <ShoppingBag className="h-3.5 w-3.5" />
                  )}
                  {item.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                      active ? 'bg-white/20 text-white' : 'bg-muted text-ink-3',
                    )}
                  >
                    {number(item.count)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 divide-x divide-line-2 overflow-hidden rounded-[14px] border border-line bg-white shadow-card sm:grid-cols-4">
          {[
            {
              icon: Package,
              label: 'Mahsulotlar',
              value: number(products.length),
              foot: `Faol: ${number(activeProducts)}`,
            },
            {
              icon: ShoppingBag,
              label: 'Ombor qoldiqi',
              value: number(totalStock),
              foot: 'Barcha mahsulotlar',
            },
            {
              icon: Coins,
              label: 'Sotilgan',
              value: number(totalSold),
              foot: 'Jami xaridlar soni',
            },
            {
              icon: Clock3,
              label: 'Kutilayotgan buyurtma',
              value: number(orderCounts.pending),
              foot: 'Bajarish kutmoqda',
              accent: orderCounts.pending > 0,
            },
          ].map((cell) => {
            const Icon = cell.icon
            return (
              <div key={cell.label} className="min-w-0 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{cell.label}</span>
                </div>
                <p
                  className={cn(
                    'mt-1 text-[18px] font-geist leading-none tabular-nums',
                    cell.accent ? 'text-warning' : 'text-ink',
                  )}
                >
                  {cell.value}
                </p>
                <p className="mt-0.5 truncate text-[10px] font-medium text-ink-3">{cell.foot}</p>
              </div>
            )
          })}
        </div>

        {tab === 'products' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3.5">
            <div className="flex shrink-0 flex-col gap-2 rounded-[14px] border border-line bg-white px-3 py-2.5 shadow-card lg:flex-row lg:flex-wrap lg:items-center">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Mahsulot nomi bo'yicha qidirish..."
                className="min-w-0 flex-1 lg:max-w-xs"
              />
              <div className="overflow-x-auto no-scrollbar">
                <Segmented
                  className="w-full overflow-x-auto"
                  value={productStatus}
                  onChange={setProductStatus}
                  options={[
                    { value: 'all', label: 'Barchasi' },
                    { value: 'active', label: 'Faol' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'out', label: 'Tugagan' },
                  ]}
                />
              </div>
              <Select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="lg:w-[160px]"
              >
                <option value="all">Barcha kategoriya</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <span className="text-[11px] font-semibold text-ink-3 lg:ml-auto">
                Topildi: <span className="text-ink">{number(filteredProducts.length)}</span> ta
              </span>
            </div>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
              {filteredProducts.length === 0 ? (
                <div className="grid min-h-0 flex-1 place-items-center p-4">
                  <EmptyState
                    icon={<Package className="h-5 w-5" />}
                    title="Mahsulot topilmadi"
                    text="Filtrlarni o'zgartiring yoki yangi mahsulot qo'shing."
                    action={
                      <Button onClick={() => setEditing({ ...EMPTY_PRODUCT })}>
                        <Plus className="h-4 w-4" /> Mahsulot qo'shish
                      </Button>
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="hidden min-h-0 flex-1 overflow-y-auto [contain:paint] md:block">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-line-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                          <th className="px-4 py-2 font-semibold">Mahsulot</th>
                          <th className="py-2 pr-3 font-semibold">Kategoriya</th>
                          <th className="py-2 pr-3 font-semibold">Coin narxi</th>
                          <th className="py-2 pr-3 font-semibold">Qoldiq</th>
                          <th className="py-2 pr-3 font-semibold">Sotilgan</th>
                          <th className="py-2 pr-3 font-semibold">Status</th>
                          <th className="px-4 py-2 text-right font-semibold">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-2">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="text-[12.5px] transition hover:bg-canvas">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-line-2 bg-canvas text-[18px]">
                                  {product.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                  ) : (
                                    product.emoji
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-ink">{product.name}</p>
                                  <p className="max-w-[260px] truncate text-[11px] text-ink-3">
                                    {product.description}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 pr-3 text-ink-2">{product.category}</td>
                            <td className="py-2.5 pr-3">
                              <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-[#b45309]">
                                <Coins className="h-3.5 w-3.5" /> {number(product.price)}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3">
                              <span
                                className={cn(
                                  'font-semibold tabular-nums',
                                  product.stock === 0 ? 'text-error' : 'text-ink',
                                )}
                              >
                                {number(product.stock)}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 tabular-nums text-ink-2">{number(product.sold)}</td>
                            <td className="py-2.5 pr-3">
                              <Badge tone={PRODUCT_STATUS[product.status].tone}>
                                {PRODUCT_STATUS[product.status].label}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button size="sm" variant="secondary" onClick={() => setEditing(product)}>
                                  <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteTarget(product)}
                                  aria-label={`${product.name} o'chirish`}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-error" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <ul className="min-h-0 flex-1 divide-y divide-line-2 overflow-y-auto [contain:paint] md:hidden">
                    {filteredProducts.map((product) => (
                      <li key={product.id} className="px-3 py-2.5">
                        <div className="flex items-start gap-2.5">
                          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-line-2 bg-canvas text-[18px]">
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              product.emoji
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="min-w-0 truncate text-[12.5px] font-semibold text-ink">
                                {product.name}
                              </p>
                              <Badge tone={PRODUCT_STATUS[product.status].tone}>
                                {PRODUCT_STATUS[product.status].label}
                              </Badge>
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-3">
                              {product.description || '—'}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-3">
                              <span>{product.category}</span>
                              <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-[#b45309]">
                                <Coins className="h-3 w-3" /> {number(product.price)}
                              </span>
                              <span>
                                Qoldi:{' '}
                                <b className={cn('tabular-nums', product.stock === 0 ? 'text-error' : 'text-ink-2')}>
                                  {number(product.stock)}
                                </b>
                              </span>
                              <span>Sotilgan: {number(product.sold)}</span>
                            </div>
                            <div className="mt-2 flex gap-1.5">
                              <Button size="sm" variant="secondary" className="flex-1" onClick={() => setEditing(product)}>
                                <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteTarget(product)}
                                aria-label="O'chirish"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-error" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        ) : null}

        {tab === 'orders' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3.5">
            <div className="flex shrink-0 flex-col gap-2 rounded-[14px] border border-line bg-white px-3 py-2.5 shadow-card lg:flex-row lg:flex-wrap lg:items-center">
              <SearchInput
                value={orderSearch}
                onChange={setOrderSearch}
                placeholder="Foydalanuvchi yoki mahsulot..."
                className="min-w-0 flex-1 lg:max-w-xs"
              />
              <div className="overflow-x-auto no-scrollbar">
                <Segmented
                  className="w-full overflow-x-auto"
                  value={orderStatus}
                  onChange={setOrderStatus}
                  options={[
                    { value: 'all', label: 'Barchasi', count: orderCounts.all },
                    { value: 'pending', label: 'Kutilmoqda', count: orderCounts.pending },
                    { value: 'done', label: 'Bajarildi', count: orderCounts.done },
                    { value: 'cancelled', label: 'Bekor qilindi', count: orderCounts.cancelled },
                  ]}
                />
              </div>
              <Select value={orderPeriod} onChange={(event) => setOrderPeriod(event.target.value)} className="lg:w-[150px]">
                <option value="7">Oxirgi 7 kun</option>
                <option value="30">Oxirgi 30 kun</option>
                <option value="90">Oxirgi 90 kun</option>
                <option value="all">Barcha davr</option>
              </Select>
            </div>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
              {filteredOrders.length === 0 ? (
                <div className="grid min-h-0 flex-1 place-items-center p-4">
                  <EmptyState
                    icon={<ShoppingBag className="h-5 w-5" />}
                    title="Buyurtma topilmadi"
                    text="Tanlangan filtrlar bo'yicha buyurtmalar mavjud emas."
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto [contain:paint]">
                  {pendingOrders.length > 0 ? (
                    <div>
                      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line-2 bg-warning-bg/70 px-3 py-1.5 backdrop-blur-sm sm:px-4">
                        <Clock3 className="h-3.5 w-3.5 text-warning" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#92400e]">
                          Kutilayotgan navbat · {number(pendingOrders.length)}
                        </p>
                      </div>
                      <ul className="divide-y divide-line-2">
                        {pendingOrders.map((order) => (
                          <li key={order.id} className="px-3 py-2.5 sm:px-4">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <Avatar name={order.userName} size="sm" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[12.5px] font-semibold text-ink">
                                  {order.userName}
                                </p>
                                <p className="truncate text-[10.5px] text-ink-3">
                                  {order.productName} · {date(order.createdAt)}
                                </p>
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-bold tabular-nums text-[#b45309]">
                                <Coins className="h-3.5 w-3.5" />
                                {number(order.coins)}
                              </span>
                              <div className="flex w-full gap-1.5 sm:w-auto">
                                <Button size="sm" className="flex-1 sm:flex-none" onClick={() => updateOrder(order, 'done')}>
                                  <Check className="h-3.5 w-3.5" /> Bajarildi
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="flex-1 sm:flex-none"
                                  onClick={() => updateOrder(order, 'cancelled')}
                                >
                                  <X className="h-3.5 w-3.5" /> Bekor
                                </Button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {historyOrders.length > 0 ? (
                    <div>
                      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line-2 bg-canvas/80 px-3 py-1.5 backdrop-blur-sm sm:px-4">
                        <Check className="h-3.5 w-3.5 text-ink-3" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-3">
                          Tarix · {number(historyOrders.length)}
                        </p>
                      </div>
                      <ul className="divide-y divide-line-2">
                        {historyOrders.map((order) => (
                          <li key={order.id} className="flex items-center gap-2.5 px-3 py-2.5 sm:px-4">
                            <Avatar name={order.userName} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12.5px] font-semibold text-ink">
                                {order.userName}
                              </p>
                              <p className="truncate font-mono text-[10px] text-ink-3">
                                {order.id} · {date(order.createdAt)}
                              </p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold tabular-nums text-ink-2">
                              <Coins className="h-3 w-3 text-[#b45309]" />
                              {number(order.coins)}
                            </span>
                            <Badge tone={ORDER_STATUS[order.status].tone}>
                              {ORDER_STATUS[order.status].label}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        ) : null}

        <ProductDrawer product={editing} onClose={() => setEditing(null)} onSave={saveProduct} />

        <Modal
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          title="Mahsulotni o'chirish"
          description={deleteTarget?.name}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Bekor qilish
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                <Trash2 className="h-4 w-4" /> O'chirish
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-ink-2">
            <b>{deleteTarget?.name}</b> mahsuloti va unga tegishli barcha buyurtmalar o'chiriladi. Bu
            amalni bekor qilib bo'lmaydi.
          </p>
        </Modal>
      </div>
    </PageTransition>
  )
}

function ProductDrawer({
  product,
  onClose,
  onSave,
}: {
  product: Product | null
  onClose: () => void
  onSave: (product: Product) => void
}) {
  const [draft, setDraft] = useState<Product | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const categories = ['Texnika', 'Aksesuar', 'Kiyim', 'Aksiya']

  useEffect(() => {
    setDraft(product)
  }, [product])

  const current = draft
  const update = (patch: Partial<Product>) => setDraft((value) => (value ? { ...value, ...patch } : value))

  const readFile = (file: File | null | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => update({ image: String(reader.result) })
    reader.readAsDataURL(file)
  }

  return (
    <Drawer
      open={product !== null}
      onClose={onClose}
      title={product?.id ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
      subtitle={product?.id ? product.name : "Coin do'koniga yangi sovg'a qo'shing"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={() => current && onSave(current)}>
            <Check className="h-4 w-4" /> Saqlash
          </Button>
        </div>
      }
    >
      {current ? (
        <div className="space-y-4">
          <Field label="Rasm" hint="PNG yoki JPG, drag & drop qilish mumkin">
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                readFile(event.dataTransfer.files?.[0])
              }}
              className={cn(
                'relative flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition',
                dragging ? 'border-brand bg-brand-soft/40' : 'border-line bg-canvas',
              )}
            >
              {current.image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={current.image} alt="Mahsulot rasmi" className="h-24 w-24 rounded-lg object-cover" />
                  <Button size="sm" variant="secondary" onClick={() => update({ image: null })}>
                    <X className="h-3.5 w-3.5" /> Rasmni olib tashlash
                  </Button>
                </>
              ) : (
                <>
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-[22px] text-brand-text">
                    {current.emoji}
                  </span>
                  <p className="text-[12.5px] text-ink-3">Rasmni bu yerga tashlang yoki tanlang</p>
                  <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> Fayl tanlash
                  </Button>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => readFile(event.target.files?.[0])}
              />
            </div>
          </Field>

          <Field label="Emoji" hint="Rasm yuklanmasa, mahsulot kartasida ko'rinadi">
            <Input value={current.emoji} onChange={(event) => update({ emoji: event.target.value })} maxLength={4} />
          </Field>

          <Field label="Nomi" required>
            <Input value={current.name} onChange={(event) => update({ name: event.target.value })} placeholder="Masalan: HDP hoddie" />
          </Field>

          <Field label="Tavsif">
            <Textarea value={current.description} onChange={(event) => update({ description: event.target.value })} rows={3} placeholder="Mahsulot haqida qisqacha..." />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategoriya">
              <Select value={current.category} onChange={(event) => update({ category: event.target.value })}>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Coin narxi" required>
              <Input
                type="number"
                min={1}
                value={current.price}
                onChange={(event) => update({ price: Math.max(0, Number(event.target.value)) })}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Miqdori (nechta bor)">
              <Input
                type="number"
                min={0}
                value={current.stock}
                onChange={(event) => {
                  const stock = Math.max(0, Number(event.target.value))
                  update({ stock, status: stock === 0 ? 'out' : current.status === 'out' ? 'active' : current.status })
                }}
              />
            </Field>
            <Field label="Status">
              <Select value={current.status} onChange={(event) => update({ status: event.target.value as ProductStatus })}>
                <option value="active">Faol</option>
                <option value="draft">Draft</option>
                <option value="out">Tugagan</option>
              </Select>
            </Field>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-canvas px-3 py-2.5 text-[11.5px] text-ink-3">
            <ImagePlus className="h-4 w-4 shrink-0" />
            Sotilgan: {number(current.sold)} ta · Narx: {number(current.price)} coin
          </div>
        </div>
      ) : null}
    </Drawer>
  )
}
