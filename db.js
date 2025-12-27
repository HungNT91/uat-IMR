/**
 * Database Management System
 * Quản lý dữ liệu từ file JSON, LocalStorage và Local Server Sync
 */

class Database {
    constructor() {
        this.data = null;
        this.databarcode = null;
        this.isLoaded = false;
        this.serverUrl = 'http://localhost:3000'; // Mặc định chạy local server Node.js
        this.isServerActive = false;
    }

    /**
     * Load dữ liệu
     */
    async load() {
        try {
            // 1. Kiểm tra xem Local Server có đang chạy không
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000);
                const ping = await fetch(this.serverUrl + '/api/save', {
                    method: 'OPTIONS',
                    signal: controller.signal
                });
                if (ping.ok || ping.status === 204) {
                    this.isServerActive = true;
                    console.log('🚀 Local Server detected - Direct File Write enabled!');
                }
            } catch (e) {
                console.log('ℹ️ Local Server not found, using LocalStorage fallback.');
                this.isServerActive = false;
            }

            // 2. Thử tải từ LocalStorage trước (Dữ liệu cache)
            const localData = localStorage.getItem('wms_data');
            const localBarcode = localStorage.getItem('wms_databarcode');

            if (localData && localBarcode) {
                console.log('💾 Loading from LocalStorage Cache...');
                this.data = JSON.parse(localData);
                this.databarcode = JSON.parse(localBarcode);
            } else {
                console.log('📁 Initializing from JSON files...');
                const dataResponse = await fetch('data.json');
                this.data = dataResponse.ok ? await dataResponse.json() : [];

                const barcodeResponse = await fetch('databarcode.json');
                this.databarcode = barcodeResponse.ok ? await barcodeResponse.json() : [];

                this.save();
            }

            this.isLoaded = true;
            return true;
        } catch (error) {
            console.error('❌ Error loading database:', error);
            this.isLoaded = false;
            return false;
        }
    }

    /**
     * Lưu trạng thái
     */
    async save() {
        if (!this.data || !this.databarcode) return;

        // Lưu vào LocalStorage của Browser (Dự phòng)
        localStorage.setItem('wms_data', JSON.stringify(this.data));
        localStorage.setItem('wms_databarcode', JSON.stringify(this.databarcode));

        // Ghi trực tiếp vào file JSON nếu Server đang chạy
        if (this.isServerActive) {
            try {
                const res = await fetch(this.serverUrl + '/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: this.data,
                        databarcode: this.databarcode
                    })
                });
                const result = await res.json();
                if (result.success) {
                    console.log('💾 SYNCHRONIZED: Successfully written to local data.json');
                }
            } catch (err) {
                console.error('❌ Server sync failed:', err);
            }
        }
    }

    /**
     * Tìm key thực tế dựa trên tên gợi nhớ (fuzzy match)
     */
    getStandardKey(table, semanticName) {
        const columns = this.getColumns(table);
        const search = semanticName.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (columns.includes(semanticName)) return semanticName;

        const normalized = columns.find(c =>
            c.toLowerCase().replace(/[^a-z0-9]/g, '') === search
        );
        if (normalized) return normalized;

        const mappings = {
            'location': ['vị trí', 'vi tri', 'location', 'vitri', 'v_tri'],
            'status': ['trạng thái', 'trang thai', 'status', 'trangthai', 'trang_thai'],
            'productcode': ['mã sp', 'ma sp', 'product code', 'masp', 'ma_sp', 'product_code'],
            'productname': ['tên sp', 'ten sp', 'product name', 'tensp', 'ten_sp', 'product_name'],
            'pallet': ['pallet', 'palet', 'pallet_no'],
            'quantity': ['số lượng', 'so luong', 'qty', 'quantity', 'soluong', 'so_luong'],
            'unit': ['đơn vị tính', 'dvt', 'unit', 'donvitinh', 'don_vi_tinh'],
            'spec': ['quy cách', 'spec', 'quycach', 'quy_cach'],
            'lot': ['lot', 'so lot', 'lotno', 'batch'],
            'date': ['ngày', 'hạn dùng', 'date', 'expiry', 'ngay']
        };

        for (const [key, aliases] of Object.entries(mappings)) {
            if (search.includes(key) || aliases.some(a => search === a.replace(/[^a-z0-9]/g, ''))) {
                const found = columns.find(c => {
                    const cNorm = c.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return aliases.some(a => cNorm === a.replace(/[^a-z0-9]/g, ''));
                });
                if (found) return found;
            }
        }
        return semanticName;
    }

    /**
     * Cập nhật và Lưu
     */
    update(table, querySemanticField, queryValue, updates) {
        if (!this.checkLoaded()) return false;
        const dataset = table === 'data' ? this.data : this.databarcode;

        const actualQueryField = this.getStandardKey(table, querySemanticField);
        const index = dataset.findIndex(item => item[actualQueryField] == queryValue);

        if (index !== -1) {
            const mappedUpdates = {};
            for (const [key, val] of Object.entries(updates)) {
                const actualKey = this.getStandardKey(table, key);
                mappedUpdates[actualKey] = val;
            }

            dataset[index] = { ...dataset[index], ...mappedUpdates };
            this.save(); // Gọi save để sync file
            return true;
        }
        return false;
    }

    checkLoaded() {
        if (!this.isLoaded) return false;
        return true;
    }

    getAll(table = 'data') {
        if (!this.checkLoaded()) return [];
        return table === 'data' ? this.data : this.databarcode;
    }

    count(table = 'data') {
        return this.getAll(table).length;
    }

    getColumns(table) {
        if (!this.checkLoaded()) return [];
        const dataset = this.getAll(table);
        if (dataset.length === 0) return [];
        const columnSet = new Set();
        dataset.forEach(item => Object.keys(item).forEach(key => columnSet.add(key)));
        return Array.from(columnSet);
    }

    find(table, semanticField, value) {
        const dataset = this.getAll(table);
        const actualField = this.getStandardKey(table, semanticField);
        return dataset.filter(item => {
            const val = item[actualField];
            if (typeof val === 'string') return val.toLowerCase().includes(value.toString().toLowerCase());
            return val == value;
        });
    }

    search(table, query) {
        const dataset = this.getAll(table);
        const q = query.toLowerCase();
        return dataset.filter(item => Object.values(item).some(v => v && v.toString().toLowerCase().includes(q)));
    }
}

const db = new Database();
if (typeof module !== 'undefined' && module.exports) module.exports = db;
