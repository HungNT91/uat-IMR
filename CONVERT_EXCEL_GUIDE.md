# 🔄 HƯỚNG DẪN: Chuyển đổi Excel sang JSON

## ⚠️ QUAN TRỌNG

Hiện tại ứng dụng đang dùng **DỮ LIỆU MẪU**, chưa phải dữ liệu thật từ Excel của bạn!

Bạn CẦN convert 2 file Excel thành JSON:
- `data.xlsx` → `data.json`
- `databarcode.xlsx` → `databarcode.json`

---

## 📝 Các bước thực hiện

### Bước 1: Mở công cụ chuyển đổi

**Cách A: Mở trực tiếp**
1. Vào thư mục `d:\BC\UAT-IMR\`
2. Double-click file **`excel-to-json.html`**
3. File sẽ mở trong trình duyệt

**Cách B: Từ VS Code**
1. Right-click vào file `excel-to-json.html`
2. Chọn "Open with Default Browser"

---

### Bước 2: Convert file `data.xlsx`

1. **Kéo thả** hoặc **click để chọn** file `data.xlsx`
2. **Xem preview** dữ liệu (5 dòng đầu)
3. Kiểm tra có cột **"Trạng thái"** không
4. Click nút **"Chuyển đổi sang JSON"**
5. File `data.json` sẽ tự động tải xuống
6. **Di chuyển** file `data.json` vào thư mục `d:\BC\UAT-IMR\` (ghi đè file cũ)

---

### Bước 3: Convert file `databarcode.xlsx`

1. Click nút **"Reset"** để làm mới
2. Chọn file `databarcode.xlsx`
3. Xem preview
4. Click **"Chuyển đổi sang JSON"**
5. File `databarcode.json` sẽ tải xuống
6. **Di chuyển** file vào thư mục `d:\BC\UAT-IMR\` (ghi đè file cũ)

---

### Bước 4: Kiểm tra kết quả

Sau khi convert xong:
1. Refresh lại ứng dụng (F5)
2. Mở Console (F12)
3. Xem số lượng records:
   ```
   📊 Data records: [số thật từ Excel của bạn]
   📊 Barcode records: [số thật từ Excel của bạn]
   ```

---

## ⚠️ Yêu cầu về cấu trúc Excel

### File `data.xlsx` cần có:

| Cột bắt buộc | Mô tả |
|--------------|-------|
| **Trạng thái** hoặc **Status** | Giá trị: "Trống" hoặc "Có Hàng" |

Các cột khác tùy ý: Mã vị trí, Tên sản phẩm, Barcode, Số lượng, v.v.

### File `databarcode.xlsx`:

Tùy ý theo dữ liệu của bạn. Thường có:
- Barcode
- Mã sản phẩm
- Tên sản phẩm
- Nhà sản xuất

---

## 🎯 Sau khi convert xong

1. ✅ 2 file JSON đã có dữ liệu thật
2. ✅ Chạy app với Live Server
3. ✅ Badges sẽ hiển thị số liệu chính xác từ Excel
4. ✅ Click vào badges để xem chi tiết

---

## 🆘 Nếu gặp lỗi

**Lỗi: "Không tìm thấy cột trạng thái"**
- Mở Console xem danh sách cột có sẵn
- Đảm bảo Excel có cột tên "Trạng thái" hoặc "Status"
- Check chính tả và dấu

**Badges hiển thị "?"**
- File JSON chưa có cột trạng thái
- Cần thêm cột này vào Excel rồi convert lại

**Badges hiển thị "0" dù đã convert**
- Kiểm tra file JSON có đúng trong thư mục không
- Reload trang (Ctrl + F5)
- Kiểm tra đang chạy qua http:// chứ không phải file://
