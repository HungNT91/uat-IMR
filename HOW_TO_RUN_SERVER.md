# 🚀 Hướng dẫn chạy Local Server

## Cách 1: Live Server trong VS Code (KHUYẾN NGHỊ - DỄ NHẤT)

### Bước 1: Cài đặt Live Server Extension

1. Mở VS Code
2. Click vào biểu tượng **Extensions** (hoặc nhấn `Ctrl+Shift+X`)
3. Tìm kiếm: **"Live Server"** (by Ritwick Dey)
4. Click **Install**

### Bước 2: Chạy server

**Cách A: Click chuột phải**
1. Mở file `index.html` trong VS Code
2. Click chuột phải vào file
3. Chọn **"Open with Live Server"**
4. Trình duyệt sẽ tự động mở tại `http://127.0.0.1:5500`

**Cách B: Click nút "Go Live"**
1. Mở file `index.html`
2. Nhìn xuống góc dưới bên phải VS Code
3. Click nút **"Go Live"**
4. Server sẽ khởi động

### Bước 3: Kiểm tra

- URL sẽ là: `http://127.0.0.1:5500/index.html`
- Mở Console (F12) để xem:
  ```
  📦 Loading database...
  ✅ Database loaded successfully!
  📊 Data records: 10
  📊 Barcode records: 2
  ```

---

## Cách 2: Python HTTP Server (Nếu không có VS Code)

### Kiểm tra Python đã cài chưa:
```powershell
python --version
```

### Chạy server:
```powershell
cd d:\BC\UAT-IMR
python -m http.server 8000
```

### Mở trình duyệt:
```
http://localhost:8000
```

### Dừng server:
Nhấn `Ctrl+C` trong terminal

---

## Cách 3: Node.js HTTP Server

### Cài đặt (chỉ cần làm 1 lần):
```powershell
npm install -g http-server
```

### Chạy server:
```powershell
cd d:\BC\UAT-IMR
http-server
```

### Mở trình duyệt:
```
http://localhost:8080
```

---

## Cách 4: Tạo file Batch để chạy nhanh (Python)

Tôi sẽ tạo file `start-server.bat` cho bạn!

---

## ⚠️ Lưu ý

1. **Không đóng terminal/command prompt** khi server đang chạy
2. Sau khi chạy server, **không mở file:// nữa**, chỉ mở qua `http://localhost`
3. Nếu muốn dừng server, nhấn `Ctrl+C` trong terminal

---

## 🔍 Kiểm tra thành công

Mở Console (F12) và xem:
- ✅ **"Database loaded successfully!"**
- ✅ **"Data records: 10"**
- ✅ Badge hiển thị: **5** (Trống) và **5** (Có Hàng)

Nếu vẫn thấy số 0, reload lại trang (Ctrl+F5).
