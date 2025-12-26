# ⚡ HƯỚNG DẪN NHANH: Chạy Local Server

## 🎯 Cách DỄ NHẤT: Live Server trong VS Code

### 📥 Bước 1: Cài đặt Extension (chỉ làm 1 lần)

1. Mở VS Code
2. Nhấn `Ctrl + Shift + X`
3. Tìm: **"Live Server"**
4. Click **Install** (extension by Ritwick Dey - hơn 40 triệu downloads)

![Live Server Extension](https://raw.githubusercontent.com/ritwickdey/vscode-live-server/master/images/Screenshot/vscode-live-server-animated-demo.gif)

### 🚀 Bước 2: Chạy Server

**CÁCH 1 (Nhanh nhất):**
- Mở file `index.html`
- Click nút **"Go Live"** ở góc dưới bên phải màn hình
- ✅ XONG! Trình duyệt tự động mở

**CÁCH 2:**
- Click chuột phải vào `index.html`
- Chọn **"Open with Live Server"**

### ✅ Bước 3: Kiểm tra kết quả

URL sẽ là: `http://127.0.0.1:5500/index.html`

**Mở Console (F12) để xem:**
```
📦 Loading database...
✅ Database loaded successfully!
📊 Data records: 10
📊 Barcode records: 2
✅ Tìm thấy cột trạng thái: Trạng thái
📊 Rack Inventory Stats:
  🟡 Vị trí trống: 5
  🔵 Vị trí có hàng: 5
  📝 Total: 10
```

**Kiểm tra UI:**
- Badge "Vị Trí Trống" hiển thị: **5**
- Badge "Vị Trí Có Hàng" hiển thị: **5**

---

## 🛑 Dừng Server

- Click nút **"Port: 5500"** ở góc dưới bên phải
- Hoặc click **"Stop Live Server"**

---

## ⚠️ Lưu ý quan trọng

1. **KHÔNG mở file:// nữa** - luôn dùng http://localhost
2. Server tự động reload khi bạn sửa code
3. Nếu thay đổi file JSON, reload lại trang (F5)

---

## 🔍 Nếu vẫn thấy "0" trong badges

1. Kiểm tra file `data.json` có trong thư mục không
2. Mở Console (F12) xem có error không
3. Reload trang bằng `Ctrl + F5` (hard reload)
4. Kiểm tra URL phải là `http://127.0.0.1:5500` chứ không phải `file://`

---

## 📞 Cần trợ giúp?

Nếu gặp khó khăn, hãy:
1. Chụp màn hình Console (F12)
2. Check URL trên address bar
3. Kiểm tra xem Live Server extension đã cài chưa
