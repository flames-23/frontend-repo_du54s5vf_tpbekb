import { useEffect, useMemo, useState } from 'react'

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [drinks, setDrinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [customer, setCustomer] = useState({ name: '', phone: '' })
  const [provider, setProvider] = useState('OVO')
  const [orderResult, setOrderResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDrinks()
  }, [])

  const loadDrinks = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${baseUrl}/api/drinks`)
      const data = await res.json()
      setDrinks(data || [])
    } catch (e) {
      setError('Gagal memuat menu. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const addSampleMenu = async () => {
    const samples = [
      { name: 'Es Kopi Susu', description: 'Kopi susu gula aren', price: 18000, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1200&auto=format&fit=crop', category: 'Coffee' },
      { name: 'Thai Tea', description: 'Thai tea creamy', price: 15000, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1200&auto=format&fit=crop', category: 'Tea' },
      { name: 'Matcha Latte', description: 'Matcha premium dengan susu', price: 22000, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1200&auto=format&fit=crop', category: 'Matcha' },
    ]
    try {
      for (const d of samples) {
        await fetch(`${baseUrl}/api/drinks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(d),
        })
      }
      await loadDrinks()
    } catch (e) {
      setError('Gagal menambahkan contoh menu')
    }
  }

  const addToCart = (drink) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === drink.id)
      if (exists) {
        return prev.map((p) => (p.id === drink.id ? { ...p, quantity: p.quantity + 1 } : p))
      }
      return [...prev, { id: drink.id, name: drink.name, price: drink.price, quantity: 1 }]
    })
  }

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, it) => sum + it.price * it.quantity, 0)
  }, [cart])

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((p) => p.id !== id))
    } else {
      setCart((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)))
    }
  }

  const checkout = async () => {
    setError('')
    setOrderResult(null)
    if (!customer.name || !customer.phone) {
      setError('Lengkapi nama dan nomor HP terlebih dahulu')
      return
    }
    if (cart.length === 0) {
      setError('Keranjang masih kosong')
      return
    }

    const items = cart.map((c) => ({
      product_id: c.id,
      name: c.name,
      price: c.price,
      quantity: c.quantity,
      subtotal: c.price * c.quantity,
    }))

    try {
      const res = await fetch(`${baseUrl}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer.name,
          phone: customer.phone,
          items,
          provider,
        }),
      })
      if (!res.ok) throw new Error('Checkout gagal')
      const data = await res.json()
      setOrderResult(data)
      setCart([])
    } catch (e) {
      setError('Checkout gagal. Coba lagi.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white grid place-items-center font-bold">K</div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Kedai Kita</h1>
              <p className="text-xs text-gray-500 -mt-1">Segelas rasa, seribu cerita</p>
            </div>
          </div>
          <div className="text-sm font-medium">Keranjang: {cart.length} item • Rp{cartTotal.toLocaleString('id-ID')}</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Menu Minuman</h2>
              <p className="text-gray-500 text-sm">Pilih favoritmu</p>
            </div>
            {drinks.length === 0 && (
              <button onClick={addSampleMenu} className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded">
                Muat Contoh Menu
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-gray-500">Memuat menu...</div>
          ) : drinks.length === 0 ? (
            <div className="text-gray-600 bg-amber-50 border border-amber-200 p-4 rounded">
              Belum ada menu. Klik "Muat Contoh Menu" untuk menambahkan contoh.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {drinks.map((d) => (
                <div key={d.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
                  {d.image && (
                    <img src={d.image} alt={d.name} className="w-full h-36 object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold">{d.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">{d.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold">Rp{Number(d.price).toLocaleString('id-ID')}</span>
                      <button onClick={() => addToCart(d)} className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-3 py-1.5 rounded">Tambah</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-5 sticky top-20">
            <h2 className="text-xl font-bold mb-3">Checkout</h2>

            {error && (
              <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</div>
            )}

            <label className="block text-sm font-medium mb-1">Nama</label>
            <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Nama lengkap" />

            <label className="block text-sm font-medium mb-1">Nomor HP</label>
            <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="08xxxxxxxxxx" />

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Keranjang</h3>
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada item</p>
              ) : (
                <div className="space-y-2">
                  {cart.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-gray-500">Rp{c.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(c.id, c.quantity - 1)} className="w-7 h-7 rounded bg-gray-100">-</button>
                        <input value={c.quantity} onChange={(e) => updateQty(c.id, Number(e.target.value))} className="w-12 border rounded text-center" />
                        <button onClick={() => updateQty(c.id, c.quantity + 1)} className="w-7 h-7 rounded bg-gray-100">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>Rp{cartTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
              <div className="flex gap-2 flex-wrap">
                {['OVO', 'GoPay', 'DANA'].map((p) => (
                  <button key={p} onClick={() => setProvider(p)} className={`px-3 py-1.5 rounded border ${provider === p ? 'bg-amber-500 text-white border-amber-600' : 'bg-white'}`}>{p}</button>
                ))}
              </div>
            </div>

            <button onClick={checkout} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 rounded disabled:opacity-50" disabled={cart.length === 0}>
              Bayar dengan E-Wallet
            </button>

            {orderResult && (
              <div className="mt-4 p-3 border rounded bg-emerald-50 border-emerald-200">
                <p className="font-semibold mb-1">Pesanan dibuat!</p>
                <p className="text-sm">Provider: {orderResult.provider}</p>
                <p className="text-sm">Total: Rp{Number(orderResult.total).toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-600 break-all mt-2">Token: {orderResult.payment_token}</p>
                <p className="text-xs text-gray-600 break-all">QR/Link: {orderResult.payment_qr}</p>
                {orderResult.deeplink && (
                  <a href={orderResult.deeplink} className="text-amber-700 underline text-sm mt-2 inline-block">Buka tautan pembayaran</a>
                )}
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Kedai Kita • Dibuat dengan ❤️
      </footer>
    </div>
  )
}

export default App
