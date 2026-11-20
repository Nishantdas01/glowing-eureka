import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "goodfood-records-v1";
const CUSTOMER_TYPES = ["New customer", "Existing customer", "Guest customer", "Referral customer", "Special customer"];
const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "orders", label: "Orders", icon: "▤" },
  { id: "customers", label: "Customers", icon: "♧" },
  { id: "menu", label: "Food menu", icon: "♨" },
  { id: "promotions", label: "Promotions", icon: "✳" },
];

function emptyData() {
  return { customers: [], foods: [], orders: [], promotions: [] };
}

function readData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return emptyData();
  const parsed = JSON.parse(saved);
  return {
    customers: Array.isArray(parsed.customers) ? parsed.customers : [],
    foods: Array.isArray(parsed.foods) ? parsed.foods : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    promotions: Array.isArray(parsed.promotions) ? parsed.promotions : [],
  };
}

function loadInitialData() {
  try {
    return { data: readData(), error: "" };
  } catch (error) {
    console.error("Could not read your records from this browser.", error);
    return { data: emptyData(), error: "Saved records could not be read. Check browser storage permissions before entering new records." };
  }
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

async function compressFoodImage(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Choose an image smaller than 10 MB.");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image could not be opened. Try another JPG, PNG, or WebP file.");
  }

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");

    for (const [maxSize, quality] of [[720, 0.72], [560, 0.65], [420, 0.58], [320, 0.5]]) {
      const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL("image/jpeg", quality);
      if (image.length <= 250_000) return image;
    }

    throw new Error("This image is still too large after compression. Try a smaller image.");
  } finally {
    bitmap.close();
  }
}

function App() {
  const [initialState] = useState(loadInitialData);
  const [data, setData] = useState(initialState.data);
  const [page, setPage] = useState("overview");
  const [storageError, setStorageError] = useState(initialState.error);
  const hasChanged = useRef(false);

  useEffect(() => {
    if (!hasChanged.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStorageError("");
    } catch (error) {
      console.error("Could not save your records in this browser.", error);
      setStorageError("Your changes could not be saved. Check browser storage space or permissions.");
    }
  }, [data]);

  const updateData = (key, value) => {
    hasChanged.current = true;
    setData((current) => ({ ...current, [key]: value }));
  };
  const customerById = useMemo(() => new Map(data.customers.map((customer) => [customer.id, customer])), [data.customers]);
  const todayOrders = data.orders.filter((order) => new Date(order.createdAt).toDateString() === new Date().toDateString());
  const openOrders = data.orders.filter((order) => order.status !== "Completed" && order.status !== "Cancelled");
  const todaySales = todayOrders.filter((order) => order.status !== "Cancelled").reduce((sum, order) => sum + order.total, 0);

  const exportBackup = () => {
    const file = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `goodfood-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage("overview"); }}>
          <span className="brand-mark">g</span>
          <span>goodfood<small>HOME KITCHEN</small></span>
        </a>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
              <span className="nav-icon">{item.icon}</span>{item.label}
              {item.id === "orders" && openOrders.length > 0 && <span className="nav-count">{openOrders.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="kitchen-card"><span className="kitchen-icon">♡</span><strong>Made with care</strong><p>A little organization for your home kitchen.</p></div>
          <span className="version-label">YOUR PRIVATE KITCHEN</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-sep">/</span><strong>{NAV_ITEMS.find((item) => item.id === page)?.label}</strong></div>
          <div className="topbar-actions"><span className="today-label">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><button className="button button-outline button-small" onClick={exportBackup}>↓ <span>Export backup</span></button></div>
        </header>
        {storageError && <div className="storage-alert" role="alert">{storageError}</div>}
        <div className="page-content">
          {page === "overview" && <Overview data={data} todayOrders={todayOrders} todaySales={todaySales} openOrders={openOrders} setPage={setPage} />}
          {page === "customers" && <Customers customers={data.customers} onChange={(value) => updateData("customers", value)} />}
          {page === "menu" && <FoodMenu foods={data.foods} onChange={(value) => updateData("foods", value)} />}
          {page === "orders" && <Orders data={data} customerById={customerById} onChange={(value) => updateData("orders", value)} />}
          {page === "promotions" && <Promotions data={data} onChange={(value) => updateData("promotions", value)} />}
        </div>
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Overview({ data, todayOrders, todaySales, openOrders, setPage }) {
  const recentOrders = [...data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  return (
    <>
      <PageHeading eyebrow="YOUR KITCHEN AT A GLANCE" title="Good morning, chef ✳" description="Here’s what’s happening with your home kitchen today." action={<button className="button button-primary" onClick={() => setPage("orders")}>＋ <span>New order</span></button>} />
      <section className="stats-grid">
        <StatCard label="Today's orders" value={todayOrders.length} note="Orders placed today" icon="▤" color="peach" />
        <StatCard label="Open orders" value={openOrders.length} note="Still being prepared" icon="◷" color="sage" />
        <StatCard label="Today's sales" value={formatPrice(todaySales)} note="Excludes cancelled orders" icon="↗" color="lavender" />
        <StatCard label="Your customers" value={data.customers.length} note="Across all customer types" icon="♧" color="yellow" />
      </section>
      <div className="overview-grid">
        <section className="panel recent-panel">
          <div className="panel-heading"><div><h2>Recent orders</h2><p>Your latest kitchen activity</p></div><button className="text-button" onClick={() => setPage("orders")}>View all <span>→</span></button></div>
          {recentOrders.length ? <div className="table-scroll"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>TOTAL</th><th>STATUS</th></tr></thead><tbody>{recentOrders.map((order) => <OrderRow key={order.id} order={order} />)}</tbody></table></div> : <EmptyState icon="▤" title="No orders yet" text="Add your first order when a customer places one." />}
        </section>
        <section className="panel quick-panel">
          <div className="panel-heading"><div><h2>Quick actions</h2><p>Keep things moving</p></div></div>
          <button className="quick-action" onClick={() => setPage("customers")}><span className="quick-icon peach">♧</span><span><strong>Add a customer</strong><small>Save their details and preferences</small></span><b>→</b></button>
          <button className="quick-action" onClick={() => setPage("menu")}><span className="quick-icon sage">♨</span><span><strong>Add a food item</strong><small>Keep your menu and prices up to date</small></span><b>→</b></button>
          <button className="quick-action" onClick={() => setPage("promotions")}><span className="quick-icon lavender">✳</span><span><strong>Send an offer</strong><small>Prepare a message for a customer group</small></span><b>→</b></button>
        </section>
      </div>
      <p className="privacy-note">Your records are saved in this browser on this device. Use <strong>Export backup</strong> regularly to keep a copy.</p>
    </>
  );
}

function StatCard({ label, value, note, icon, color }) {
  return <article className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></article>;
}

function EmptyState({ icon, title, text }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><strong>{title}</strong><p>{text}</p></div>;
}

function Customers({ customers, onChange }) {
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const blank = { name: "", phone: "", type: "New customer", notes: "", consent: false };
  const [form, setForm] = useState(blank);
  const filtered = customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.type}`.toLowerCase().includes(search.toLowerCase()));

  const startAdd = () => { setEditing(null); setForm(blank); setFormOpen(true); };
  const startEdit = (customer) => { setEditing(customer.id); setForm({ name: customer.name, phone: customer.phone, type: customer.type, notes: customer.notes || "", consent: Boolean(customer.consent) }); setFormOpen(true); };
  const saveCustomer = (event) => {
    event.preventDefault();
    const customer = { ...form, name: form.name.trim(), phone: form.phone.trim() };
    if (editing) onChange(customers.map((item) => item.id === editing ? { ...item, ...customer } : item));
    else onChange([{ ...customer, id: newId(), createdAt: new Date().toISOString() }, ...customers]);
    setFormOpen(false);
  };
  const remove = (customer) => {
    if (window.confirm(`Delete ${customer.name} from your customer list? Their past orders will remain.`)) onChange(customers.filter((item) => item.id !== customer.id));
  };

  return <>
    <PageHeading eyebrow="PEOPLE WHO MAKE IT POSSIBLE" title="Customers" description="Keep customer details and preferences together." action={<button className="button button-primary" onClick={startAdd}>＋ <span>Add customer</span></button>} />
    {formOpen && <form className="panel form-panel" onSubmit={saveCustomer}>
      <div className="form-title"><div><h2>{editing ? "Edit customer" : "Add a customer"}</h2><p>Save the details you need to stay in touch.</p></div><button type="button" className="icon-button" aria-label="Close form" onClick={() => setFormOpen(false)}>×</button></div>
      <div className="form-grid">
        <label>Customer name<input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maya Patel" /></label>
        <label>Phone number<input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 0100" /></label>
        <label>Customer type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{CUSTOMER_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label className="full-field">Notes<textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Preferences, allergies, or delivery notes" /></label>
        <label className="checkbox-field full-field"><input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} /><span>They agreed to receive promotional messages from me.</span></label>
      </div>
      <div className="form-actions"><button type="button" className="button button-outline" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary">{editing ? "Save changes" : "Save customer"}</button></div>
    </form>}
    <section className="panel data-panel">
      <div className="panel-heading table-heading"><div><h2>Customer list <span className="count-pill">{customers.length}</span></h2><p>Search and manage your customer records</p></div><input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="⌕  Search customers" aria-label="Search customers" /></div>
      {filtered.length ? <div className="table-scroll"><table><thead><tr><th>CUSTOMER</th><th>PHONE</th><th>TYPE</th><th>MESSAGES</th><th>ADDED</th><th></th></tr></thead><tbody>{filtered.map((customer) => <tr key={customer.id}><td><div className="person-cell"><span className="avatar">{customer.name.trim().charAt(0).toUpperCase()}</span><strong>{customer.name}</strong></div></td><td>{customer.phone}</td><td><TypeBadge type={customer.type} /></td><td><span className={`consent ${customer.consent ? "yes" : ""}`}>{customer.consent ? "● Opted in" : "— Not opted in"}</span></td><td>{customer.createdAt ? formatDate(customer.createdAt) : "—"}</td><td><div className="row-actions"><button onClick={() => startEdit(customer)}>Edit</button><button className="danger-link" onClick={() => remove(customer)}>Delete</button></div></td></tr>)}</tbody></table></div> : <EmptyState icon="♧" title={search ? "No matching customers" : "Your customer list is ready"} text={search ? "Try another name, phone number, or customer type." : "Add customers to keep their contact details and preferences in one place."} />}
    </section>
  </>;
}

function TypeBadge({ type }) {
  const styles = { "New customer": "blue", "Existing customer": "green", "Guest customer": "gray", "Referral customer": "purple", "Special customer": "orange" };
  return <span className={`type-badge ${styles[type] || "gray"}`}>{type}</span>;
}

function FoodMenu({ foods, onChange }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [imageError, setImageError] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const blank = { name: "", description: "", price: "", available: true, image: "" };
  const [form, setForm] = useState(blank);
  const startAdd = () => { setEditing(null); setForm(blank); setImageError(""); setFormOpen(true); };
  const startEdit = (food) => { setEditing(food.id); setForm({ name: food.name, description: food.description || "", price: String(food.price), available: food.available !== false, image: food.image || "" }); setImageError(""); setFormOpen(true); };
  const handleImageChange = async (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setImageError("");
    setImageLoading(true);
    try {
      const image = await compressFoodImage(file);
      setForm((current) => ({ ...current, image }));
    } catch (error) {
      console.error("Could not add food image.", error);
      setImageError(error instanceof Error ? error.message : "The image could not be added.");
    } finally {
      setImageLoading(false);
    }
  };
  const saveFood = (event) => {
    event.preventDefault();
    if (imageLoading) return;
    const item = { ...form, name: form.name.trim(), price: Number(form.price) };
    if (editing) onChange(foods.map((food) => food.id === editing ? { ...food, ...item } : food));
    else onChange([{ ...item, id: newId() }, ...foods]);
    setFormOpen(false);
  };
  const remove = (food) => {
    if (window.confirm(`Delete "${food.name}" from the menu? Existing order records will remain.`)) onChange(foods.filter((item) => item.id !== food.id));
  };

  return <>
    <PageHeading eyebrow="WHAT'S COOKING" title="Food menu" description="Your dishes, descriptions, and prices in one place." action={<button className="button button-primary" onClick={startAdd}>＋ <span>Add food item</span></button>} />
    {formOpen && <form className="panel form-panel" onSubmit={saveFood}>
      <div className="form-title"><div><h2>{editing ? "Edit food item" : "Add to your menu"}</h2><p>Set a name and price for each dish.</p></div><button type="button" className="icon-button" aria-label="Close form" onClick={() => setFormOpen(false)}>×</button></div>
      <div className="form-grid">
        <label>Food item name<input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Vegetable biryani" /></label>
        <label>Price (your local currency)<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" /></label>
        <label className="full-field">Description<textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A short description or serving size" /></label>
        <div className="image-upload full-field">
          <div className="image-preview">{form.image ? <img src={form.image} alt="Food item preview" /> : <span>♨</span>}</div>
          <div className="image-upload-details">
            <strong>Food photo</strong>
            <p>Add a picture to make this dish easy to recognize. Images are resized before saving.</p>
            <div className="image-upload-actions">
              <label className="button button-outline image-file-button">{form.image ? "Change image" : "Choose image"}<input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose food image" onChange={handleImageChange} /></label>
              {form.image && <button type="button" className="image-remove" onClick={() => setForm({ ...form, image: "" })}>Remove image</button>}
              {imageLoading && <span className="image-progress">Preparing image…</span>}
            </div>
            {imageError && <p className="image-error" role="alert">{imageError}</p>}
          </div>
        </div>
        <label className="checkbox-field full-field"><input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /><span>Available to order</span></label>
      </div>
      <div className="form-actions"><button type="button" className="button button-outline" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary" disabled={imageLoading}>{imageLoading ? "Preparing image…" : editing ? "Save changes" : "Save food item"}</button></div>
    </form>}
    <section className="panel data-panel">
      <div className="panel-heading"><div><h2>Your dishes <span className="count-pill">{foods.length}</span></h2><p>Only available items can be added to new orders</p></div></div>
      {foods.length ? <div className="table-scroll"><table><thead><tr><th>FOOD ITEM</th><th>DESCRIPTION</th><th>PRICE</th><th>AVAILABILITY</th><th></th></tr></thead><tbody>{foods.map((food) => <tr key={food.id}><td><div className="food-cell">{food.image ? <img className="food-thumbnail" src={food.image} alt="" /> : <span className="food-emoji">♨</span>}<strong>{food.name}</strong></div></td><td className="muted-cell">{food.description || "—"}</td><td className="price-cell">{formatPrice(food.price)}</td><td><span className={`availability ${food.available !== false ? "available" : "unavailable"}`}>{food.available !== false ? "Available" : "Unavailable"}</span></td><td><div className="row-actions"><button onClick={() => startEdit(food)}>Edit</button><button className="danger-link" onClick={() => remove(food)}>Delete</button></div></td></tr>)}</tbody></table></div> : <EmptyState icon="♨" title="Your menu starts here" text="Add your first home-cooked dish, description, and price." />}
    </section>
  </>;
}

function Orders({ data, customerById, onChange }) {
  const [formOpen, setFormOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [quantities, setQuantities] = useState({});
  const [statusFilter, setStatusFilter] = useState("All orders");
  const activeFoods = data.foods.filter((food) => food.available !== false);
  const statuses = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];
  const addOrder = (event) => {
    event.preventDefault();
    const items = activeFoods.filter((food) => Number(quantities[food.id]) > 0).map((food) => ({ foodId: food.id, name: food.name, quantity: Number(quantities[food.id]), price: Number(food.price) }));
    const customer = customerById.get(customerId);
    if (!customer || !items.length) return;
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    onChange([{ id: newId(), customerId: customer.id, customerName: customer.name, items, total, status: "Pending", createdAt: new Date().toISOString() }, ...data.orders]);
    setCustomerId("");
    setQuantities({});
    setFormOpen(false);
  };
  const setStatus = (id, status) => onChange(data.orders.map((order) => order.id === id ? { ...order, status } : order));
  const filtered = [...data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).filter((order) => statusFilter === "All orders" || order.status === statusFilter);

  return <>
    <PageHeading eyebrow="FROM ORDER TO DELIVERY" title="Orders" description="Track what’s been ordered and what still needs your attention." action={<button className="button button-primary" onClick={() => setFormOpen(!formOpen)}>＋ <span>New order</span></button>} />
    {formOpen && <form className="panel form-panel" onSubmit={addOrder}>
      <div className="form-title"><div><h2>Create an order</h2><p>Choose a customer and add dishes to their order.</p></div><button type="button" className="icon-button" aria-label="Close form" onClick={() => setFormOpen(false)}>×</button></div>
      {!data.customers.length || !activeFoods.length ? <div className="inline-notice">{!data.customers.length ? "Add a customer before creating an order." : "Add an available food item to your menu before creating an order."}</div> : <>
        <div className="form-grid"><label>Customer<select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Choose customer</option>{data.customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.type}</option>)}</select></label></div>
        <div className="order-items">{activeFoods.map((food) => <label className="order-item" key={food.id}><span><strong>{food.name}</strong><small>{formatPrice(food.price)} each</small></span><input aria-label={`Quantity of ${food.name}`} type="number" min="0" step="1" value={quantities[food.id] || ""} onChange={(e) => setQuantities({ ...quantities, [food.id]: e.target.value })} placeholder="0" /></label>)}</div>
        <div className="form-actions"><button type="button" className="button button-outline" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary">Save order</button></div>
      </>}
    </form>}
    <section className="panel data-panel">
      <div className="panel-heading table-heading"><div><h2>Order history <span className="count-pill">{data.orders.length}</span></h2><p>Update order status as you prepare and deliver</p></div><select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter orders"><option>All orders</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div>
      {filtered.length ? <div className="table-scroll"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>DATE</th><th>TOTAL</th><th>STATUS</th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id}><td><span className="order-number">#{order.id.slice(0, 6).toUpperCase()}</span></td><td><strong>{order.customerName || customerById.get(order.customerId)?.name || "Deleted customer"}</strong></td><td className="items-cell">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</td><td>{formatDate(order.createdAt)}</td><td className="price-cell">{formatPrice(order.total)}</td><td><select className={`status-select status-${order.status.toLowerCase()}`} aria-label={`Status for order ${order.id}`} value={order.status} onChange={(e) => setStatus(order.id, e.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div> : <EmptyState icon="▤" title={statusFilter === "All orders" ? "No orders to show" : `No ${statusFilter.toLowerCase()} orders`} text={statusFilter === "All orders" ? "Create an order to keep track of what you’re cooking." : "Orders with this status will appear here."} />}
    </section>
  </>;
}

function OrderRow({ order }) {
  return <tr><td><span className="order-number">#{order.id.slice(0, 6).toUpperCase()}</span></td><td><strong>{order.customerName}</strong></td><td>{formatDate(order.createdAt)}</td><td className="price-cell">{formatPrice(order.total)}</td><td><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span></td></tr>;
}

function Promotions({ data, onChange }) {
  const [target, setTarget] = useState(CUSTOMER_TYPES[1]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [activeCampaign, setActiveCampaign] = useState(null);
  const eligible = data.customers.filter((customer) => customer.type === target && customer.consent && customer.phone);
  const missingConsent = data.customers.filter((customer) => customer.type === target && !customer.consent).length;
  const createCampaign = (event) => {
    event.preventDefault();
    const campaign = { id: newId(), title: title.trim(), message: message.trim(), target, createdAt: new Date().toISOString() };
    onChange([campaign, ...data.promotions]);
    setActiveCampaign(campaign);
  };
  const createLink = (customer, channel) => {
    const text = encodeURIComponent(message.replaceAll("{name}", customer.name));
    if (channel === "WhatsApp") {
      const phone = customer.phone.replace(/\D/g, "");
      return `https://wa.me/${phone}?text=${text}`;
    }
    return `sms:${customer.phone}?body=${text}`;
  };

  return <>
    <PageHeading eyebrow="A LITTLE SOMETHING FOR THEM" title="Promotions" description="Write an offer for a customer group and open a message draft for each opted-in customer." />
    <div className="promotion-layout">
      <form className="panel campaign-panel" onSubmit={createCampaign}>
        <div className="panel-heading"><div><h2>Create a message</h2><p>Choose who it’s for and what you’d like to say.</p></div><span className="campaign-mark">✳</span></div>
        <label>Customer group<select value={target} onChange={(e) => { setTarget(e.target.value); setActiveCampaign(null); }}>{CUSTOMER_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
        <div className="audience-note"><span>♧</span><div><strong>{eligible.length} opted-in {eligible.length === 1 ? "customer" : "customers"}</strong><small>{missingConsent ? `${missingConsent} in this group haven't agreed to receive promotions.` : "Only customers who agreed to promotional messages are included."}</small></div></div>
        <label>Offer title<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend family meal" /></label>
        <label>Message<textarea required rows="5" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={"Hi {name}! We have a special offer on this weekend. Reply if you'd like to order."} /><small className="field-hint">Use <code>{"{name}"}</code> to personalize each message.</small></label>
        <button className="button button-primary button-wide">Save offer &amp; prepare messages</button>
        <p className="small-print">This saves your offer and prepares drafts. You choose whether to send each message in your phone’s messaging app.</p>
      </form>
      <div className="promotion-side">
        {activeCampaign && <section className="panel audience-panel"><div className="panel-heading"><div><h2>{activeCampaign.title}</h2><p>{activeCampaign.target} · {eligible.length} opted-in</p></div><span className="live-dot" /></div>
          {eligible.length ? <div className="audience-list">{eligible.map((customer) => <div className="audience-row" key={customer.id}><span className="avatar">{customer.name.trim().charAt(0).toUpperCase()}</span><div><strong>{customer.name}</strong><small>{customer.phone}</small></div><div className="message-actions"><a className="mini-action" href={createLink(customer, "SMS")}>SMS</a><a className="mini-action whatsapp" target="_blank" rel="noreferrer" href={createLink(customer, "WhatsApp")}>WhatsApp</a></div></div>)}</div> : <EmptyState icon="✳" title="No opted-in customers" text="Add customers to this group and record their permission before messaging." />}
        </section>}
        <section className="panel tip-panel"><span className="tip-icon">♡</span><div><strong>A note about messages</strong><p>Contact only people who agreed to receive promotions, and follow your local messaging and privacy rules. SMS and WhatsApp drafts open one at a time; this app does not send messages on its own.</p></div></section>
        <section className="panel history-panel"><div className="panel-heading"><div><h2>Saved offers</h2><p>Your recent promotion drafts</p></div></div>
          {data.promotions.length ? <div className="saved-offers">{data.promotions.slice(0, 5).map((promotion) => <button key={promotion.id} className="saved-offer" onClick={() => { setTitle(promotion.title); setMessage(promotion.message); setTarget(promotion.target); setActiveCampaign(promotion); }}><span className="offer-symbol">✳</span><span><strong>{promotion.title}</strong><small>{promotion.target} · {formatDate(promotion.createdAt)}</small></span><b>→</b></button>)}</div> : <p className="no-offers">Your saved offers will appear here.</p>}
        </section>
      </div>
    </div>
  </>;
}

export default App;
