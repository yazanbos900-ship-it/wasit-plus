import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to load/save JSON database on the server
interface DatabaseSchema {
  banners: any[];
  categories: any[];
  ads: any[];
  orders: any[];
  chats: any[];
  reports: any[];
  users: any[];
  notifications: any[];
  [key: string]: any[];
}

const DEFAULT_DB: DatabaseSchema = {
  categories: [
    { id: '1', name: 'سيارات', icon: 'fas fa-car' },
    { id: '2', name: 'عقارات', icon: 'fas fa-home' },
    { id: '3', name: 'إلكترونيات', icon: 'fas fa-laptop' },
    { id: '4', name: 'خدمات', icon: 'fas fa-concierge-bell' }
  ],
  banners: [
    { id: '1', title: 'مرحباً بكم في وسيط بلاس', subtitle: 'أكبر منصة إعلانات في سوريا', image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80', active: true }
  ],
  ads: [
    {
      id: "ad-1",
      title: "آيفون 15 برو ماكس جديد",
      description: "جهاز جديد لم يفتح، لون تايتنيوم طبيعي.",
      price: 4500,
      category: "إلكترونيات",
      image: "https://picsum.photos/seed/iphone/800/600",
      userId: "admin_zakour",
      userName: "المدير زكور",
      isFeatured: true,
      condition: "new",
      location: "دمشق",
      createdAt: new Date().toISOString()
    },
    {
      id: "ad-2",
      title: "سيارة تويوتا كامري 2024",
      description: "فل كامل، ممشى بسيط جداً، صيانة دورية بالوكالة.",
      price: 110000,
      category: "سيارات",
      image: "https://picsum.photos/seed/car/800/600",
      userId: "admin_zakour",
      userName: "المدير زكور",
      isFeatured: false,
      condition: "used",
      location: "دمشق",
      createdAt: new Date().toISOString()
    }
  ],
  orders: [],
  chats: [],
  reports: [],
  users: [
    {
      id: "admin_zakour",
      name: "المدير زكور",
      email: "admin@waseet.com",
      phone: "zakour",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
      storeName: "الإدارة العامة",
      storeImage: "https://picsum.photos/seed/store/200"
    }
  ],
  notifications: []
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf8");
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read database schema, resetting to default:", error);
    return DEFAULT_DB;
  }
}

function writeDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to write to database file:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to support JSON parsing with high payload size (for base64 images upload)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // --- API Routes ---

  // Notifications API
  app.get("/api/notifications/:userId", (req, res) => {
    const db = readDb();
    const userId = req.params.userId;
    const items = (db.notifications || []).filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(items);
  });

  app.post("/api/notifications/read/:id", (req, res) => {
    const db = readDb();
    db.notifications = (db.notifications || []).map(n => n.id === req.params.id ? { ...n, isRead: true } : n);
    writeDb(db);
    res.json({ success: true });
  });

  app.post("/api/notifications/read-all/:userId", (req, res) => {
    const db = readDb();
    db.notifications = (db.notifications || []).map(n => n.userId === req.params.userId ? { ...n, isRead: true } : n);
    writeDb(db);
    res.json({ success: true });
  });

  app.post("/api/notifications", (req, res) => {
    const db = readDb();
    const notif = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false
    };
    db.notifications = [notif, ...(db.notifications || [])];
    writeDb(db);
    res.json(notif);
  });

  // Banners API
  app.get("/api/banners", (req, res) => {
    const db = readDb();
    res.json(db.banners || []);
  });

  app.post("/api/banners", (req, res) => {
    const db = readDb();
    const newBanner = {
      id: Math.random().toString(36).substr(2, 9),
      title: req.body.title,
      subtitle: req.body.subtitle || "",
      image: req.body.image,
      active: true
    };
    db.banners = [newBanner, ...(db.banners || [])];
    writeDb(db);
    res.json(newBanner);
  });

  app.delete("/api/banners/:id", (req, res) => {
    const db = readDb();
    db.banners = (db.banners || []).filter(b => b.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  app.put("/api/banners/:id/status", (req, res) => {
    const db = readDb();
    db.banners = (db.banners || []).map(b => b.id === req.params.id ? { ...b, active: !b.active } : b);
    writeDb(db);
    res.json({ success: true });
  });

  // Categories API
  app.get("/api/categories", (req, res) => {
    const db = readDb();
    res.json(db.categories || []);
  });

  app.post("/api/categories", (req, res) => {
    const db = readDb();
    const newCat = {
      id: Math.random().toString(36).substr(2, 9),
      name: req.body.name,
      icon: req.body.icon || "fas fa-tag"
    };
    db.categories = [newCat, ...(db.categories || [])];
    writeDb(db);
    res.json(newCat);
  });

  app.delete("/api/categories/:id", (req, res) => {
    const db = readDb();
    db.categories = (db.categories || []).filter(c => c.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // Ads API
  app.get("/api/ads", (req, res) => {
    const db = readDb();
    const limitCount = Number(req.query.limit) || 100;
    const sortedAds = (db.ads || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(sortedAds.slice(0, limitCount));
  });

  app.get("/api/ads/user/:userId", (req, res) => {
    const db = readDb();
    const items = (db.ads || []).filter(a => a.userId === req.params.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(items);
  });

  app.get("/api/ads/:id", (req, res) => {
    const db = readDb();
    const ad = (db.ads || []).find(a => a.id === req.params.id);
    if (!ad) return res.status(404).json({ error: "الأعلان غير موجود" });
    res.json(ad);
  });

  app.post("/api/ads", (req, res) => {
    const db = readDb();
    const adData = req.body;
    const newAd = {
      id: Math.random().toString(36).substr(2, 9),
      title: adData.title || "",
      description: adData.description || "",
      price: adData.price || 0,
      category: adData.category || "عام",
      image: adData.image || "https://picsum.photos/seed/default/800/600",
      images: adData.images || [],
      userId: adData.userId,
      userName: adData.userName || "مستخدم",
      isFeatured: false,
      condition: adData.condition || "new",
      location: adData.location || "دمشق",
      createdAt: new Date().toISOString()
    };
    db.ads = [newAd, ...(db.ads || [])];
    writeDb(db);
    res.json(newAd);
  });

  app.delete("/api/ads/:id", (req, res) => {
    const db = readDb();
    db.ads = (db.ads || []).filter(a => a.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  app.put("/api/ads/:id/toggle-featured", (req, res) => {
    const db = readDb();
    db.ads = (db.ads || []).map(a => a.id === req.params.id ? { ...a, isFeatured: !a.isFeatured } : a);
    writeDb(db);
    res.json({ success: true });
  });

  app.put("/api/ads/:id", (req, res) => {
    const db = readDb();
    const updates = req.body;
    db.ads = (db.ads || []).map(a => a.id === req.params.id ? { ...a, ...updates } : a);
    writeDb(db);
    res.json({ success: true });
  });

  // Profile API
  app.get("/api/users/:userId", (req, res) => {
    const db = readDb();
    const user = (db.users || []).find(u => u.id === req.params.userId || u.phone === req.params.userId);
    res.json(user || null);
  });

  app.put("/api/users/store/:userId", (req, res) => {
    const db = readDb();
    db.users = (db.users || []).map(u => u.id === req.params.userId ? { ...u, ...req.body } : u);
    writeDb(db);
    res.json({ success: true });
  });

  app.get("/api/users", (req, res) => {
    const db = readDb();
    res.json(db.users || []);
  });

  app.delete("/api/users/:userId", (req, res) => {
    const db = readDb();
    db.users = (db.users || []).filter(u => u.id !== req.params.userId);
    writeDb(db);
    res.json({ success: true });
  });

  // Admin login registry
  app.post("/api/users/login-sync", (req, res) => {
    const db = readDb();
    const user = req.body;
    const existing = (db.users || []).find(u => u.id === user.id);
    if (!existing) {
      db.users = [...(db.users || []), user];
      writeDb(db);
    }
    res.json({ success: true });
  });

  // Reports API
  app.get("/api/reports", (req, res) => {
    const db = readDb();
    res.json(db.reports || []);
  });

  app.post("/api/reports", (req, res) => {
    const db = readDb();
    const report = {
      id: Math.random().toString(36).substr(2, 9),
      adId: req.body.adId,
      adTitle: req.body.adTitle,
      reporterId: req.body.reporterId,
      reporterName: req.body.reporterName,
      reason: req.body.reason,
      details: req.body.details,
      timestamp: new Date().toISOString(),
      status: "PENDING"
    };
    db.reports = [report, ...(db.reports || [])];
    writeDb(db);
    res.json(report);
  });

  app.put("/api/reports/:id/status", (req, res) => {
    const db = readDb();
    db.reports = (db.reports || []).map(r => r.id === req.params.id ? { ...r, status: req.body.status } : r);
    writeDb(db);
    res.json({ success: true });
  });

  // Orders API
  app.get("/api/orders", (req, res) => {
    const db = readDb();
    res.json(db.orders || []);
  });

  app.post("/api/orders", (req, res) => {
    const db = readDb();
    const orderData = req.body;
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      adId: orderData.adId,
      adTitle: orderData.adTitle,
      sellerId: orderData.sellerId,
      buyerId: orderData.buyerId,
      buyerName: orderData.buyerName,
      amount: orderData.amount,
      date: new Date().toISOString(),
      status: "PENDING",
      deliveryCode: orderData.deliveryCode,
      paymentMethod: orderData.paymentMethod,
      paymentProvider: orderData.paymentProvider,
      shippingAddress: orderData.shippingAddress
    };
    db.orders = [newOrder, ...(db.orders || [])];
    writeDb(db);
    res.json(newOrder);
  });

  app.put("/api/orders/:id/status", (req, res) => {
    const db = readDb();
    db.orders = (db.orders || []).map(o => o.id === req.params.id ? { ...o, status: req.body.status } : o);
    writeDb(db);
    res.json({ success: true });
  });

  // Comments / Reviews API
  app.get("/api/comments/:adId", (req, res) => {
    const db = readDb();
    const key = `comments_${req.params.adId}`;
    res.json(db[key] || []);
  });

  app.post("/api/comments/:adId", (req, res) => {
    const db = readDb();
    const key = `comments_${req.params.adId}`;
    const comment = {
      id: Math.random().toString(36).substr(2, 9),
      adId: req.params.adId,
      userId: req.body.userId,
      userName: req.body.userName,
      text: req.body.text,
      image: req.body.image,
      timestamp: new Date().toISOString()
    };
    db[key] = [comment, ...(db[key] || [])];
    writeDb(db);
    res.json(comment);
  });

  // Chats API
  app.get("/api/chats", (req, res) => {
    const db = readDb();
    res.json(db.chats || []);
  });

  app.get("/api/chats/:roomId/messages", (req, res) => {
    const db = readDb();
    const key = `messages_${req.params.roomId}`;
    res.json(db[key] || []);
  });

  app.post("/api/chats/message", (req, res) => {
    const db = readDb();
    const { roomId, ad, buyer, text, senderId, senderName } = req.body;

    let room = (db.chats || []).find(c => c.id === roomId);
    if (!room) {
      room = {
        id: roomId,
        adId: ad.id,
        adTitle: ad.title,
        buyerId: buyer.id,
        buyerName: buyer.name,
        sellerId: ad.userId,
        sellerName: ad.userName,
        lastUpdated: new Date().toISOString(),
        messages: []
      };
      db.chats = [...(db.chats || []), room];
    } else {
      room.lastUpdated = new Date().toISOString();
      db.chats = (db.chats || []).map(c => c.id === roomId ? room! : c);
    }

    const messageData = {
      id: Math.random().toString(36).substr(2, 9),
      senderId,
      senderName,
      text,
      timestamp: new Date().toISOString()
    };

    const key = `messages_${roomId}`;
    db[key] = [...(db[key] || []), messageData];

    writeDb(db);
    res.json({ room, messages: db[key] });
  });


  // Serve static assets & build Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

startServer();
