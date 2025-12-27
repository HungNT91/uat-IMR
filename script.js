document.addEventListener('DOMContentLoaded', async () => {
    const splashScreen = document.getElementById('splash-screen');
    const homeScreen = document.getElementById('home-screen');

    // 🚀 NEW: Loading Animation Logic
    const loadingBar = document.getElementById('loading-bar');
    const loadingPercent = document.getElementById('loading-percent');
    const loadingText = document.getElementById('loading-text');

    let progress = 0;
    const updateProgress = (target, text, duration) => {
        return new Promise(resolve => {
            const start = progress;
            const diff = target - start;
            const step = duration / diff;

            if (loadingText && text) loadingText.textContent = text;

            let current = start;
            const timer = setInterval(() => {
                current++;
                progress = current;
                if (loadingBar) loadingBar.style.width = `${current}%`;
                if (loadingPercent) loadingPercent.textContent = `${current}%`;

                if (current >= target) {
                    clearInterval(timer);
                    resolve();
                }
            }, step);
        });
    };

    // Load sequences
    await updateProgress(30, 'Đang kết nối server...', 400);
    // Load database during splash screen
    console.log('📦 Loading database...');
    await db.load();
    loadTransactions();
    updateHomeTransactionsUI();
    await updateProgress(60, 'Đang tải dữ liệu...', 600);

    // Update server status UI
    const statusEl = document.getElementById('serverStatus');
    if (statusEl) {
        if (db.isServerActive) {
            statusEl.innerHTML = '<i class="fa-solid fa-circle" style="font-size: 8px; color: #4CAF50;"></i> <span>Chế độ: Ghi file trực tiếp</span>';
        } else {
            statusEl.innerHTML = '<i class="fa-solid fa-circle" style="font-size: 8px; color: #f36f21;"></i> <span>Chế độ: Offline (LocalStorage)</span>';
        }
    }

    await updateProgress(100, 'Sẵn sàng!', 300);

    // Transition to Home
    setTimeout(() => {
        splashScreen.classList.remove('active');
        homeScreen.classList.add('active');

        homeScreen.style.opacity = '0';
        homeScreen.style.display = 'flex';
        setTimeout(() => {
            homeScreen.style.transition = 'opacity 0.5s ease-in-out';
            homeScreen.style.opacity = '1';
        }, 50);
    }, 500);

    // Mock functionality for Bottom Nav
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Database search functionality
    const searchInput = document.querySelector('.search-bar input');

    searchInput.addEventListener('focus', () => {
        document.querySelector('.search-bar').style.boxShadow = '0 0 0 2px rgba(0, 84, 166, 0.2)';
    });

    searchInput.addEventListener('blur', () => {
        document.querySelector('.search-bar').style.boxShadow = 'none';
    });

    // Real-time search
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (query.length >= 2) {
                // Search in both tables
                const dataResults = db.search('data', query);
                const barcodeResults = db.search('databarcode', query);

                console.log('🔍 Search results for:', query);
                console.log('📊 Data table:', dataResults.length, 'results', dataResults.slice(0, 5));
                console.log('📊 Barcode table:', barcodeResults.length, 'results', barcodeResults.slice(0, 5));

                // TODO: Hiển thị kết quả trong UI
                // Bạn có thể tạo dropdown hoặc modal để hiển thị kết quả tìm kiếm
            }
        }, 300);
    });

    // Update Rack Inventory counts
    updateRackInventoryCounts();
});

function toggleAccordion(header) {
    const section = header.parentElement;
    section.classList.toggle('collapsed');
}

/**
 * Update Rack Inventory counts from data.json
 * Đọc cột "Trạng thái" hoặc "Status" hoặc các tên tương tự
 */
function updateRackInventoryCounts() {
    if (!db.isLoaded) {
        console.warn('⚠️ Database chưa load, không thể cập nhật rack counts');
        return;
    }

    const data = db.getAll('data');

    if (data.length === 0) {
        console.warn('⚠️ Không có dữ liệu trong data.json');
        document.getElementById('emptyRackCount').textContent = '0';
        document.getElementById('occupiedRackCount').textContent = '0';
        return;
    }

    // Tìm tên cột trạng thái (hỗ trợ nhiều tên khác nhau)
    const statusColumnNames = ['Trạng Thái', 'Trạng thái', 'Status', 'Trang_thai', 'trang_thai', 'status', 'TRANG_THAI', 'TrangThai'];
    const columns = db.getColumns('data');

    let statusColumn = null;
    // Tìm chính xác tên cột
    for (const colName of statusColumnNames) {
        if (columns.includes(colName)) {
            statusColumn = colName;
            break;
        }
    }

    // Nếu không tìm thấy, thử tìm gần đúng (bỏ qua dấu cách thừa)
    if (!statusColumn) {
        statusColumn = columns.find(col => {
            const trimmed = col.trim().toLowerCase();
            return trimmed === 'trạng thái' || trimmed === 'status';
        });
    }

    if (!statusColumn) {
        console.warn('⚠️ Không tìm thấy cột trạng thái trong data.json');
        console.log('📋 Các cột có sẵn:', columns);
        console.log('💡 Vui lòng đảm bảo có cột "Trạng thái" hoặc "Status" trong Excel');
        document.getElementById('emptyRackCount').textContent = '?';
        document.getElementById('occupiedRackCount').textContent = '?';
        return;
    }

    console.log('✅ Tìm thấy cột trạng thái:', statusColumn);

    // Đếm số lượng theo trạng thái và nhu cầu
    let emptyCount = 0;
    let occupiedCount = 0;
    let kho1Count = 0;
    let kho2Count = 0;
    let thungNguyenCount = 0;

    // Tìm cột nhu cầu
    const demandColumnNames = ['Nhu Cầu', 'Nhu_Cau', 'Demand', 'Nhu C u'];
    let demandColumn = null;
    for (const colName of demandColumnNames) {
        if (columns.includes(colName)) {
            demandColumn = colName;
            break;
        }
    }

    data.forEach(item => {
        const status = item[statusColumn];
        if (!status) return;

        const statusLower = status.toString().toLowerCase().trim();

        // Kiểm tra các giá trị có thể cho "Trống"
        if (statusLower.includes('trống') ||
            statusLower === 'empty' ||
            statusLower === 'available' ||
            statusLower === '0' ||
            statusLower === 'trong') {
            emptyCount++;
        }
        // Kiểm tra các giá trị có thể cho "Có Hàng"
        else if (statusLower.includes('có') ||
            statusLower.includes('hàng') ||
            statusLower === 'occupied' ||
            statusLower === 'full' ||
            statusLower === '1' ||
            statusLower.includes('co hang')) {
            occupiedCount++;

            // Kiểm tra nhu cầu nếu có hàng
            if (demandColumn) {
                const demand = (item[demandColumn] || '').toString().trim();
                if (demand === 'Kho 1') kho1Count++;
                else if (demand === 'Kho 2') kho2Count++;
                else if (demand === 'Thùng Nguyên') thungNguyenCount++;
            }
        }
    });

    // Cập nhật UI
    document.getElementById('emptyRackCount').textContent = emptyCount;
    document.getElementById('occupiedRackCount').textContent = occupiedCount;

    const kho1El = document.getElementById('kho1Count');
    const kho2El = document.getElementById('kho2Count');
    const tnEl = document.getElementById('thungNguyenCount');

    if (kho1El) kho1El.textContent = kho1Count;
    if (kho2El) kho2El.textContent = kho2Count;
    if (tnEl) tnEl.textContent = thungNguyenCount;

    console.log('📊 Rack Inventory Stats:');
    console.log('  🟡 Vị trí trống:', emptyCount);
    console.log('  🔵 Vị trí có hàng:', occupiedCount);
    console.log('  📦 Kho 1:', kho1Count, '| Kho 2:', kho2Count, '| Thùng Nguyên:', thungNguyenCount);
    console.log('  📝 Total:', data.length);
}

/**
 * Show rack details when clicking on rack items
 */
function showRackDetails(type) {
    if (!db.isLoaded) {
        alert('Database chưa được load. Vui lòng thử lại!');
        return;
    }

    const modal = document.getElementById('rackDetailsModal');
    const modalTitle = document.getElementById('rackModalTitle');
    const modalSubtitle = document.getElementById('rackModalSubtitle');
    const cardsContainer = document.getElementById('rackCardsContainer');

    // Show loading state
    modal.classList.add('show');
    modalTitle.textContent = type === 'empty' ? 'Vị Trí Trống' : 'Vị Trí Có Hàng';
    cardsContainer.innerHTML = `
        <div class="rack-loading">
            <div class="rack-loading-spinner"></div>
            <div class="rack-loading-text">Đang tải dữ liệu...</div>
        </div>
    `;

    // Get data
    const data = db.getAll('data');
    const columns = db.getColumns('data');

    // Find status column
    const statusColumnNames = ['Trạng Thái', 'Trạng thái', 'Status', 'Trang_thai', 'trang_thai', 'status'];
    let statusColumn = null;

    for (const colName of statusColumnNames) {
        if (columns.includes(colName)) {
            statusColumn = colName;
            break;
        }
    }

    if (!statusColumn) {
        statusColumn = columns.find(col => {
            const trimmed = col.trim().toLowerCase();
            return trimmed === 'trạng thái' || trimmed === 'status';
        });
    }

    if (!statusColumn) {
        cardsContainer.innerHTML = `
            <div class="rack-empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Không tìm thấy cột trạng thái trong dữ liệu!</p>
            </div>
        `;
        return;
    }

    // Filter data by type
    let filteredData = [];

    if (type === 'empty') {
        filteredData = data.filter(item => {
            const status = item[statusColumn];
            if (!status) return false;
            const statusLower = status.toString().toLowerCase().trim();
            return statusLower.includes('trống') ||
                statusLower === 'empty' ||
                statusLower === 'available' ||
                statusLower === '0' ||
                statusLower === 'trong';
        });
    } else if (type === 'occupied') {
        filteredData = data.filter(item => {
            const status = item[statusColumn];
            if (!status) return false;
            const statusLower = status.toString().toLowerCase().trim();
            return statusLower.includes('có') ||
                statusLower.includes('hàng') ||
                statusLower === 'occupied' ||
                statusLower === 'full' ||
                statusLower === '1' ||
                statusLower.includes('co hang');
        });
    }

    // Update subtitle with count
    modalSubtitle.textContent = `${filteredData.length} vị trí`;

    // 🔍 Populate Filters
    populateRackFilters(filteredData);

    // Store full dataset for filtering
    window.currentRackDetailsData = filteredData;
    window.activeRackType = type;

    console.log(`📋 Chi tiết ${type === 'empty' ? 'Vị trí trống' : 'Vị trí có hàng'}:`, filteredData);

    // Show cards or empty state
    if (filteredData.length === 0) {
        cardsContainer.innerHTML = `
            <div class="rack-empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>Không có ${type === 'empty' ? 'vị trí trống' : 'vị trí có hàng'} nào</p>
            </div>
        `;
        return;
    }

    // Generate cards
    cardsContainer.innerHTML = filteredData.map((item, index) => {
        const locationCode = item['Vị Trí'] || item['Vi_Tri'] || item['Location'] || 'N/A';

        // For empty locations, only show location code and a Nhập button
        if (type === 'empty') {
            return `
                <div class="rack-location-card ${type}">
                    <div class="rack-card-header">
                        <div class="rack-status-icon ${type}">
                            <i class="fa-solid fa-square"></i>
                        </div>
                    </div>
                    <div class="rack-card-body">
                        <div class="rack-location-display">${locationCode}</div>
                        <button class="rack-import-btn" onclick="event.stopPropagation(); importLocation('${locationCode}')">
                            <i class="fa-solid fa-file-import"></i>
                            <span>Nhập</span>
                        </button>
                    </div>
                </div>
            `;
        }

        // For occupied locations, show compact info: location, product name, pallet, and export button
        const productName = item['Tên SP'] || item['Ten_SP'] || item['Product_Name'] || '';
        const pallet = item['Pallet'] || item['PALLET'] || item['pallet'] || '';

        return `
            <div class="rack-location-card ${type} compact" onclick="showLocationDetail(${index}, 'occupied')">
                <div class="rack-card-header">
                    <div class="rack-status-icon ${type}">
                        <i class="fa-solid fa-square-check"></i>
                    </div>
                </div>
                <div class="rack-card-body">
                    <div class="rack-info-item compact">
                        <div class="rack-info-label">Vị trí</div>
                        <div class="rack-info-value">${locationCode}</div>
                    </div>
                    ${productName ? `
                        <div class="rack-info-item compact">
                            <div class="rack-info-label">Tên SP</div>
                            <div class="rack-info-value product-name">${productName}</div>
                        </div>
                    ` : ''}
                    ${pallet ? `
                        <div class="rack-info-item compact">
                            <div class="rack-info-label">Pallet</div>
                            <div class="rack-info-value">${pallet}</div>
                        </div>
                    ` : ''}
                    <button class="rack-export-btn compact" onclick="event.stopPropagation(); exportLocation('${locationCode}', '${item['Mã SP'] || item['Ma_SP'] || ''}')">
                        <i class="fa-solid fa-file-export"></i>
                        <span>Xuất</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Store filtered data for detail view
    window.currentFilteredData = filteredData; // This is what renders
    window.currentFilterType = type;
}

/**
 * Populate filter dropdowns based on available data
 */
function populateRackFilters(data) {
    const aisles = new Set();
    const columns = new Set();
    const levels = new Set();

    data.forEach(item => {
        // Try to get from specific columns first
        const aisle = item['Dãy'] || item['Day'] || item['Aisle'] || '';
        const column = item['Cột'] || item['Cot'] || item['Column'] || '';
        const level = item['Tầng'] || item['Tang'] || item['Level'] || '';

        // If not found, try to parse from "Vị Trí" if it follows a standard format like RA-01-01
        const loc = (item['Vị Trí'] || item['Vi_Tri'] || item['Location'] || '').toString();

        if (aisle) aisles.add(aisle);
        else if (loc.includes('-')) {
            const parts = loc.split('-');
            if (parts[0]) aisles.add(parts[0]);
        }

        if (column) columns.add(column);
        else if (loc.includes('-')) {
            const parts = loc.split('-');
            if (parts[1]) columns.add(parts[1]);
        }

        if (level) levels.add(level);
        else if (loc.includes('-')) {
            const parts = loc.split('-');
            if (parts[2]) levels.add(parts[2]);
        }
    });

    const updateSelect = (id, values) => {
        const select = document.getElementById(id);
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="">Tất cả</option>' +
            Array.from(values).sort().map(v => `<option value="${v}">${v}</option>`).join('');
        select.value = values.has(currentVal) ? currentVal : "";
    };

    updateSelect('filterAisle', aisles);
    updateSelect('filterColumn', columns);
    updateSelect('filterLevel', levels);
}

/**
 * Apply filters selected in the modal
 */
function applyRackFilters() {
    const aisleFilter = document.getElementById('filterAisle').value;
    const columnFilter = document.getElementById('filterColumn').value;
    const levelFilter = document.getElementById('filterLevel').value;

    const data = window.currentRackDetailsData;
    if (!data) return;

    const filtered = data.filter(item => {
        const loc = (item['Vị Trí'] || item['Vi_Tri'] || item['Location'] || '').toString();
        const parts = loc.split('-');

        const itemAisle = item['Dãy'] || item['Day'] || item['Aisle'] || (parts[0] || '');
        const itemColumn = item['Cột'] || item['Cot'] || item['Column'] || (parts[1] || '');
        const itemLevel = item['Tầng'] || item['Tang'] || item['Level'] || (parts[2] || '');

        const matchAisle = !aisleFilter || itemAisle.toString() === aisleFilter;
        const matchColumn = !columnFilter || itemColumn.toString() === columnFilter;
        const matchLevel = !levelFilter || itemLevel.toString() === levelFilter;

        return matchAisle && matchColumn && matchLevel;
    });

    renderRackCards(filtered, window.activeRackType);
    document.getElementById('rackModalSubtitle').textContent = `${filtered.length} vị trí`;
}

/**
 * Render cards helper to reuse logic
 */
function renderRackCards(filteredData, type) {
    const cardsContainer = document.getElementById('rackCardsContainer');

    if (filteredData.length === 0) {
        cardsContainer.innerHTML = `
            <div class="rack-empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>Không tìm thấy vị trí nào theo bộ lọc</p>
            </div>
        `;
        return;
    }

    cardsContainer.innerHTML = filteredData.map((item, index) => {
        const locationCode = item['Vị Trí'] || item['Vi_Tri'] || item['Location'] || 'N/A';

        if (type === 'empty') {
            return `
                <div class="rack-location-card ${type}">
                    <div class="rack-card-header">
                        <div class="rack-status-icon ${type}">
                            <i class="fa-solid fa-square"></i>
                        </div>
                    </div>
                    <div class="rack-card-body">
                        <div class="rack-location-display">${locationCode}</div>
                        <button class="rack-import-btn" onclick="event.stopPropagation(); importLocation('${locationCode}')">
                            <i class="fa-solid fa-file-import"></i>
                            <span>Nhập</span>
                        </button>
                    </div>
                </div>
            `;
        }

        const productName = item['Tên SP'] || item['Ten_SP'] || item['Product_Name'] || '';
        const pallet = item['Pallet'] || item['PALLET'] || item['pallet'] || '';

        return `
            <div class="rack-location-card ${type} compact" onclick="showLocationDetail(${index}, 'occupied')">
                <div class="rack-card-header">
                    <div class="rack-status-icon ${type}">
                        <i class="fa-solid fa-square-check"></i>
                    </div>
                </div>
                <div class="rack-card-body">
                    <div class="rack-info-item compact">
                        <div class="rack-info-label">Vị trí</div>
                        <div class="rack-info-value">${locationCode}</div>
                    </div>
                    ${productName ? `
                        <div class="rack-info-item compact">
                            <div class="rack-info-label">Tên SP</div>
                            <div class="rack-info-value product-name">${productName}</div>
                        </div>
                    ` : ''}
                    ${pallet ? `
                        <div class="rack-info-item compact">
                            <div class="rack-info-label">Pallet</div>
                            <div class="rack-info-value">${pallet}</div>
                        </div>
                    ` : ''}
                    <button class="rack-export-btn compact" onclick="event.stopPropagation(); exportLocation('${locationCode}', '${item['Mã SP'] || item['Ma_SP'] || ''}')">
                        <i class="fa-solid fa-file-export"></i>
                        <span>Xuất</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    window.currentFilteredData = filteredData;
}

/**
 * Show list of items based on demand category (Kho 1, Kho 2, Thùng Nguyên)
 */
function showDemandDetails(demandType) {
    if (!db.isLoaded) {
        alert('Database chưa được load. Vui lòng thử lại!');
        return;
    }

    const modal = document.getElementById('rackDetailsModal');
    const modalTitle = document.getElementById('rackModalTitle');
    const modalSubtitle = document.getElementById('rackModalSubtitle');
    const cardsContainer = document.getElementById('rackCardsContainer');

    modal.classList.add('show');
    modalTitle.textContent = `Nhu Cầu: ${demandType}`;
    cardsContainer.innerHTML = '<div class="rack-loading"><div class="rack-loading-spinner"></div></div>';

    const data = db.getAll('data');
    const columns = db.getColumns('data');

    // Find demand column
    const demandColumnNames = ['Nhu Cầu', 'Nhu_Cau', 'Demand', 'Nhu C u'];
    const demandColumn = demandColumnNames.find(col => columns.includes(col));

    if (!demandColumn) {
        cardsContainer.innerHTML = '<div class="rack-empty-state"><p>Không tìm thấy dữ liệu nhu cầu</p></div>';
        return;
    }

    const filteredData = data.filter(item => {
        return (item[demandColumn] || '').toString().trim() === demandType;
    });

    modalSubtitle.textContent = `${filteredData.length} vị trí`;
    window.currentFilteredData = filteredData;
    window.currentFilterType = `demand_${demandType}`;

    if (filteredData.length === 0) {
        cardsContainer.innerHTML = `
            <div class="rack-empty-state">
                <i class="fa-solid fa-list-check"></i>
                <p>Không có nhu cầu nào cho ${demandType}</p>
            </div>
        `;
        return;
    }

    // Use same card template as occupied racks
    cardsContainer.innerHTML = filteredData.map((item, index) => {
        const locationCode = item['Vị Trí'] || item['Vi_Tri'] || item['Location'] || 'N/A';
        const productName = item['Tên SP'] || item['Ten_SP'] || item['Product_Name'] || '';
        const pallet = item['Pallet'] || item['PALLET'] || item['pallet'] || '';

        return `
            <div class="rack-location-card occupied compact" onclick="showLocationDetail(${index}, 'occupied')">
                <div class="rack-card-header">
                    <div class="rack-status-icon occupied">
                        <i class="fa-solid fa-square-check"></i>
                    </div>
                </div>
                <div class="rack-card-body">
                    <div class="rack-info-item compact">
                        <div class="rack-info-label">Vị trí</div>
                        <div class="rack-info-value">${locationCode}</div>
                    </div>
                    ${productName ? `
                        <div class="rack-info-item compact">
                            <div class="rack-info-label">Tên SP</div>
                            <div class="rack-info-value product-name">${productName}</div>
                        </div>
                    ` : ''}
                    ${pallet ? `
                        <div class="rack-info-item compact">
                            <div class="rack-info-label">Pallet</div>
                            <div class="rack-info-value">${pallet}</div>
                        </div>
                    ` : ''}
                    <button class="rack-export-btn compact" onclick="event.stopPropagation(); exportLocation('${locationCode}', '${item['Mã SP'] || item['Ma_SP'] || ''}')">
                        <i class="fa-solid fa-file-export"></i>
                        <span>Xuất</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Close rack details modal
 */
function closeRackModal() {
    const modal = document.getElementById('rackDetailsModal');
    modal.classList.remove('show');
    window.currentFilterType = null;
}

/**
 * Show detailed information for a specific location in a modal
 */
function showLocationDetail(index, type) {
    if (!window.currentFilteredData || !window.currentFilteredData[index]) {
        console.error('Location data not found');
        return;
    }

    const item = window.currentFilteredData[index];
    const modal = document.getElementById('locationDetailModal');
    const title = document.getElementById('locationDetailTitle');
    const subtitle = document.getElementById('locationDetailSubtitle');
    const content = document.getElementById('locationDetailContent');

    // Get all data fields
    const locationCode = item['Vị Trí'] || item['Vi_Tri'] || item['Location'] || 'N/A';
    const productCode = item['Mã SP'] || item['Ma_SP'] || item['Product_Code'] || '';
    const productName = item['Tên SP'] || item['Ten_SP'] || item['Product_Name'] || '';
    const lot = item['Lot'] || item['LOT'] || item['lot'] || '';
    const date = item['Date'] || item['DATE'] || item['date'] || item['Ngày'] || item['Ngay'] || '';
    const quantity = item['Số Lượng'] || item['So_Luong'] || item['Quantity'] || '';
    const unit = item['Đơn Vị Tính'] || item['Don_Vi_Tinh'] || item['Unit'] || '';
    const spec = item['Quy Cách'] || item['Quy_Cach'] || item['Spec'] || item['Specification'] || '';
    const pallet = item['Pallet'] || item['PALLET'] || item['pallet'] || '';

    // Set title
    title.textContent = 'Chi Tiết Vị Trí';
    subtitle.textContent = locationCode;

    // Generate detail content
    content.innerHTML = `
        <div class="location-detail-card">
            <div class="detail-section">
                <h3 class="detail-section-title"><i class="fa-solid fa-location-dot"></i> Thông Tin Vị Trí</h3>
                <div class="detail-info-grid">
                    <div class="detail-info-item">
                        <div class="detail-info-label">Vị trí</div>
                        <div class="detail-info-value">${locationCode}</div>
                    </div>
                    ${pallet ? `
                        <div class="detail-info-item">
                            <div class="detail-info-label">Pallet</div>
                            <div class="detail-info-value">${pallet}</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title"><i class="fa-solid fa-box"></i> Thông Tin Sản Phẩm</h3>
                <div class="detail-info-grid">
                    ${productCode ? `
                        <div class="detail-info-item">
                            <div class="detail-info-label">Mã SP</div>
                            <div class="detail-info-value">${productCode}</div>
                        </div>
                    ` : ''}
                    ${productName ? `
                        <div class="detail-info-item full-width">
                            <div class="detail-info-label">Tên SP</div>
                            <div class="detail-info-value">${productName}</div>
                        </div>
                    ` : ''}
                    ${lot ? `
                        <div class="detail-info-item">
                            <div class="detail-info-label">Lot</div>
                            <div class="detail-info-value">${lot}</div>
                        </div>
                    ` : ''}
                    ${date ? `
                        <div class="detail-info-item">
                            <div class="detail-info-label">Date</div>
                            <div class="detail-info-value">${date}</div>
                        </div>
                    ` : ''}
                    ${quantity ? `
                        <div class="detail-info-item">
                            <div class="detail-info-label">Số Lượng</div>
                            <div class="detail-info-value highlight">${quantity} ${unit}</div>
                        </div>
                    ` : ''}
                    ${spec ? `
                        <div class="detail-info-item">
                            <div class="detail-info-label">Quy Cách</div>
                            <div class="detail-info-value">${spec}</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <button class="rack-export-btn detail" onclick="closeLocationDetailModal(); exportLocation('${locationCode}', '${productCode}')">
                <i class="fa-solid fa-file-export"></i>
                <span>Xuất Hàng</span>
            </button>
        </div>
    `;

    // Show modal
    modal.classList.add('show');
}

/**
 * Close location detail modal
 */
function closeLocationDetailModal() {
    const modal = document.getElementById('locationDetailModal');
    modal.classList.remove('show');
}

/**
 * View detailed information for a specific location (legacy - kept for compatibility)
 */
function viewLocationDetail(locationCode) {
    console.log('📍 Viewing details for location:', locationCode);
}

/**
 * Export product from a specific location (show confirmation with QR)
 */
function exportLocation(locationCode, productCode) {
    console.log('📤 Preparing export for location:', locationCode);

    const item = db.getAll('data').find(d =>
        (d['Vị Trí'] || d['Vi_Tri'] || d['Location']) === locationCode
    );

    if (!item) {
        alert('Không tìm thấy dữ liệu cho vị trí này!');
        return;
    }

    const modal = document.getElementById('exportConfirmModal');
    const locText = document.getElementById('exportConfirmLocation');
    locText.textContent = locationCode;

    const summaryContent = document.getElementById('exportConfirmDetails');
    const pallet = item['Pallet'] || item['PALLET'] || '';
    const productName = item['Tên SP'] || item['Ten_SP'] || '';
    const qty = item['Số Lượng'] || item['So_Luong'] || '';
    const unit = item['Đơn Vị Tính'] || item['Don_Vi_Tinh'] || '';

    summaryContent.innerHTML = `
        <div class="summary-row"><strong>Sản phẩm:</strong> ${productName}</div>
        <div class="summary-row"><strong>Mã SP:</strong> ${productCode}</div>
        <div class="summary-row"><strong>Pallet:</strong> ${pallet || 'N/A'}</div>
        <div class="summary-row"><strong>Số lượng:</strong> ${qty} ${unit}</div>
    `;

    // Clear previous QR codes
    document.getElementById('qrLocation').innerHTML = '';
    document.getElementById('qrPallet').innerHTML = '';

    // Generate QRs
    new QRCode(document.getElementById('qrLocation'), {
        text: locationCode,
        width: 128,
        height: 128
    });

    if (pallet) {
        new QRCode(document.getElementById('qrPallet'), {
            text: pallet,
            width: 128,
            height: 128
        });
    } else {
        document.getElementById('qrPallet').innerHTML = '<div style="color:#ccc; font-size:10px">Không có Pallet</div>';
    }

    // Assign action to button
    const confirmBtn = document.getElementById('finalConfirmExportBtn');
    confirmBtn.onclick = () => confirmExport(locationCode);

    modal.classList.add('show');
}

/**
 * Confirm the export, update database and log transaction
 */
async function confirmExport(locationCode) {
    console.log('✅ Confirming export for:', locationCode);

    const allData = db.getAll('data');
    const itemIndex = allData.findIndex(d =>
        (d['Vị Trí'] || d['Vi_Tri'] || d['Location']) === locationCode
    );

    if (itemIndex === -1) {
        alert('Lỗi: Không tìm thấy vị trí để cập nhật!');
        return;
    }

    const item = allData[itemIndex];

    // Create transaction log
    const transaction = {
        type: 'export',
        timestamp: new Date().toISOString(),
        location: locationCode,
        productCode: item['Mã SP'] || item['Ma_SP'] || '',
        productName: item['Tên SP'] || item['Ten_SP'] || '',
        quantity: item['Số Lượng'] || item['So_Luong'] || '',
        pallet: item['Pallet'] || item['PALLET'] || ''
    };

    if (!window.warehouseTransactions) window.warehouseTransactions = [];
    window.warehouseTransactions.unshift(transaction);
    saveTransactions();

    // 💾 LOCAL UPDATE
    const updates = {
        'status': 'Trống',
        'productCode': '',
        'productName': '',
        'quantity': '',
        'pallet': '',
        'lot': '',
        'date': '',
        'unit': '',
        'spec': ''
        // Note: 'demand' (Nhu cầu) is preserved as it belongs to the location zone
    };

    console.log('💾 Saving export change to localStorage (Preserving Demand/Zone)...');
    db.update('data', 'location', locationCode, updates);

    closeExportConfirmModal();

    // Close the rack details list modal if it's open, OR refresh it
    // For now, let's just refresh counts and cards
    updateRackInventoryCounts();
    updateHomeTransactionsUI();

    // Refresh the list modal if it was open
    if (window.currentFilterType) {
        if (window.currentFilterType.startsWith('demand_')) {
            showDemandDetails(window.currentFilterType.replace('demand_', ''));
        } else {
            showRackDetails(window.currentFilterType);
        }
    }

    alert('Xuất hàng thành công! Vị trí hiện đã trống.');
}

function closeExportConfirmModal() {
    const modal = document.getElementById('exportConfirmModal');
    modal.classList.remove('show');
}

/**
 * Step 1: Open the Import Form Modal
 */
function importLocation(locationCode) {
    console.log('📥 Opening import form for:', locationCode);

    // Set location title and hidden field
    document.getElementById('importFormLocation').textContent = locationCode;
    document.getElementById('impLocation').value = locationCode;

    // Reset form fields
    resetImportForm(false); // false means don't clear location

    const modal = document.getElementById('importFormModal');
    modal.classList.add('show');
}

/**
 * Handle data lookup via fields
 */
function lookupByBarcode(val) {
    if (!val || val.length < 5) return;
    performLookup('Barcode', val);
}

function lookupByProductCode(val) {
    if (!val || val.length < 4) return;
    performLookup('Mã Sản Phẩm', val);
}

function lookupByProductName(val) {
    if (!val || val.length < 4) return;
    performLookup('Tên Sản Phẩm', val);
}

function performLookup(field, value) {
    const allBarcodes = db.getAll('databarcode');
    if (!allBarcodes || allBarcodes.length === 0) return;

    // Flexible key finding
    const findKey = (target) => {
        const keys = Object.keys(allBarcodes[0]);
        return keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(target.toLowerCase().replace(/[^a-z0-9]/g, '')));
    };

    const targetKey = findKey(field);
    if (!targetKey) return;

    const match = allBarcodes.find(item => {
        const itemVal = (item[targetKey] || '').toString().toLowerCase();
        return itemVal.includes(value.toLowerCase());
    });

    if (match) {
        console.log('✨ Match found in databarcode:', match);

        // Auto-fill fields
        const codeKey = findKey('Mã Sản Phẩm') || findKey('Ma_SP');
        const nameKey = findKey('Tên Sản Phẩm') || findKey('Ten_SP');
        const specKey = findKey('Quy Cách');
        const rackKey = findKey('Chuẩn Rack');
        const barcodeKey = findKey('Barcode');
        const unitKey = findKey('Đơn vị tính') || findKey('ĐVT');

        if (codeKey) document.getElementById('impProductCode').value = match[codeKey] || '';
        if (nameKey) document.getElementById('impProductName').value = match[nameKey] || '';
        if (specKey) document.getElementById('impSpec').value = match[specKey] || '';
        if (rackKey) document.getElementById('impRackStd').value = match[rackKey] || '';
        if (barcodeKey && field !== 'Barcode') document.getElementById('impBarcode').value = match[barcodeKey] || '';
        if (unitKey) document.getElementById('impUnit').value = match[unitKey] || '';

        calculateQuantity();
    }
}

function calculateQuantity() {
    const spec = parseFloat(document.getElementById('impSpec').value) || 0;
    const rack = parseFloat(document.getElementById('impRackStd').value) || 0;
    if (spec && rack) {
        document.getElementById('impQuantity').value = spec * rack;
    }
}

/**
 * Reset form
 */
function resetImportForm(clearLocation = true) {
    const fields = ['impPallet', 'impBarcode', 'impProductCode', 'impProductName', 'impLot', 'impDate', 'impSpec', 'impRackStd', 'impQuantity', 'impUnit'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    if (clearLocation) document.getElementById('impLocation').value = '';
}

/**
 * Submit Import
 */
async function submitImport() {
    const location = document.getElementById('impLocation').value;
    const pallet = document.getElementById('impPallet').value;
    const productCode = document.getElementById('impProductCode').value;
    const productName = document.getElementById('impProductName').value;
    const lot = document.getElementById('impLot').value;
    const date = document.getElementById('impDate').value;
    const qty = document.getElementById('impQuantity').value;
    const unit = document.getElementById('impUnit').value;
    const spec = document.getElementById('impSpec').value;
    const rackStd = document.getElementById('impRackStd').value;

    if (!productCode || !qty) {
        alert('Vui lòng nhập đầy đủ Mã Sản Phẩm và Số Lượng!');
        return;
    }

    const allData = db.getAll('data');
    const itemIndex = allData.findIndex(d =>
        (d['Vị Trí'] || d['Vi_Tri'] || d['Location']) === location
    );

    if (itemIndex === -1) {
        alert('Lỗi: Không tìm thấy vị trí để cập nhật!');
        return;
    }

    const item = allData[itemIndex];

    const payload = {
        'Vị Trí': location,
        'Mã SP': productCode,
        'Tên SP': productName,
        'Pallet': pallet,
        'Số Lượng': qty,
        'Lot': lot,
        'Ngày': date,
        'Đơn Vị Tính': unit,
        'Quy Cách': spec,
        'Quy đổi thùng': rackStd
    };

    // 💾 LOCAL UPDATE
    const headers = db.getColumns('data');
    const statusKey = headers.find(h => h.toLowerCase().includes('trạng thái') || h.toLowerCase() === 'status') || 'Trạng Thái';

    const finalPayload = { ...payload };
    finalPayload[statusKey] = 'Có Hàng';

    const updates = { ...payload, 'status': 'Có Hàng' };
    console.log('💾 Saving import change to localStorage:', updates);
    db.update('data', 'location', location, updates);

    // Add to transactions
    const transaction = {
        type: 'import',
        timestamp: new Date().toISOString(),
        location: location,
        productCode: productCode,
        productName: productName,
        quantity: qty,
        pallet: pallet
    };
    if (!window.warehouseTransactions) window.warehouseTransactions = [];
    window.warehouseTransactions.unshift(transaction);
    saveTransactions();

    // Refresh UI
    updateRackInventoryCounts();
    updateHomeTransactionsUI();

    if (window.currentFilterType) showRackDetails(window.currentFilterType);

    // Show Confirmation
    showImportConfirmation(transaction);
    closeImportFormModal();
}

/**
 * Step 2: Confirmation Modal
 */
function showImportConfirmation(t) {
    const modal = document.getElementById('importConfirmModal');
    document.getElementById('importConfirmLocation').textContent = t.location;

    const summaryContent = document.getElementById('importConfirmDetails');
    summaryContent.innerHTML = `
        <div class="summary-row"><strong>Sản phẩm:</strong> ${t.productName}</div>
        <div class="summary-row"><strong>Mã SP:</strong> ${t.productCode}</div>
        <div class="summary-row"><strong>Pallet:</strong> ${t.pallet || 'N/A'}</div>
        <div class="summary-row"><strong>Số lượng:</strong> ${t.quantity}</div>
    `;

    // Clear and Generate QRs
    document.getElementById('impQrLocation').innerHTML = '';
    document.getElementById('impQrPallet').innerHTML = '';

    new QRCode(document.getElementById('impQrLocation'), {
        text: t.location,
        width: 128,
        height: 128
    });

    if (t.pallet) {
        new QRCode(document.getElementById('impQrPallet'), {
            text: t.pallet,
            width: 128,
            height: 128
        });
    } else {
        document.getElementById('impQrPallet').innerHTML = '<div style="color:#ccc; font-size:10px">Không có Pallet</div>';
    }

    modal.classList.add('show');
}

/**
 * Close controls
 */
function closeImportFormModal() {
    document.getElementById('importFormModal').classList.remove('show');
}

function closeImportConfirmModal() {
    document.getElementById('importConfirmModal').classList.remove('show');
}

/**
 * Show transaction history in a modal
 */
function showTransactions(type) {
    const modal = document.getElementById('transactionsModal');
    const title = document.getElementById('transactionsModalTitle');
    const container = document.getElementById('transactionsContainer');

    title.textContent = type === 'export' ? 'Lịch Sử Xuất Hàng' : 'Lịch Sử Nhập Hàng';

    const transactions = (window.warehouseTransactions || []).filter(t => t.type === type);

    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="rack-empty-state">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <p>Chưa có giao dịch ${type === 'export' ? 'xuất' : 'nhập'} nào trong hôm nay.</p>
            </div>
        `;
    } else {
        // Sort by timestamp descending
        const sorted = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        container.innerHTML = sorted.map(t => {
            const date = new Date(t.timestamp);
            const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="transaction-card ${t.type}">
                    <div class="transaction-header">
                        <div class="transaction-location">${t.location}</div>
                        <div class="transaction-time">${timeStr}</div>
                    </div>
                    <div class="transaction-product-name">${t.productName}</div>
                    <div class="transaction-details">
                        <div class="transaction-detail-item">
                            <div class="transaction-detail-label">Mã SP</div>
                            <div class="transaction-detail-value">${t.productCode}</div>
                        </div>
                        <div class="transaction-detail-item">
                            <div class="transaction-detail-label">Pallet</div>
                            <div class="transaction-detail-value">${t.pallet || 'N/A'}</div>
                        </div>
                        <div class="transaction-detail-item">
                            <div class="transaction-detail-label">Số lượng</div>
                            <div class="transaction-detail-value quantity">${t.quantity}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    modal.classList.add('show');
}

/**
 * Close transactions modal
 */
function closeTransactionsModal() {
    const modal = document.getElementById('transactionsModal');
    modal.classList.remove('show');
}
/**
 * Settings Management
 */
function openSettings() {
    document.getElementById('googleSheetsUrl').value = db.scriptUrl || '';
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('show');
}

function backupData() {
    console.log('📦 Exporting data for backup...');
    const data = {
        data: db.data,
        databarcode: db.databarcode,
        exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WMS_Backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Đã tải xuống file backup dữ liệu thành công!');
}

function clearLocalData() {
    if (confirm('Anh có chắc muốn xóa hết thay đổi và quay về dữ liệu gốc từ file JSON không?')) {
        localStorage.removeItem('wms_data');
        localStorage.removeItem('wms_databarcode');
        alert('Đã reset dữ liệu! Hệ thống sẽ tải lại.');
        location.reload();
    }
}
function saveTransactions() {
    localStorage.setItem('wms_transactions', JSON.stringify(window.warehouseTransactions || []));
}

function loadTransactions() {
    const saved = localStorage.getItem('wms_transactions');
    if (saved) {
        window.warehouseTransactions = JSON.parse(saved);
    } else {
        window.warehouseTransactions = [];
    }
}

/**
 * Update the badges and recent list on the home screen
 */
function updateHomeTransactionsUI() {
    const transactions = window.warehouseTransactions || [];

    // Update Badges
    const importCount = transactions.filter(t => t.type === 'import').length;
    const exportCount = transactions.filter(t => t.type === 'export').length;

    const impBadge = document.getElementById('importTransCount');
    const expBadge = document.getElementById('exportTransCount');

    if (impBadge) impBadge.textContent = importCount;
    if (expBadge) expBadge.textContent = exportCount;

    // Update Recent List (Last 5)
    const container = document.getElementById('homeRecentTransactions');
    if (!container) return;

    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="rack-empty-state" style="padding: 10px; font-size: 13px;">
                <p>Chưa có giao dịch nào hôm nay.</p>
            </div>
        `;
        return;
    }

    const recent = transactions.slice(0, 5);
    container.innerHTML = recent.map(t => {
        const date = new Date(t.timestamp);
        const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const icon = t.type === 'import' ? 'fa-file-import' : 'fa-file-export';
        const colorClass = t.type === 'import' ? 'blue' : 'orange';

        return `
            <div class="home-transaction-item" onclick="showTransactions('${t.type}')">
                <div class="item-icon ${colorClass}">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="item-info">
                    <div class="item-main">
                        <span class="item-loc">${t.location}</span>
                        <span class="item-time">${timeStr}</span>
                    </div>
                    <div class="item-sub">${t.productName || 'Hàng hóa không tên'}</div>
                </div>
                <i class="fa-solid fa-chevron-right item-arrow"></i>
            </div>
        `;
    }).join('');
}
