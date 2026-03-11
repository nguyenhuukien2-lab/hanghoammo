# Cấu trúc dự án HangHoaMmo

## 📁 Cấu trúc thư mục

```
hanghoammo/
├── 📁 src/                     # Mã nguồn chính
│   ├── 📁 config/             # Cấu hình database, supabase
│   ├── 📁 middleware/         # Middleware xác thực, bảo mật
│   ├── 📁 models/            # Models dữ liệu
│   ├── 📁 routes/            # API routes
│   └── 📁 services/          # Services (email, telegram)
├── 📁 database/              # Scripts SQL và database
├── 📁 scripts/               # Scripts tiện ích và bot
├── 📁 tests/                 # Test files
├── 📁 docs/                  # Tài liệu dự án
├── 📁 public/                # Static files (HTML, CSS, JS)
├── 📄 server-supabase.js     # File server chính
└── 📄 package.json           # Dependencies và scripts
```

## 🚀 Chạy dự án

```bash
npm start          # Chạy production
npm run dev        # Chạy development với nodemon
```

## 📋 Mô tả thư mục

- **src/**: Chứa toàn bộ mã nguồn backend
- **database/**: Scripts tạo bảng và cấu trúc database
- **scripts/**: Các script tiện ích như tạo admin, telegram bot
- **tests/**: File test các chức năng
- **docs/**: Tài liệu hướng dẫn và setup
- **public/**: Frontend files (HTML, CSS, JS)