# HangHoaMMO - Shop Tài Khoản Số

Hệ thống quản lý shop bán tài khoản số với Node.js, Express và MongoDB.

## ✨ Tính năng

### Frontend
- ✅ Trang chủ với banner Tết và sản phẩm nổi bật
- ✅ Trang sản phẩm với bộ lọc và tìm kiếm
- ✅ Giỏ hàng và thanh toán đa phương thức
- ✅ Đăng nhập/Đăng ký modal popup
- ✅ Responsive design cho mọi thiết bị
- ✅ Tích hợp API backend

### Backend API
- ✅ Authentication với JWT
- ✅ Quản lý sản phẩm (CRUD)
- ✅ Quản lý đơn hàng
- ✅ Quản lý khách hàng
- ✅ Admin dashboard với thống kê
- ✅ Role-based access control (User/Admin)
- ✅ RESTful API design

## 🚀 Cài đặt nhanh

### Yêu cầu hệ thống
- Node.js 14+ (Tải tại: https://nodejs.org/)
- MongoDB (Local hoặc Atlas)

### Cách 1: Sử dụng script tự động (Windows)
```bash
# Chạy file start.bat
start.bat
```

### Cách 2: Cài đặt thủ công

#### 1. Cài đặt Node.js
Tải và cài đặt từ: https://nodejs.org/

#### 2. Cài đặt MongoDB
- **Local**: https://www.mongodb.com/try/download/community
- **Cloud (Atlas)**: https://www.mongodb.com/cloud/atlas/register (Miễn phí)

#### 3. Cài đặt dependencies
```bash
npm install
```

#### 4. Cấu hình file .env
File `.env` đã có sẵn, cập nhật nếu cần:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/HangHoaMMO
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

#### 5. Chạy server
```bash
# Development mode (tự động restart)
npm run dev

# Production mode
npm start
```

## 📱 Truy cập website

- **Trang chủ**: http://localhost:3000
- **Sản phẩm**: http://localhost:3000/products  
- **Admin**: http://localhost:3000/admin

## 👤 Tạo tài khoản Admin

1. Đăng ký tài khoản thông thường trên website
2. Vào MongoDB và cập nhật role:

```javascript
// MongoDB Compass hoặc mongo shell
use HangHoaMMO
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user
- `POST /api/auth/logout` - Đăng xuất

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm (Admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (Admin)

### Orders
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders` - Lấy đơn hàng của user
- `GET /api/orders/:id` - Chi tiết đơn hàng

### Users
- `GET /api/users/profile` - Lấy profile
- `PUT /api/users/profile` - Cập nhật profile
- `PUT /api/users/change-password` - Đổi mật khẩu

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/orders` - Tất cả đơn hàng
- `PUT /api/admin/orders/:id/status` - Cập nhật trạng thái đơn
- `GET /api/admin/customers` - Danh sách khách hàng
- `DELETE /api/admin/customers/:id` - Xóa khách hàng

## Tạo Admin Account

Sau khi đăng ký tài khoản, vào MongoDB và cập nhật role:

```javascript
// Trong MongoDB Compass hoặc mongo shell
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Cấu trúc thư mục

```
HangHoaMMO/
├── models/           # MongoDB models
│   ├── User.js
│   ├── Product.js
│   └── Order.js
├── routes/           # API routes
│   ├── auth.js
│   ├── products.js
│   ├── orders.js
│   ├── users.js
│   └── admin.js
├── middleware/       # Custom middleware
│   └── auth.js
├── public/           # Frontend files
│   ├── index.html
│   ├── products.html
│   ├── admin.html
│   ├── style.css
│   ├── script.js
│   └── admin.js
├── .env             # Environment variables
├── server.js        # Entry point
└── package.json
```

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)

## License

MIT


## 📚 API Documentation

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Đăng ký tài khoản | Public |
| POST | `/api/auth/login` | Đăng nhập | Public |
| GET | `/api/auth/me` | Lấy thông tin user | Private |
| POST | `/api/auth/logout` | Đăng xuất | Private |

### Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | Lấy danh sách sản phẩm | Public |
| GET | `/api/products/:id` | Chi tiết sản phẩm | Public |
| POST | `/api/products` | Tạo sản phẩm | Admin |
| PUT | `/api/products/:id` | Cập nhật sản phẩm | Admin |
| DELETE | `/api/products/:id` | Xóa sản phẩm | Admin |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Tạo đơn hàng | Private |
| GET | `/api/orders` | Lấy đơn hàng của user | Private |
| GET | `/api/orders/:id` | Chi tiết đơn hàng | Private |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard` | Thống kê dashboard | Admin |
| GET | `/api/admin/orders` | Tất cả đơn hàng | Admin |
| PUT | `/api/admin/orders/:id/status` | Cập nhật trạng thái | Admin |
| GET | `/api/admin/customers` | Danh sách khách hàng | Admin |
| DELETE | `/api/admin/customers/:id` | Xóa khách hàng | Admin |

## 📁 Cấu trúc thư mục

```
HangHoaMMO/
├── models/              # MongoDB models
│   ├── User.js         # User model
│   ├── Product.js      # Product model
│   └── Order.js        # Order model
├── routes/             # API routes
│   ├── auth.js         # Authentication routes
│   ├── products.js     # Product routes
│   ├── orders.js       # Order routes
│   ├── users.js        # User routes
│   └── admin.js        # Admin routes
├── middleware/         # Custom middleware
│   └── auth.js         # JWT authentication
├── public/             # Frontend files
│   ├── index.html      # Trang chủ
│   ├── products.html   # Trang sản phẩm
│   ├── admin.html      # Trang admin
│   ├── style.css       # Styles
│   ├── script.js       # Frontend logic
│   └── admin.js        # Admin logic
├── .env                # Environment variables
├── server.js           # Entry point
├── package.json        # Dependencies
├── start.bat           # Quick start script (Windows)
├── README.md           # Documentation
└── HUONG_DAN_CAI_DAT.md # Hướng dẫn chi tiết
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: express-validator
- **Environment**: dotenv
- **CORS**: cors middleware

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling với Flexbox/Grid
- **JavaScript** - Vanilla JS với Fetch API
- **Icons**: Font Awesome 6
- **Fonts**: Google Fonts (Inter)

## 🔧 Xử lý lỗi thường gặp

### ❌ "Cannot find module"
```bash
npm install
```

### ❌ "Port 3000 already in use"
Đổi PORT trong file `.env` hoặc tắt ứng dụng đang dùng port 3000

### ❌ "MongoDB connection failed"
- Kiểm tra MongoDB đã chạy chưa
- Kiểm tra MONGODB_URI trong `.env`
- Nếu dùng Atlas, kiểm tra IP whitelist

### ❌ "JWT must be provided"
- Đăng nhập lại
- Xóa localStorage và thử lại

### ❌ "Node.js is not recognized"
- Cài đặt Node.js từ https://nodejs.org/
- Khởi động lại terminal/máy tính

## 📝 Ghi chú

- File frontend đã được di chuyển vào thư mục `public/`
- Frontend đã tích hợp API backend, không còn dùng localStorage cho products
- Cart vẫn dùng localStorage cho trải nghiệm tốt hơn
- Cần đăng nhập để đặt hàng
- Cần role admin để truy cập admin panel

## 🔐 Bảo mật

- Mật khẩu được hash với bcryptjs
- JWT token cho authentication
- Protected routes với middleware
- Role-based access control
- Input validation với express-validator

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. ✅ Node.js và npm đã cài đặt đúng
2. ✅ MongoDB đang chạy
3. ✅ File `.env` đã cấu hình đúng
4. ✅ Tất cả dependencies đã được cài đặt
5. ✅ Port 3000 không bị chiếm dụng

Xem thêm hướng dẫn chi tiết trong file `HUONG_DAN_CAI_DAT.md`

## 📄 License

MIT

---

Made with ❤️ by HangHoaMMO Team
