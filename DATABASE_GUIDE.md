# Hướng dẫn sử dụng Database System

## Tổng quan

Hệ thống database cho ứng dụng Long Châu - Kho Tổng đã được tích hợp hoàn chỉnh. Dữ liệu được lưu trữ dưới dạng JSON và có thể truy vấn dễ dàng thông qua module `db.js`.

## Bước 1: Chuyển đổi Excel sang JSON

### Sử dụng công cụ chuyển đổi

1. Mở file `excel-to-json.html` trong trình duyệt
2. Kéo thả hoặc chọn file `data.xlsx`
3. Xem preview dữ liệu
4. Click "Chuyển đổi sang JSON" để tải xuống `data.json`
5. Lặp lại với file `databarcode.xlsx` để tạo `databarcode.json`
6. Đặt 2 file JSON vào thư mục `d:\BC\UAT-IMR\`

### Cấu trúc file JSON

File JSON sẽ có dạng array of objects:

```json
[
  {
    "column1": "value1",
    "column2": "value2",
    "column3": "value3"
  },
  {
    "column1": "value4",
    "column2": "value5",
    "column3": "value6"
  }
]
```

## Bước 2: Sử dụng Database API

### Load Database

Database sẽ tự động load khi ứng dụng khởi động (trong `script.js`):

```javascript
await db.load();
```

### Các hàm cơ bản

#### 1. Lấy tất cả dữ liệu
```javascript
const allData = db.getAll('data');
const allBarcodes = db.getAll('databarcode');
```

#### 2. Tìm kiếm theo field
```javascript
// Tìm sản phẩm theo tên
const results = db.find('data', 'product_name', 'Paracetamol');

// Tìm theo barcode
const product = db.findOne('databarcode', 'barcode', '8935001701293');
```

#### 3. Tìm kiếm toàn bộ
```javascript
// Tìm kiếm trong tất cả các field
const searchResults = db.search('data', 'thuốc');
```

#### 4. Tìm kiếm đa điều kiện
```javascript
const results = db.findWhere('data', {
  category: 'Medicine',
  location: 'A1-01-01'
});
```

#### 5. Sắp xếp
```javascript
const data = db.getAll('data');
const sorted = db.sort(data, 'product_name', 'asc');
```

#### 6. Thống kê
```javascript
// Đếm số lượng records
const count = db.count('data');

// Group theo field
const grouped = db.groupBy('data', 'category');

// Lấy danh sách unique values
const categories = db.getUniqueValues('data', 'category');
```

#### 7. Lấy columns
```javascript
const columns = db.getColumns('data');
// Kết quả: ['id', 'product_name', 'barcode', 'category', 'quantity', 'location']
```

### API Reference

| Hàm | Tham số | Mô tả |
|-----|---------|-------|
| `load()` | - | Load dữ liệu từ JSON files |
| `getAll(table)` | table: 'data' hoặc 'databarcode' | Lấy tất cả records |
| `find(table, field, value)` | table, field, value | Tìm theo field |
| `findOne(table, field, value)` | table, field, value | Tìm 1 record |
| `findByBarcode(barcode)` | barcode | Tìm theo barcode |
| `findWhere(table, conditions)` | table, {field: value} | Tìm đa điều kiện |
| `search(table, query)` | table, query string | Tìm kiếm toàn bộ |
| `sort(data, field, order)` | data, field, 'asc'/'desc' | Sắp xếp |
| `getUniqueValues(table, field)` | table, field | Lấy unique values |
| `count(table)` | table | Đếm số records |
| `groupBy(table, field)` | table, field | Thống kê theo field |
| `getColumns(table)` | table | Lấy danh sách columns |
| `export(table)` | table | Export ra JSON string |

## Bước 3: Tích hợp vào UI

### Ví dụ: Hiển thị danh sách sản phẩm

```javascript
// Trong script.js hoặc file khác
const products = db.getAll('data');

products.forEach(product => {
  // Tạo HTML element và hiển thị
  console.log(product.product_name, product.quantity);
});
```

### Ví dụ: Search functionality

```javascript
// Search đã được tích hợp sẵn trong script.js
// Kết quả sẽ hiển thị trong console
// Bạn có thể mở rộng để hiển thị trong UI
```

## Lưu ý

1. **Performance**: Database được cache trong memory nên truy vấn rất nhanh
2. **File size**: Nếu file JSON quá lớn (>5MB), nên cân nhắc phân trang
3. **Browser console**: Mở Developer Tools (F12) để xem log khi database load
4. **CORS**: Nếu chạy file:// protocol, một số trình duyệt có thể chặn fetch. Nên dùng local server (Live Server extension trong VS Code)

## Troubleshooting

### Database không load được

1. Kiểm tra file `data.json` và `databarcode.json` có trong thư mục chưa
2. Mở Console (F12) xem error message
3. Đảm bảo file JSON có cấu trúc đúng (array of objects)
4. Nếu dùng file:// protocol, hãy chạy local server

### Search không hoạt động

1. Đảm bảo database đã load xong (`db.isLoaded === true`)
2. Kiểm tra tên field có đúng không
3. Mở Console để xem kết quả search

## Hỗ trợ

Nếu cần thêm chức năng hoặc gặp vấn đề, vui lòng liên hệ team phát triển.
