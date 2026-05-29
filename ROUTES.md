# SITEHUB — Route Map & Role Access

## Auth Routes
| Route | Screen | Access |
|---|---|---|
| `/auth/login` | Login | Public |
| `/auth/register` | Register | Public |

## Index (cold-start redirect)
| Route | Redirects to |
|---|---|
| `/` | Based on role (see below) |

## Role-based redirect after login
| Role | Redirects to |
|---|---|
| `sales` | `/sales` |
| `printer` | `/printer/queue` |
| `admin` | `/admin` |
| `customer` / `guest` | `/(tabs)` |

---

## Sales Routes (`/sales/`)
| Route | Screen | Footer |
|---|---|---|
| `/sales` | Sales Dashboard | ✅ Yes |
| `/sales/orders` | My Orders | ✅ Yes |
| `/sales/payouts` | My Payouts | ✅ Yes |
| `/sales/me` | Profile | ✅ Yes |
| `/sales/settings` | Settings | ✅ Yes |
| `/new-order` | New Order (3-step form) | ❌ No |
| `/order-detail/[orderId]` | Order Detail | ❌ No |

---

## Printer Routes (`/printer/`)
| Route | Screen | Footer |
|---|---|---|
| `/printer/queue` | Job Queue | ✅ Yes |
| `/printer/scan` | Quick NFC Scan | ✅ Yes |
| `/printer/wages` | My Wages | ✅ Yes |
| `/printer/me` | Profile | ✅ Yes |
| `/printer/settings` | Settings | ✅ Yes |
| `/printer/nfc/[jobId]` | NFC Programming | ❌ No |
| `/printer/qa/[jobId]` | QA Video Capture | ❌ No |

---

## Admin Routes (`/admin/`)
| Route | Screen | Access |
|---|---|---|
| `/admin` | Dashboard | Admin only |
| `/admin/users` | User Management | Admin only |
| `/admin/orders` | All Orders | Admin only |
| `/admin/nfc-logs` | NFC Write Logs | Admin only |
| `/admin/salary` | Salary & Commission | Admin only |
| `/admin/qa-videos` | QA Video Review | Admin only |
| `/admin/reports` | Reports | Admin only |
| `/admin/products` | Products & Pricing | Admin only |
| `/admin/settings` | App Settings | Admin only |

---

## Generic Tabs (`/(tabs)/`)
| Route | Screen | Access |
|---|---|---|
| `/(tabs)` | Home | Customer / Guest |
| `/(tabs)/attendance` | Orders/Queue | Customer / Guest |
| `/(tabs)/profile` | Profile | Customer / Guest |
| `/(tabs)/settings` | Settings | Customer / Guest |

---

## Public Routes
| Route | Screen | Access |
|---|---|---|
| `/public/[slug]` | Public Bio Page | Everyone |
| `/activate-card` | Activate NFC Card | Customer |
| `/edit-bio` | Edit Bio Page | Customer |
| `/theme-picker` | Theme Picker | Customer |

---

## Demo Accounts (password: `demo1234`)
| Email | Role | Route |
|---|---|---|
| `sales@demo.com` | Sales | `/sales` |
| `sales2@demo.com` | Sales | `/sales` |
| `printer@demo.com` | Printer | `/printer/queue` |
| `printer2@demo.com` | Printer | `/printer/queue` |
| `admin@demo.com` | Admin | `/admin` |
| `empty@demo.com` | Sales (empty) | `/sales` |
