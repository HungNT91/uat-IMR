/**
 * Database Management System
 * Quản lý dữ liệu từ file JSON
 */

class Database {
    constructor() {
        this.data = null;
        this.databarcode = null;
        this.isLoaded = false;
        // URL for Google Apps Script Web App
        this.scriptUrl = localStorage.getItem('google_sheets_url') || null;
    }

    /**
     * Load dữ liệu từ các file JSON hoặc Google Sheets
     */
    async load() {
        try {
            if (this.scriptUrl) {
                console.log('🌐 Fetching data from Google Sheets...');
                const response = await fetch(this.scriptUrl);
                const result = await response.json();
                this.data = result.data || [];
                this.databarcode = result.databarcode || [];
                console.log('✅ Loaded from Google Sheets:', this.data.length, 'records');
            } else {
                console.log('📁 Loading data from local JSON files...');
                // Load data.json
                const dataResponse = await fetch('data.json');
                if (dataResponse.ok) {
                    this.data = await dataResponse.json();
                } else {
                    this.data = [];
                }

                // Load databarcode.json
                const barcodeResponse = await fetch('databarcode.json');
                if (barcodeResponse.ok) {
                    this.databarcode = await barcodeResponse.json();
                } else {
                    this.databarcode = [];
                }
            }

            this.isLoaded = true;
            return true;
        } catch (error) {
            console.error('❌ Error loading database:', error);
            this.data = this.data || [];
            this.databarcode = this.databarcode || [];
            this.isLoaded = false;
            return false;
        }
    }

    /**
     * Kiểm tra database đã load chưa
     */
    checkLoaded() {
        if (!this.isLoaded) {
            console.warn('⚠️ Database chưa được load. Gọi db.load() trước.');
            return false;
        }
        return true;
    }

    /**
     * Lấy tất cả dữ liệu từ bảng
     * @param {string} table - 'data' hoặc 'databarcode'
     */
    getAll(table = 'data') {
        if (!this.checkLoaded()) return [];
        return table === 'data' ? this.data : this.databarcode;
    }

    /**
     * Tìm kiếm dữ liệu
     * @param {string} table - 'data' hoặc 'databarcode'
     * @param {string} field - Tên field cần tìm
     * @param {any} value - Giá trị cần tìm
     */
    find(table, field, value) {
        if (!this.checkLoaded()) return [];
        const dataset = this.getAll(table);
        return dataset.filter(item => {
            const fieldValue = item[field];
            if (typeof fieldValue === 'string') {
                return fieldValue.toLowerCase().includes(value.toString().toLowerCase());
            }
            return fieldValue === value;
        });
    }

    /**
     * Tìm một record duy nhất
     * @param {string} table - 'data' hoặc 'databarcode'
     * @param {string} field - Tên field cần tìm
     * @param {any} value - Giá trị cần tìm
     */
    findOne(table, field, value) {
        if (!this.checkLoaded()) return null;
        const dataset = this.getAll(table);
        return dataset.find(item => item[field] === value) || null;
    }

    /**
     * Tìm kiếm theo barcode
     * @param {string} barcode - Mã barcode cần tìm
     */
    findByBarcode(barcode) {
        return this.find('databarcode', 'barcode', barcode);
    }

    /**
     * Tìm kiếm đa điều kiện
     * @param {string} table - 'data' hoặc 'databarcode'
     * @param {object} conditions - Object chứa các điều kiện {field: value}
     */
    findWhere(table, conditions) {
        if (!this.checkLoaded()) return [];
        const dataset = this.getAll(table);

        return dataset.filter(item => {
            return Object.keys(conditions).every(key => {
                const itemValue = item[key];
                const conditionValue = conditions[key];

                if (typeof itemValue === 'string' && typeof conditionValue === 'string') {
                    return itemValue.toLowerCase().includes(conditionValue.toLowerCase());
                }
                return itemValue === conditionValue;
            });
        });
    }

    /**
     * Tìm kiếm toàn bộ (tất cả các field)
     * @param {string} table - 'data' hoặc 'databarcode'
     * @param {string} query - Từ khóa tìm kiếm
     */
    search(table, query) {
        if (!this.checkLoaded()) return [];
        const dataset = this.getAll(table);
        const searchTerm = query.toLowerCase();

        return dataset.filter(item => {
            return Object.values(item).some(value => {
                if (value === null || value === undefined) return false;
                return value.toString().toLowerCase().includes(searchTerm);
            });
        });
    }

    /**
     * Sắp xếp dữ liệu
     * @param {array} data - Mảng dữ liệu cần sắp xếp
     * @param {string} field - Field để sắp xếp
     * @param {string} order - 'asc' hoặc 'desc'
     */
    sort(data, field, order = 'asc') {
        return [...data].sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];

            if (aVal === bVal) return 0;

            if (order === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    /**
     * Lấy danh sách unique values của một field
     * @param {string} table - 'data' hoặc 'databarcode'
     * @param {string} field - Tên field
     */
    getUniqueValues(table, field) {
        if (!this.checkLoaded()) return [];
        const dataset = this.getAll(table);
        const values = dataset.map(item => item[field]).filter(v => v !== null && v !== undefined);
        return [...new Set(values)];
    }

    /**
     * Đếm số lượng records
     * @param {string} table - 'data' hoặc 'databarcode'
     */
    count(table) {
        if (!this.checkLoaded()) return 0;
        return this.getAll(table).length;
    }

    /**
     * Lấy thống kê theo field
     * @param {string} table - 'data' hoặc 'databarcode'
     * @param {string} field - Tên field để thống kê
     */
    groupBy(table, field) {
        if (!this.checkLoaded()) return {};
        const dataset = this.getAll(table);

        return dataset.reduce((acc, item) => {
            const key = item[field];
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        }, {});
    }

    /**
     * Lấy columns (keys) của bảng (Scan tất cả các record để lấy bộ keys đầy đủ)
     * @param {string} table - 'data' hoặc 'databarcode'
     */
    getColumns(table) {
        if (!this.checkLoaded()) return [];
        const dataset = this.getAll(table);
        if (dataset.length === 0) return [];

        const columnSet = new Set();
        // Scan qua data để lấy tất cả các keys có thể có
        dataset.forEach(item => {
            Object.keys(item).forEach(key => columnSet.add(key));
        });

        return Array.from(columnSet);
    }

    /**
     * Export dữ liệu ra JSON string
     * @param {string} table - 'data' hoặc 'databarcode'
     */
    /**
     * Đồng bộ dữ liệu lên Google Sheets
     * @param {string} action - 'import' hoặc 'export'
     * @param {object} payload - Dữ liệu cần cập nhật (ít nhất phải có 'Vị Trí')
     */
    async syncRemote(action, payload) {
        if (!this.scriptUrl) return { success: true }; // Skip if not using remote

        try {
            console.log(`📡 Syncing ${action} to Google Sheets...`, payload);
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                mode: 'no-cors', // GAS needs no-cors for simple posts or careful header handling
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action, payload })
            });

            // Note: with 'no-cors', we can't read the response body, 
            // but the request will reach GAS. For real feedback, 
            // GAS must be set up with proper CORS headers or accessed differently.
            return { success: true };
        } catch (error) {
            console.error('❌ Sync failed:', error);
            return { success: false, error };
        }
    }
}

// Tạo instance global
const db = new Database();

// Export để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = db;
}
