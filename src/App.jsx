import React, { useEffect, useMemo, useRef, useState } from "react";
import { readDatabase, saveDatabase, writeDatabase } from "./database.js";

const DEMO_CUSTOMER_IDS = new Set(["customer-maya", "customer-arjun", "customer-sana", "customer-rajesh", "customer-neha", "customer-anita"]);
const DEMO_ORDER_IDS = new Set(["order-a120", "order-b245", "order-d489", "order-e512", "order-f634", "order-c367"]);
const DEMO_FOOD_IDS = new Set(["food-biryani", "food-paneer", "food-dal", "food-roti", "food-kheer", "food-kebab"]);
const DEMO_PROMOTION_IDS = new Set(["offer-weekend", "offer-welcome"]);
const CUSTOMER_TYPES = ["New customer", "Existing customer", "Guest customer", "Referral customer", "Special customer"];
const CUSTOMER_TYPE_LABELS = {
  "New customer": { en: "New customer", hi: "नया ग्राहक" },
  "Existing customer": { en: "Existing customer", hi: "मौजूदा ग्राहक" },
  "Guest customer": { en: "Guest customer", hi: "अतिथि ग्राहक" },
  "Referral customer": { en: "Referral customer", hi: "रेफरल ग्राहक" },
  "Special customer": { en: "Special customer", hi: "विशेष ग्राहक" },
};
const STATUS_LABELS = {
  Pending: { en: "Pending", hi: "लंबित" },
  Preparing: { en: "Preparing", hi: "तैयारी में" },
  Ready: { en: "Ready", hi: "तैयार" },
  Completed: { en: "Completed", hi: "पूर्ण" },
  Cancelled: { en: "Cancelled", hi: "रद्द" },
};
const STATUS_KEYS = Object.keys(STATUS_LABELS);
const NAV_LABELS = {
  overview: { en: "Overview", hi: "सारांश" },
  orders: { en: "Orders", hi: "ऑर्डर" },
  customers: { en: "Customers", hi: "ग्राहक" },
  menu: { en: "Food menu", hi: "भोजन मेन्यू" },
  promotions: { en: "Promotions", hi: "प्रचार" },
};
const NAV_ITEMS = [
  { id: "overview", icon: "home" },
  { id: "orders", icon: "receipt" },
  { id: "customers", icon: "users" },
  { id: "menu", icon: "cookingPot" },
  { id: "promotions", icon: "sparkles" },
];

const ICONS = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  receipt: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  cookingPot: <><path d="M3 11h18l-2 9H5l-2-9Z" /><path d="M5 11V8h14v3M8 8V5M12 8V3M16 8V5" /></>,
  sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
  heart: <path d="M20.8 8.6c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10A4.6 4.6 0 0 1 12 6.1a4.6 4.6 0 0 1 8.8 2.5Z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /><path d="M15 9h4v4" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
};

function Icon({ name, size = 18, className = "" }) {
  return <svg className={`app-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name] || ICONS.sparkles}</svg>;
}

function text(language, en, hi) {
  return language === "hi" ? hi : en;
}

function label(language, labels) {
  return labels?.[language] || labels?.en || "";
}

function emptyData() {
  return { customers: [], foods: [], orders: [], promotions: [] };
}

function readData() {
  const parsed = readDatabase();
  const savedCustomers = Array.isArray(parsed.customers) ? parsed.customers.filter((customer) => !DEMO_CUSTOMER_IDS.has(customer.id)) : [];
  const savedFoods = Array.isArray(parsed.foods) ? parsed.foods.filter((food) => !DEMO_FOOD_IDS.has(food.id)) : [];
  const savedOrders = Array.isArray(parsed.orders) ? parsed.orders.filter((order) => !DEMO_ORDER_IDS.has(order.id)) : [];
  const savedPromotions = Array.isArray(parsed.promotions) ? parsed.promotions.filter((promotion) => !DEMO_PROMOTION_IDS.has(promotion.id)) : [];
  const cleaned = {
    customers: savedCustomers.map((customer) => {
      const legacyHindiType = Object.fromEntries(Object.entries(CUSTOMER_TYPE_LABELS).map(([key, value]) => [value.hi, key]));
      return { ...customer, type: legacyHindiType[customer.type] || customer.type };
    }),
    foods: savedFoods,
    orders: savedOrders,
    promotions: savedPromotions.map((promotion) => {
      const legacyHindiType = Object.fromEntries(Object.entries(CUSTOMER_TYPE_LABELS).map(([key, value]) => [value.hi, key]));
      return { ...promotion, target: legacyHindiType[promotion.target] || promotion.target };
    }),
  };
  writeDatabase(cleaned);
  return cleaned;
}

function loadInitialData() {
  try {
    return { data: readData(), error: "" };
  } catch (error) {
    console.error("ब्राउज़र में आपके रिकॉर्ड पढ़े नहीं जा सके।", error);
    return { data: emptyData(), error: "सहेजे गए रिकॉर्ड पढ़े नहीं जा सके। शुरुआत में कोई रिकॉर्ड नहीं दिखाया गया।" };
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
    throw new Error("JPG, PNG या WebP चित्र चुनें।");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("10 MB से छोटा चित्र चुनें।");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("यह चित्र खोला नहीं जा सका। दूसरी JPG, PNG या WebP फ़ाइल आज़माएं।");
  }

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("आपका ब्राउज़र इस चित्र को तैयार नहीं कर सका।");

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

    throw new Error("कम्प्रेस करने के बाद भी यह चित्र बहुत बड़ा है। छोटा चित्र आज़माएं।");
  } finally {
    bitmap.close();
  }
}

function App() {
  const [initialState] = useState(loadInitialData);
  const [data, setData] = useState(initialState.data);
  const [page, setPage] = useState("overview");
  const [newOrderRequested, setNewOrderRequested] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem("goodfood-language") || "en");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [storageError, setStorageError] = useState(initialState.error);
  const [storageNotice, setStorageNotice] = useState("");
  const hasChanged = useRef(false);
  const backupInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.lang = language === "hi" ? "hi" : "en";
  }, [language]);

  useEffect(() => {
    const handleInstallAvailable = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", handleInstallAvailable);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallAvailable);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!hasChanged.current) return;
    try {
      saveDatabase(data);
      setStorageError("");
    } catch (error) {
      console.error("ब्राउज़र में रिकॉर्ड सहेजे नहीं जा सके।", error);
      setStorageError("आपके बदलाव सहेजे नहीं जा सके। ब्राउज़र संग्रहण स्थान या अनुमति जांचें।");
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

  const startNewOrder = () => {
    setNewOrderRequested(true);
    setPage("orders");
  };

  const exportBackup = () => {
    const file = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `goodfood-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setStorageError(text(language, "Backup file is too large.", "बैकअप फ़ाइल बहुत बड़ी है।"));
      return;
    }

    try {
      const backup = JSON.parse(await file.text());
      if (
        !backup ||
        typeof backup !== "object" ||
        !["customers", "foods", "orders", "promotions"].every((key) => Array.isArray(backup[key]))
      ) {
        throw new Error("Invalid backup format");
      }

      const confirmed = window.confirm(text(
        language,
        "Replace all records in this browser with this backup?",
        "इस ब्राउज़र के सभी रिकॉर्ड इस बैकअप से बदल दें?",
      ));
      if (!confirmed) return;

      hasChanged.current = true;
      setData({
        customers: backup.customers,
        foods: backup.foods,
        orders: backup.orders,
        promotions: backup.promotions,
      });
      setStorageError("");
      setStorageNotice(text(language, "Backup restored successfully.", "बैकअप सफलतापूर्वक बहाल हुआ।"));
      setTimeout(() => setStorageNotice(""), 4000);
    } catch (error) {
      console.error("Could not restore the backup.", error);
      setStorageNotice("");
      setStorageError(text(language, "This is not a valid Goodfood backup file.", "यह मान्य Goodfood बैकअप फ़ाइल नहीं है।"));
    }
  };

  const changeLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    localStorage.setItem("goodfood-language", nextLanguage);
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage("overview"); }}>
          <span className="brand-mark">g</span>
          <span>goodfood<small>{text(language, "HOME KITCHEN", "घरेलू रसोई")}</small></span>
        </a>
        <div className="nav-caption">{text(language, "WORKSPACE", "कार्यस्थान")}</div>
        <nav aria-label={text(language, "Main navigation", "मुख्य नेविगेशन")}>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
              <span className="nav-icon"><Icon name={item.icon} size={19} /></span>{label(language, NAV_LABELS[item.id])}
              {item.id === "orders" && openOrders.length > 0 && <span className="nav-count">{openOrders.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <input ref={backupInputRef} type="file" accept="application/json,.json" onChange={importBackup} hidden />
          <p className="sidebar-backup-note">
            {text(language, "Records are saved in this browser. ", "रिकॉर्ड इस ब्राउज़र में सहेजे जाते हैं। ")}
            <button onClick={() => backupInputRef.current?.click()}>{text(language, "Import backup", "बैकअप आयात करें")}</button>
            {" · "}
            <button onClick={exportBackup}>{text(language, "Export backup", "बैकअप निर्यात करें")}</button>
          </p>
          <div className="kitchen-card"><span className="kitchen-icon"><Icon name="heart" size={16} /></span><strong>{text(language, "Made with care", "देखभाल से बनाया गया")}</strong><p>{text(language, "A little organization for your home kitchen.", "आपकी घरेलू रसोई के लिए आसान प्रबंधन।")}</p></div>
          <span className="version-label">{text(language, "YOUR PRIVATE KITCHEN", "आपकी निजी रसोई")}</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>{text(language, "Workspace", "कार्यस्थान")}</span><span className="crumb-sep">/</span><strong>{label(language, NAV_LABELS[page])}</strong></div>
          <div className="topbar-actions">
            <div className="locale-tools">
              <select className="language-select" value={language} onChange={(event) => changeLanguage(event.target.value)} aria-label={text(language, "Select language", "भाषा चुनें")}>
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
              </select>
              <span className="today-label"><Icon name="calendar" size={15} />{new Date().toLocaleDateString(language === "hi" ? "hi-IN" : "en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
            </div>
            {installPrompt && <button className="button button-outline button-small install-button" onClick={installApp}>{text(language, "Install app", "ऐप इंस्टॉल करें")}</button>}
          </div>
        </header>
        {storageError && <div className="storage-alert" role="alert">{storageError}</div>}
        {storageNotice && <div className="storage-notice" role="status">{storageNotice}</div>}
        <div className="page-content">
          {page === "overview" && <Overview language={language} data={data} todayOrders={todayOrders} todaySales={todaySales} openOrders={openOrders} setPage={setPage} onNewOrder={startNewOrder} />}
          {page === "customers" && <Customers language={language} customers={data.customers} onChange={(value) => updateData("customers", value)} />}
          {page === "menu" && <FoodMenu language={language} foods={data.foods} onChange={(value) => updateData("foods", value)} />}
          {page === "orders" && <Orders language={language} data={data} customerById={customerById} onChange={(value) => updateData("orders", value)} newOrderRequested={newOrderRequested} onNewOrderRequestHandled={setNewOrderRequested} />}
          {page === "promotions" && <Promotions language={language} data={data} onChange={(value) => updateData("promotions", value)} />}
        </div>
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Overview({ language, data, todayOrders, todaySales, openOrders, setPage, onNewOrder }) {
  const recentOrders = [...data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  return (
    <>
      <PageHeading eyebrow={text(language, "YOUR KITCHEN AT A GLANCE", "आपकी रसोई का सारांश")} title={<>{text(language, "Good morning, chef", "नमस्ते, शेफ़")} <Icon name="sparkles" size={18} /></>} description={text(language, "Here’s what’s happening with your home kitchen today.", "आज आपकी घरेलू रसोई में क्या हो रहा है।")} action={<button className="button button-primary" onClick={onNewOrder}><Icon name="plus" size={16} /><span>{text(language, "New order", "नया ऑर्डर")}</span></button>} />
      <section className="stats-grid">
        <StatCard label={text(language, "Today's orders", "आज के ऑर्डर")} value={todayOrders.length} note={text(language, "Orders placed today", "आज दिए गए ऑर्डर")} icon="receipt" color="peach" onClick={() => setPage("orders")} />
        <StatCard label={text(language, "Open orders", "खुले ऑर्डर")} value={openOrders.length} note={text(language, "Still being prepared", "अभी तैयारी में हैं")} icon="clock" color="sage" onClick={() => setPage("orders")} />
        <StatCard label={text(language, "Today's sales", "आज की बिक्री")} value={formatPrice(todaySales)} note={text(language, "Excludes cancelled orders", "रद्द ऑर्डर शामिल नहीं")} icon="chart" color="lavender" onClick={() => setPage("orders")} />
        <StatCard label={text(language, "Your customers", "आपके ग्राहक")} value={data.customers.length} note={text(language, "Across all customer types", "सभी ग्राहक श्रेणियाँ")} icon="users" color="yellow" onClick={() => setPage("customers")} />
      </section>
      <div className="overview-grid">
        <section className="panel recent-panel">
          <div className="panel-heading"><div><h2>{text(language, "Recent orders", "हाल के ऑर्डर")}</h2><p>{text(language, "Your latest kitchen activity", "आपकी ताज़ा रसोई गतिविधि")}</p></div><button className="text-button" onClick={() => setPage("orders")}>{text(language, "View all", "सभी देखें")} <Icon name="arrowRight" size={15} /></button></div>
          {recentOrders.length ? <div className="table-scroll"><table><thead><tr><th>{text(language, "ORDER", "ऑर्डर")}</th><th>{text(language, "CUSTOMER", "ग्राहक")}</th><th>{text(language, "DATE", "तिथि")}</th><th>{text(language, "TOTAL", "कुल")}</th><th>{text(language, "STATUS", "स्थिति")}</th></tr></thead><tbody>{recentOrders.map((order) => <OrderRow language={language} key={order.id} order={order} customerName={order.customerName || data.customers.find((customer) => customer.id === order.customerId)?.name || text(language, "Deleted customer", "हटाया गया ग्राहक")} />)}</tbody></table></div> : <EmptyState icon="receipt" title={text(language, "No orders yet", "अभी कोई ऑर्डर नहीं")} text={text(language, "Add your first order when a customer places one.", "ग्राहक का ऑर्डर मिलने पर पहला ऑर्डर जोड़ें।")} />}
        </section>
        <section className="panel quick-panel">
          <div className="panel-heading"><div><h2>{text(language, "Quick actions", "त्वरित कार्य")}</h2><p>{text(language, "Keep things moving", "काम आसानी से आगे बढ़ाएं")}</p></div></div>
          <button className="quick-action" onClick={() => setPage("customers")}><span className="quick-icon peach"><Icon name="users" size={17} /></span><span><strong>{text(language, "Add a customer", "ग्राहक जोड़ें")}</strong><small>{text(language, "Save their details and preferences", "उनकी जानकारी और पसंद सहेजें")}</small></span><b><Icon name="arrowRight" size={16} /></b></button>
          <button className="quick-action" onClick={() => setPage("menu")}><span className="quick-icon sage"><Icon name="cookingPot" size={17} /></span><span><strong>{text(language, "Add a food item", "भोजन आइटम जोड़ें")}</strong><small>{text(language, "Keep your menu and prices up to date", "मेन्यू और कीमतें अपडेट रखें")}</small></span><b><Icon name="arrowRight" size={16} /></b></button>
          <button className="quick-action" onClick={() => setPage("promotions")}><span className="quick-icon lavender"><Icon name="sparkles" size={17} /></span><span><strong>{text(language, "Send an offer", "ऑफ़र भेजें")}</strong><small>{text(language, "Prepare a message for a customer group", "ग्राहक समूह के लिए संदेश तैयार करें")}</small></span><b><Icon name="arrowRight" size={16} /></b></button>
        </section>
      </div>
    </>
  );
}

function StatCard({ label, value, note, icon, color, onClick }) {
  return <button type="button" className="stat-card" onClick={onClick}><div className={`stat-icon ${color}`}><Icon name={icon} size={19} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></button>;
}

function EmptyState({ icon, title, text }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={22} /></span><strong>{title}</strong><p>{text}</p></div>;
}

function Customers({ language, customers, onChange }) {
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const blank = { name: "", phone: "", address: "", type: "New customer", notes: "", consent: false };
  const [form, setForm] = useState(blank);
  const filtered = customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.address || ""} ${customer.type}`.toLowerCase().includes(search.toLowerCase()));

  const startAdd = () => { setEditing(null); setForm(blank); setFormOpen(true); };
  const startEdit = (customer) => { setEditing(customer.id); setForm({ name: customer.name, phone: customer.phone, address: customer.address || "", type: customer.type, notes: customer.notes || "", consent: Boolean(customer.consent) }); setFormOpen(true); };
  const saveCustomer = (event) => {
    event.preventDefault();
    const customer = { ...form, name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() };
    if (editing) onChange(customers.map((item) => item.id === editing ? { ...item, ...customer } : item));
    else onChange([{ ...customer, id: newId(), createdAt: new Date().toISOString() }, ...customers]);
    setFormOpen(false);
  };
  const remove = (customer) => {
    if (window.confirm(text(language, `Delete ${customer.name} from your customer list? Their past orders will remain.`, `${customer.name} को ग्राहक सूची से हटाएं? उनके पिछले ऑर्डर बने रहेंगे।`))) onChange(customers.filter((item) => item.id !== customer.id));
  };

  return <>
    <PageHeading eyebrow={text(language, "PEOPLE WHO MAKE IT POSSIBLE", "आपके काम का अहम हिस्सा")} title={text(language, "Customers", "ग्राहक")} description={text(language, "Keep customer details and preferences together.", "ग्राहकों की जानकारी और पसंद एक जगह रखें।")} action={<button className="button button-primary" onClick={startAdd}><Icon name="plus" size={16} /><span>{text(language, "Add customer", "ग्राहक जोड़ें")}</span></button>} />
    {formOpen && <form className="panel form-panel" onSubmit={saveCustomer}>
      <div className="form-title"><div><h2>{editing ? text(language, "Edit customer", "ग्राहक संपादित करें") : text(language, "Add a customer", "ग्राहक जोड़ें")}</h2><p>{text(language, "Save the details you need to stay in touch.", "संपर्क में रहने के लिए जरूरी जानकारी सहेजें।")}</p></div><button type="button" className="icon-button" aria-label={text(language, "Close form", "फ़ॉर्म बंद करें")} onClick={() => setFormOpen(false)}><Icon name="close" size={18} /></button></div>
      <div className="form-grid">
        <label>{text(language, "Customer name", "ग्राहक का नाम")}<input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>{text(language, "Phone number", "फ़ोन नंबर")}<input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label className="full-field">{text(language, "Address", "पता")}<textarea rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={text(language, "Street, area, city, and delivery details", "गली, इलाका, शहर और डिलीवरी की जानकारी")} /></label>
        <label>{text(language, "Customer type", "ग्राहक प्रकार")}<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{CUSTOMER_TYPES.map((type) => <option key={type} value={type}>{label(language, CUSTOMER_TYPE_LABELS[type])}</option>)}</select></label>
        <label className="full-field">{text(language, "Notes", "नोट्स")}<textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={text(language, "Preferences, allergies, or delivery notes", "पसंद, एलर्जी या डिलीवरी संबंधी नोट")} /></label>
        <label className="checkbox-field full-field"><input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} /><span>{text(language, "They agreed to receive promotional messages from me.", "ग्राहक ने प्रचार संदेश प्राप्त करने की सहमति दी है।")}</span></label>
      </div>
      <div className="form-actions"><button type="button" className="button button-outline" onClick={() => setFormOpen(false)}>{text(language, "Cancel", "रद्द करें")}</button><button className="button button-primary">{editing ? text(language, "Save changes", "बदलाव सहेजें") : text(language, "Save customer", "ग्राहक सहेजें")}</button></div>
    </form>}
    <section className="panel data-panel">
      <div className="panel-heading table-heading"><div><h2>{text(language, "Customer list", "ग्राहक सूची")} <span className="count-pill">{customers.length}</span></h2><p>{text(language, "Search and manage your customer records", "ग्राहक रिकॉर्ड खोजें और प्रबंधित करें")}</p></div><input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={text(language, "Search customers", "ग्राहक खोजें")} aria-label={text(language, "Search customers", "ग्राहक खोजें")} /></div>
      {filtered.length ? <div className="table-scroll"><table><thead><tr><th>{text(language, "CUSTOMER", "ग्राहक")}</th><th>{text(language, "PHONE", "फ़ोन")}</th><th>{text(language, "ADDRESS", "पता")}</th><th>{text(language, "TYPE", "प्रकार")}</th><th>{text(language, "MESSAGES", "संदेश")}</th><th>{text(language, "ADDED", "जोड़ने की तिथि")}</th><th></th></tr></thead><tbody>{filtered.map((customer) => <tr key={customer.id}><td><div className="person-cell"><span className="avatar">{customer.name.trim().charAt(0).toUpperCase()}</span><strong>{customer.name}</strong></div></td><td>{customer.phone}</td><td>{customer.address || "—"}</td><td><TypeBadge language={language} type={customer.type} /></td><td><span className={`consent ${customer.consent ? "yes" : ""}`}>{customer.consent ? <><Icon name="checkCircle" size={14} />{text(language, "Opted in", "सहमति है")}</> : `— ${text(language, "Not opted in", "सहमति नहीं")}`}</span></td><td>{customer.createdAt ? formatDate(customer.createdAt) : "—"}</td><td><div className="row-actions"><button onClick={() => startEdit(customer)}>{text(language, "Edit", "संपादित करें")}</button><button className="danger-link" onClick={() => remove(customer)}>{text(language, "Delete", "हटाएं")}</button></div></td></tr>)}</tbody></table></div> : <EmptyState icon="users" title={search ? text(language, "No matching customers", "कोई मेल खाता ग्राहक नहीं") : text(language, "Your customer list is ready", "आपकी ग्राहक सूची तैयार है")} text={search ? text(language, "Try another name, phone number, or customer type.", "दूसरा नाम, फ़ोन नंबर या ग्राहक प्रकार आज़माएं।") : text(language, "Add customers to keep their contact details and preferences in one place.", "संपर्क विवरण और पसंद एक जगह रखने के लिए ग्राहक जोड़ें।")} />}
    </section>
  </>;
}

function TypeBadge({ language, type }) {
  const styles = { "New customer": "blue", "Existing customer": "green", "Guest customer": "gray", "Referral customer": "purple", "Special customer": "orange" };
  return <span className={`type-badge ${styles[type] || "gray"}`}>{label(language, CUSTOMER_TYPE_LABELS[type])}</span>;
}

function FoodMenu({ language, foods, onChange }) {
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
      console.error("भोजन चित्र जोड़ा नहीं जा सका।", error);
      setImageError(error instanceof Error ? error.message : "चित्र जोड़ा नहीं जा सका।");
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
    if (window.confirm(text(language, `Delete "${food.name}" from the menu? Existing order records will remain.`, `"${food.name}" को मेन्यू से हटाएं? पुराने ऑर्डर रिकॉर्ड बने रहेंगे।`))) onChange(foods.filter((item) => item.id !== food.id));
  };

  return <>
    <PageHeading eyebrow={text(language, "WHAT'S COOKING", "आज क्या पक रहा है")} title={text(language, "Food menu", "भोजन मेन्यू")} description={text(language, "Your dishes, descriptions, and prices in one place.", "व्यंजन, विवरण और कीमतें एक जगह रखें।")} action={<button className="button button-primary" onClick={startAdd}><Icon name="plus" size={16} /><span>{text(language, "Add food item", "भोजन आइटम जोड़ें")}</span></button>} />
    {formOpen && <form className="panel form-panel" onSubmit={saveFood}>
      <div className="form-title"><div><h2>{editing ? text(language, "Edit food item", "भोजन आइटम संपादित करें") : text(language, "Add to your menu", "मेन्यू में जोड़ें")}</h2><p>{text(language, "Set a name and price for each dish.", "हर व्यंजन का नाम और कीमत तय करें।")}</p></div><button type="button" className="icon-button" aria-label={text(language, "Close form", "फ़ॉर्म बंद करें")} onClick={() => setFormOpen(false)}><Icon name="close" size={18} /></button></div>
      <div className="form-grid">
        <label>{text(language, "Food item name", "भोजन का नाम")}<input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={text(language, "e.g. Vegetable biryani", "जैसे सब्ज़ी बिरयानी")} /></label>
        <label>{text(language, "Price (your local currency)", "कीमत (स्थानीय मुद्रा)")}<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" /></label>
        <label className="full-field">{text(language, "Description", "विवरण")}<textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={text(language, "A short description or serving size", "छोटा विवरण या सर्विंग आकार")} /></label>
        <div className="image-upload full-field">
          <div className="image-preview">{form.image ? <img src={form.image} alt={text(language, "Food item preview", "भोजन आइटम पूर्वावलोकन")} /> : <Icon name="cookingPot" size={30} />}</div>
          <div className="image-upload-details">
            <strong>{text(language, "Food photo", "भोजन का चित्र")}</strong>
            <p>{text(language, "Add a picture to make this dish easy to recognize. Images are resized before saving.", "व्यंजन पहचानने में आसान बनाने के लिए चित्र जोड़ें। सहेजने से पहले चित्र का आकार बदला जाएगा।")}</p>
            <div className="image-upload-actions">
              <label className="button button-outline image-file-button">{form.image ? text(language, "Change image", "चित्र बदलें") : text(language, "Choose image", "चित्र चुनें")}<input type="file" accept="image/jpeg,image/png,image/webp" aria-label={text(language, "Choose food image", "भोजन चित्र चुनें")} onChange={handleImageChange} /></label>
              {form.image && <button type="button" className="image-remove" onClick={() => setForm({ ...form, image: "" })}>{text(language, "Remove image", "चित्र हटाएं")}</button>}
              {imageLoading && <span className="image-progress">{text(language, "Preparing image…", "चित्र तैयार हो रहा है…")}</span>}
            </div>
            {imageError && <p className="image-error" role="alert">{imageError}</p>}
          </div>
        </div>
        <label className="checkbox-field full-field"><input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /><span>{text(language, "Available to order", "ऑर्डर के लिए उपलब्ध")}</span></label>
      </div>
      <div className="form-actions"><button type="button" className="button button-outline" onClick={() => setFormOpen(false)}>{text(language, "Cancel", "रद्द करें")}</button><button className="button button-primary" disabled={imageLoading}>{imageLoading ? text(language, "Preparing image…", "चित्र तैयार हो रहा है…") : editing ? text(language, "Save changes", "बदलाव सहेजें") : text(language, "Save food item", "भोजन आइटम सहेजें")}</button></div>
    </form>}
    <section className="panel data-panel">
      <div className="panel-heading"><div><h2>{text(language, "Your dishes", "आपके व्यंजन")} <span className="count-pill">{foods.length}</span></h2><p>{text(language, "Only available items can be added to new orders", "केवल उपलब्ध आइटम नए ऑर्डर में जोड़े जा सकते हैं")}</p></div></div>
      {foods.length ? <div className="table-scroll"><table><thead><tr><th>{text(language, "FOOD ITEM", "भोजन आइटम")}</th><th>{text(language, "DESCRIPTION", "विवरण")}</th><th>{text(language, "PRICE", "कीमत")}</th><th>{text(language, "AVAILABILITY", "उपलब्धता")}</th><th></th></tr></thead><tbody>{foods.map((food) => <tr key={food.id}><td><div className="food-cell">{food.image ? <img className="food-thumbnail" src={food.image} alt="" /> : <span className="food-emoji"><Icon name="cookingPot" size={17} /></span>}<strong>{food.name}</strong></div></td><td className="muted-cell">{food.description || "—"}</td><td className="price-cell">{formatPrice(food.price)}</td><td><span className={`availability ${food.available !== false ? "available" : "unavailable"}`}>{food.available !== false ? text(language, "Available", "उपलब्ध") : text(language, "Unavailable", "अनुपलब्ध")}</span></td><td><div className="row-actions"><button onClick={() => startEdit(food)}>{text(language, "Edit", "संपादित करें")}</button><button className="danger-link" onClick={() => remove(food)}>{text(language, "Delete", "हटाएं")}</button></div></td></tr>)}</tbody></table></div> : <EmptyState icon="cookingPot" title={text(language, "Your menu starts here", "आपका मेन्यू यहाँ से शुरू होता है")} text={text(language, "Add your first home-cooked dish, description, and price.", "अपना पहला घरेलू व्यंजन, विवरण और कीमत जोड़ें।")} />}
    </section>
  </>;
}

function Orders({ language, data, customerById, onChange, newOrderRequested, onNewOrderRequestHandled }) {
  const [formOpen, setFormOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [quantities, setQuantities] = useState({});
  const [statusFilter, setStatusFilter] = useState("All orders");
  const activeFoods = data.foods.filter((food) => food.available !== false);
  const statuses = STATUS_KEYS;
  useEffect(() => {
    if (!newOrderRequested) return;
    setFormOpen(true);
    onNewOrderRequestHandled(false);
  }, [newOrderRequested, onNewOrderRequestHandled]);

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
    <PageHeading eyebrow={text(language, "FROM ORDER TO DELIVERY", "ऑर्डर से डिलीवरी तक")} title={text(language, "Orders", "ऑर्डर")} description={text(language, "Track what’s been ordered and what still needs your attention.", "क्या ऑर्डर हुआ है और किस पर ध्यान देना है, सब देखें।")} action={<button className="button button-primary" onClick={() => setFormOpen(!formOpen)}><Icon name="plus" size={16} /><span>{text(language, "New order", "नया ऑर्डर")}</span></button>} />
    {formOpen && <form className="panel form-panel" onSubmit={addOrder}>
      <div className="form-title"><div><h2>{text(language, "Create an order", "ऑर्डर बनाएं")}</h2><p>{text(language, "Choose a customer and add dishes to their order.", "ग्राहक चुनें और उनके ऑर्डर में व्यंजन जोड़ें।")}</p></div><button type="button" className="icon-button" aria-label={text(language, "Close form", "फ़ॉर्म बंद करें")} onClick={() => setFormOpen(false)}><Icon name="close" size={18} /></button></div>
      {!data.customers.length || !activeFoods.length ? <div className="inline-notice">{!data.customers.length ? text(language, "Add a customer before creating an order.", "ऑर्डर बनाने से पहले ग्राहक जोड़ें।") : text(language, "Add an available food item to your menu before creating an order.", "ऑर्डर बनाने से पहले मेन्यू में उपलब्ध भोजन आइटम जोड़ें।")}</div> : <>
        <div className="form-grid"><label>{text(language, "Customer", "ग्राहक")}<select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">{text(language, "Choose customer", "ग्राहक चुनें")}</option>{data.customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {label(language, CUSTOMER_TYPE_LABELS[customer.type])}</option>)}</select></label></div>
        <div className="order-items">{activeFoods.map((food) => <label className="order-item" key={food.id}><span><strong>{food.name}</strong><small>{text(language, `${formatPrice(food.price)} each`, `प्रति ${formatPrice(food.price)}`)}</small></span><input aria-label={text(language, `Quantity of ${food.name}`, `${food.name} की मात्रा`)} type="number" min="0" step="1" value={quantities[food.id] || ""} onChange={(e) => setQuantities({ ...quantities, [food.id]: e.target.value })} placeholder="0" /></label>)}</div>
        <div className="form-actions"><button type="button" className="button button-outline" onClick={() => setFormOpen(false)}>{text(language, "Cancel", "रद्द करें")}</button><button className="button button-primary">{text(language, "Save order", "ऑर्डर सहेजें")}</button></div>
      </>}
    </form>}
    <section className="panel data-panel">
      <div className="panel-heading table-heading"><div><h2>{text(language, "Order history", "ऑर्डर इतिहास")} <span className="count-pill">{data.orders.length}</span></h2><p>{text(language, "Update order status as you prepare and deliver", "तैयारी और डिलीवरी के अनुसार स्थिति अपडेट करें")}</p></div><select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={text(language, "Filter orders", "ऑर्डर फ़िल्टर करें")}><option value="All orders">{text(language, "All orders", "सभी ऑर्डर")}</option>{statuses.map((status) => <option key={status} value={status}>{label(language, STATUS_LABELS[status])}</option>)}</select></div>
      {filtered.length ? <div className="table-scroll"><table><thead><tr><th>{text(language, "ORDER", "ऑर्डर")}</th><th>{text(language, "CUSTOMER", "ग्राहक")}</th><th>{text(language, "ITEMS", "आइटम")}</th><th>{text(language, "DATE", "तिथि")}</th><th>{text(language, "TOTAL", "कुल")}</th><th>{text(language, "STATUS", "स्थिति")}</th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id}><td><span className="order-number">#{order.id.slice(0, 6).toUpperCase()}</span></td><td><strong>{order.customerName || customerById.get(order.customerId)?.name || text(language, "Deleted customer", "हटाया गया ग्राहक")}</strong></td><td className="items-cell">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</td><td>{formatDate(order.createdAt)}</td><td className="price-cell">{formatPrice(order.total)}</td><td><select className={`status-select status-${order.status.toLowerCase()}`} aria-label={text(language, `Status for order ${order.id}`, `ऑर्डर ${order.id} की स्थिति`)} value={order.status} onChange={(e) => setStatus(order.id, e.target.value)}>{statuses.map((status) => <option key={status} value={status}>{label(language, STATUS_LABELS[status])}</option>)}</select></td></tr>)}</tbody></table></div> : <EmptyState icon="receipt" title={statusFilter === "All orders" ? text(language, "No orders to show", "दिखाने के लिए कोई ऑर्डर नहीं") : text(language, `No ${statusFilter.toLowerCase()} orders`, `${label(language, STATUS_LABELS[statusFilter])} ऑर्डर नहीं`)} text={statusFilter === "All orders" ? text(language, "Create an order to keep track of what you’re cooking.", "क्या पक रहा है, इसका हिसाब रखने के लिए ऑर्डर बनाएं।") : text(language, "Orders with this status will appear here.", "इस स्थिति वाले ऑर्डर यहाँ दिखेंगे।")} />}
    </section>
  </>;
}

function OrderRow({ language, order, customerName }) {
  return <tr><td><span className="order-number">#{order.id.slice(0, 6).toUpperCase()}</span></td><td><strong>{customerName}</strong></td><td>{formatDate(order.createdAt)}</td><td className="price-cell">{formatPrice(order.total)}</td><td><span className={`status-pill status-${order.status.toLowerCase()}`}>{label(language, STATUS_LABELS[order.status]) || order.status}</span></td></tr>;
}

function Promotions({ language, data, onChange }) {
  const [target, setTarget] = useState(CUSTOMER_TYPES[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [customMessages, setCustomMessages] = useState({});
  const [activeCampaign, setActiveCampaign] = useState(null);
  const offerIdeas = [
    { id: "new-customer-welcome", title: text(language, "Welcome treat", "स्वागत का तोहफ़ा"), target: "New customer", message: text(language, "Hi {name}! Welcome to Goodfood. Enjoy 10% off your first order. Reply to place your order.", "नमस्ते {name}! Goodfood में आपका स्वागत है। अपने पहले ऑर्डर पर 10% छूट पाएं। ऑर्डर देने के लिए जवाब दें।") },
    { id: "existing-customer-thanks", title: text(language, "Loyalty thank-you", "वफ़ादारी के लिए धन्यवाद"), target: "Existing customer", message: text(language, "Hi {name}! Thank you for being a loyal customer. Enjoy 15% off your next order. Reply when you’re ready to order.", "नमस्ते {name}! हमारे वफ़ादार ग्राहक बने रहने के लिए धन्यवाद। अपने अगले ऑर्डर पर 15% छूट पाएं। ऑर्डर देने के लिए जवाब दें।") },
    { id: "guest-return", title: text(language, "Come back for more", "फिर से आइए"), target: "Guest customer", message: text(language, "Hi {name}! We’d love to cook for you again. Enjoy 5% off your next order. Reply to order.", "नमस्ते {name}! हम आपके लिए फिर से खाना बनाना चाहेंगे। अपने अगले ऑर्डर पर 5% छूट पाएं। ऑर्डर देने के लिए जवाब दें।") },
    { id: "referral-thanks", title: text(language, "Referral thank-you", "रेफ़रल के लिए धन्यवाद"), target: "Referral customer", message: text(language, "Hi {name}! Thanks for referring a friend to our kitchen. Enjoy 20% off your next order. Reply to claim your offer.", "नमस्ते {name}! हमारे किचन की सिफ़ारिश अपने दोस्त से करने के लिए धन्यवाद। अपने अगले ऑर्डर पर 20% छूट पाएं। ऑफ़र पाने के लिए जवाब दें।") },
    { id: "special-customer-treat", title: text(language, "A special treat", "आपके लिए खास तोहफ़ा"), target: "Special customer", message: text(language, "Hi {name}! Here’s a special thank-you just for you: enjoy 20% off your next order. Reply to order.", "नमस्ते {name}! आपके लिए खास धन्यवाद: अपने अगले ऑर्डर पर 20% छूट पाएं। ऑर्डर देने के लिए जवाब दें।") },
  ];
  const eligible = data.customers.filter((customer) => customer.type === target && customer.consent && customer.phone);
  const groupCustomers = data.customers.filter((customer) => customer.type === target);
  const selectedCustomer = eligible.find((customer) => customer.id === selectedCustomerId);
  const missingConsentCustomers = data.customers.filter((customer) => customer.type === target && !customer.consent);
  const missingConsent = missingConsentCustomers.length;
  const selectCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    if (!customerId) return;
    const suggestedOffer = offerIdeas.find((idea) => idea.target === target);
    if (!suggestedOffer) return;
    setTitle((current) => current.trim() ? current : suggestedOffer.title);
    setMessage((current) => current.trim() ? current : suggestedOffer.message);
  };
  const personalizeMessage = (customer) => {
    const customerName = customer.name.trim();
    const personalizedMessage = message.replaceAll("{name}", customerName).trim();
    const greetedMessage = !customerName || personalizedMessage.includes(customerName)
      ? personalizedMessage
      : `${language === "hi" ? "नमस्ते" : "Hi"} ${customerName}!${personalizedMessage ? ` ${personalizedMessage}` : ""}`;
    return [greetedMessage, title.trim()].filter(Boolean).join("\n\n");
  };
  const createCampaign = (event) => {
    event.preventDefault();
    const campaign = { id: newId(), title: title.trim(), message: message.trim(), customMessages, target, createdAt: new Date().toISOString() };
    onChange([campaign, ...data.promotions]);
    setActiveCampaign(campaign);
  };
  const createLink = (customer, channel) => {
    const text = encodeURIComponent(customMessages[customer.id] ?? personalizeMessage(customer));
    if (channel === "WhatsApp") {
      const phone = customer.phone.replace(/\D/g, "");
      return `https://wa.me/${phone}?text=${text}`;
    }
    return `sms:${customer.phone}?body=${text}`;
  };

  return <>
    <PageHeading eyebrow={text(language, "A LITTLE SOMETHING FOR THEM", "उन्हें थोड़ा खास दें")} title={text(language, "Promotions", "प्रचार")} description={text(language, "Write an offer for a customer group and open a message draft for each opted-in customer.", "ग्राहक समूह के लिए ऑफ़र लिखें और सहमति वाले हर ग्राहक के लिए संदेश ड्राफ़्ट खोलें।")} />
    <div className="promotion-layout">
      <form className="panel campaign-panel" onSubmit={createCampaign}>
        <div className="panel-heading"><div><h2>{text(language, "Create a message", "संदेश बनाएं")}</h2><p>{text(language, "Choose who it’s for and what you’d like to say.", "चुनें कि यह किसके लिए है और क्या कहना है।")}</p></div><span className="campaign-mark"><Icon name="sparkles" size={16} /></span></div>
        <label>{text(language, "Customer group", "ग्राहक समूह")}<select value={target} onChange={(e) => { setTarget(e.target.value); setSelectedCustomerId(""); setCustomMessages({}); setActiveCampaign(null); }}>{CUSTOMER_TYPES.map((type) => <option key={type} value={type}>{label(language, CUSTOMER_TYPE_LABELS[type])}</option>)}</select></label>
        <div className="audience-note"><span><Icon name="users" size={16} /></span><div><strong>{text(language, `${eligible.length} opted-in ${eligible.length === 1 ? "customer" : "customers"}`, `${eligible.length} सहमति वाले ग्राहक`)}</strong><small>{missingConsent ? <>{text(language, `${missingConsent} in this group haven’t agreed to receive promotions:`, `${missingConsent} ने प्रचार प्राप्त करने की सहमति नहीं दी:`)} {missingConsentCustomers.map((customer) => customer.name).join(", ")}</> : text(language, "Only customers who agreed to promotional messages are included.", "केवल प्रचार संदेश के लिए सहमत ग्राहक शामिल हैं।")}</small></div></div>
        <label>{text(language, "Customer", "ग्राहक")}<select value={selectedCustomerId} onChange={(e) => selectCustomer(e.target.value)}><option value="">{eligible.length ? text(language, "Choose a customer", "ग्राहक चुनें") : text(language, "No opted-in customers in this group", "इस समूह में सहमति वाले ग्राहक नहीं")}</option>{groupCustomers.map((customer) => <option key={customer.id} value={customer.id} disabled={!customer.consent || !customer.phone}>{customer.name}{!customer.consent ? ` · ${text(language, "Not opted in", "सहमति नहीं है")}` : !customer.phone ? ` · ${text(language, "Phone number missing", "फ़ोन नंबर नहीं है")}` : ""}</option>)}</select></label>
        <label>{text(language, "Offer title", "ऑफ़र का शीर्षक")}<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={text(language, "e.g. Weekend family meal", "जैसे सप्ताहांत परिवार भोजन")} /></label>
        <label>{text(language, selectedCustomer ? `SMS message for ${selectedCustomer.name}` : "Personalized SMS message", selectedCustomer ? `${selectedCustomer.name} के लिए SMS संदेश` : "व्यक्तिगत SMS संदेश")}<textarea rows="4" disabled={!selectedCustomer} value={selectedCustomer ? customMessages[selectedCustomer.id] ?? personalizeMessage(selectedCustomer) : ""} onChange={(e) => { if (selectedCustomer) setCustomMessages((current) => ({ ...current, [selectedCustomer.id]: e.target.value })); }} placeholder={text(language, "Choose a customer to customize their message.", "संदेश अनुकूलित करने के लिए ग्राहक चुनें।")} /></label>
        <button className="button button-primary button-wide">{text(language, "Save offer & prepare messages", "ऑफ़र सहेजें और संदेश तैयार करें")}</button>
      </form>
      <div className="promotion-side">
        {activeCampaign && <section className="panel audience-panel"><div className="panel-heading"><div><h2>{activeCampaign.title}</h2><p>{label(language, CUSTOMER_TYPE_LABELS[activeCampaign.target])} · {eligible.length} {text(language, "opted-in", "सहमति वाले")}</p></div><span className="live-dot" /></div>
          {eligible.length ? <div className="audience-list">{eligible.map((customer) => <div className="audience-row" key={customer.id}><span className="avatar">{customer.name.trim().charAt(0).toUpperCase()}</span><div><strong>{customer.name}</strong><small>{customer.phone}</small></div><div className="message-actions"><a className="mini-action" href={createLink(customer, "SMS")}>SMS</a><a className="mini-action whatsapp" target="_blank" rel="noreferrer" href={createLink(customer, "WhatsApp")}>WhatsApp</a></div></div>)}</div> : <EmptyState icon="sparkles" title={text(language, "No opted-in customers", "सहमति वाले ग्राहक नहीं")} text={text(language, "Add customers to this group and record their permission before messaging.", "संदेश भेजने से पहले इस समूह में ग्राहक जोड़ें और उनकी अनुमति दर्ज करें।")} />}
        </section>}
        <section className="panel tip-panel"><span className="tip-icon"><Icon name="heart" size={16} /></span><div><strong>{text(language, "A note about messages", "संदेश संबंधी जानकारी")}</strong><p>{text(language, "Contact only people who agreed to receive promotions, and follow your local messaging and privacy rules. SMS and WhatsApp drafts open one at a time; this app does not send messages on its own.", "केवल प्रचार पाने की सहमति देने वालों से संपर्क करें और स्थानीय संदेश व गोपनीयता नियम मानें। SMS और WhatsApp ड्राफ़्ट एक-एक करके खुलते हैं; यह ऐप अपने आप संदेश नहीं भेजता।")}</p></div></section>
        <section className="panel history-panel"><div className="panel-heading"><div><h2>{text(language, "Saved offers", "सहेजे गए ऑफ़र")}</h2><p>{text(language, "Your recent promotion drafts", "आपके हाल के प्रचार ड्राफ़्ट")}</p></div></div>
          <strong>{text(language, "Offer ideas by customer type", "ग्राहक प्रकार के अनुसार ऑफ़र सुझाव")}</strong>
          <div className="saved-offers">{offerIdeas.map((idea) => <button key={idea.id} className="saved-offer" onClick={() => { setTitle(idea.title); setMessage(idea.message); setTarget(idea.target); setSelectedCustomerId(""); setCustomMessages({}); setActiveCampaign(null); }}><span className="offer-symbol"><Icon name="sparkles" size={15} /></span><span><strong>{idea.title}</strong><small>{label(language, CUSTOMER_TYPE_LABELS[idea.target])} · {text(language, "Offer idea", "ऑफ़र सुझाव")}</small></span><b><Icon name="arrowRight" size={15} /></b></button>)}</div>
          <strong>{text(language, "Your saved offers", "आपके सहेजे गए ऑफ़र")}</strong>
          {data.promotions.length ? <div className="saved-offers">{data.promotions.slice(0, 5).map((promotion) => <button key={promotion.id} className="saved-offer" onClick={() => { setTitle(promotion.title); setMessage(promotion.message); setTarget(promotion.target); setSelectedCustomerId(""); setCustomMessages(promotion.customMessages || {}); setActiveCampaign(promotion); }}><span className="offer-symbol"><Icon name="sparkles" size={15} /></span><span><strong>{promotion.title}</strong><small>{label(language, CUSTOMER_TYPE_LABELS[promotion.target])} · {formatDate(promotion.createdAt)}</small></span><b><Icon name="arrowRight" size={15} /></b></button>)}</div> : <p className="no-offers">{text(language, "Your saved offers will appear here.", "आपके सहेजे गए ऑफ़र यहाँ दिखेंगे।")}</p>}
        </section>
      </div>
    </div>
  </>;
}

export default App;
