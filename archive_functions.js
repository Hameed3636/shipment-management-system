// Search archived shipments
async function searchArchivedShipments() {
    try {
        const fileNumber = document.getElementById('archiveSearchFileNumber').value.trim().toLowerCase();
        const client = document.getElementById('archiveSearchClient').value.trim().toLowerCase();
        const responsible = document.getElementById('archiveSearchResponsible').value;
        const fromDate = document.getElementById('archiveSearchFromDate').value;
        const toDate = document.getElementById('archiveSearchToDate').value;
        
        const transaction = db.transaction(['archived'], 'readonly');
        const store = transaction.objectStore('archived');
        const request = store.getAll();
        
        request.onsuccess = () => {
            let archivedShipments = request.result || [];
            
            // Apply filters
            if (fileNumber) {
                archivedShipments = archivedShipments.filter(s => 
                    s.fileNumber && s.fileNumber.toLowerCase().includes(fileNumber)
                );
            }
            
            if (client) {
                archivedShipments = archivedShipments.filter(s => 
                    s.client && s.client.toLowerCase().includes(client)
                );
            }
            
            if (responsible) {
                archivedShipments = archivedShipments.filter(s => 
                    s.responsible === responsible
                );
            }
            
            if (fromDate) {
                archivedShipments = archivedShipments.filter(s => {
                    const archiveDate = new Date(s.archivedAt || s.archivedDate);
                    return archiveDate >= new Date(fromDate);
                });
            }
            
            if (toDate) {
                archivedShipments = archivedShipments.filter(s => {
                    const archiveDate = new Date(s.archivedAt || s.archivedDate);
                    return archiveDate <= new Date(toDate);
                });
            }
            
            displayArchivedShipments(archivedShipments);
            showAlert(`تم العثور على ${archivedShipments.length} شحنة`, 'info');
        };
        
        request.onerror = () => {
            console.error('Error searching archived shipments');
            showAlert('حدث خطأ في البحث', 'danger');
        };
    } catch (error) {
        console.error('Error in searchArchivedShipments:', error);
        showAlert('حدث خطأ في البحث', 'danger');
    }
}

// Clear archive search filters
function clearArchiveSearch() {
    document.getElementById('archiveSearchFileNumber').value = '';
    document.getElementById('archiveSearchClient').value = '';
    document.getElementById('archiveSearchResponsible').value = '';
    document.getElementById('archiveSearchFromDate').value = '';
    document.getElementById('archiveSearchToDate').value = '';
    loadArchivedShipments();
}

// Print archived report
async function printArchivedReport() {
    try {
        const transaction = db.transaction(['archived'], 'readonly');
        const store = transaction.objectStore('archived');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const archivedShipments = request.result || [];
            
            if (archivedShipments.length === 0) {
                showAlert('لا توجد شحنات مؤرشفة لطباعتها', 'warning');
                return;
            }
            
            generateArchivedPrintReport(archivedShipments);
        };
        
        request.onerror = () => {
            console.error('Error loading archived shipments for report');
            showAlert('حدث خطأ في تحميل البيانات', 'danger');
        };
    } catch (error) {
        console.error('Error in printArchivedReport:', error);
        showAlert('حدث خطأ في إنشاء التقرير', 'danger');
    }
}

// Generate archived print report
function generateArchivedPrintReport(shipments) {
    const printWindow = window.open('', '_blank');
    
    let reportHTML = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير الشحنات المؤرشفة - الجهات الأربع</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 20px;
                    direction: rtl;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #007bff;
                }
                .logo {
                    max-width: 150px;
                    height: auto;
                    margin-bottom: 10px;
                }
                .header h1 {
                    color: #333;
                    font-size: 28px;
                    margin-bottom: 5px;
                }
                .header h2 {
                    color: #666;
                    font-size: 20px;
                    margin-bottom: 10px;
                }
                .report-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .report-info p {
                    margin: 5px 0;
                    color: #555;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: right;
                }
                th {
                    background-color: #007bff;
                    color: white;
                    font-weight: bold;
                }
                tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                .shipment-details {
                    page-break-inside: avoid;
                    margin-bottom: 40px;
                    border: 2px solid #007bff;
                    border-radius: 8px;
                    padding: 20px;
                }
                .shipment-details h3 {
                    color: #007bff;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #e9ecef;
                }
                .detail-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 10px;
                }
                .detail-item {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 5px;
                }
                .detail-item strong {
                    color: #007bff;
                    display: block;
                    margin-bottom: 5px;
                }
                .stages-list {
                    background: #e7f3ff;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 10px;
                }
                .stages-list ul {
                    list-style-position: inside;
                    color: #333;
                }
                .stages-list li {
                    padding: 5px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #ddd;
                    color: #666;
                }
                @media print {
                    body {
                        padding: 10px;
                    }
                    .shipment-details {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80' viewBox='0 0 200 80'%3E%3Ctext x='100' y='40' font-family='Arial' font-size='24' fill='%23007bff' text-anchor='middle' dominant-baseline='middle'%3E الجهات الأربع%3C/text%3E%3C/svg%3E" alt="شعار الشركة" class="logo">
                <h1>الجهات الأربع</h1>
                <h2>تقرير مفصل للشحنات المؤرشفة</h2>
            </div>
            
            <div class="report-info">
                <p><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
                <p><strong>عدد الشحنات:</strong> ${shipments.length}</p>
            </div>
            
            <h3 style="margin-bottom: 15px; color: #007bff;">جدول ملخص للشحنات</h3>
            <table>
                <thead>
                    <tr>
                        <th>رقم الملف</th>
                        <th>العميل</th>
                        <th>المسؤول</th>
                        <th>نوع الشحنة</th>
                        <th>المنفذ</th>
                        <th>تاريخ الأرشفة</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    shipments.forEach(shipment => {
        const archiveDate = new Date(shipment.archivedAt || shipment.archivedDate || new Date());
        reportHTML += `
            <tr>
                <td>${shipment.fileNumber || '-'}</td>
                <td>${shipment.client || '-'}</td>
                <td>${shipment.responsible || '-'}</td>
                <td>${shipment.shipmentType || '-'}</td>
                <td>${shipment.port || '-'}</td>
                <td>${archiveDate.toLocaleDateString('ar-SA')}</td>
            </tr>
        `;
    });
    
    reportHTML += `
                </tbody>
            </table>
            
            <h3 style="margin: 30px 0 20px 0; color: #007bff;">تفاصيل الشحنات</h3>
    `;
    
    shipments.forEach((shipment, index) => {
        const archiveDate = new Date(shipment.archivedAt || shipment.archivedDate || new Date());
        reportHTML += `
            <div class="shipment-details">
                <h3>الشحنة ${index + 1} - رقم الملف: ${shipment.fileNumber || '-'}</h3>
                
                <div class="detail-row">
                    <div class="detail-item">
                        <strong>العميل:</strong>
                        ${shipment.client || '-'}
                    </div>
                    <div class="detail-item">
                        <strong>المسؤول:</strong>
                        ${shipment.responsible || '-'}
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-item">
                        <strong>نوع الشحنة:</strong>
                        ${shipment.shipmentType || '-'}
                    </div>
                    <div class="detail-item">
                        <strong>المنفذ:</strong>
                        ${shipment.port || '-'}
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-item">
                        <strong>رقم البوليصة:</strong>
                        ${shipment.policyNumber || '-'}
                    </div>
                    <div class="detail-item">
                        <strong>رقم البيان:</strong>
                        ${shipment.declarationNumber || '-'}
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-item">
                        <strong>تاريخ البيان:</strong>
                        ${shipment.declarationDate ? new Date(shipment.declarationDate).toLocaleDateString('ar-SA') : '-'}
                    </div>
                    <div class="detail-item">
                        <strong>عدد الحاويات:</strong>
                        ${shipment.containerCount || '-'}
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-item">
                        <strong>تاريخ الأرشفة:</strong>
                        ${archiveDate.toLocaleDateString('ar-SA')}
                    </div>
                    <div class="detail-item">
                        <strong>الأولوية:</strong>
                        ${shipment.priority || 'افتراضي'}
                    </div>
                </div>
        `;
        
        if (shipment.customsDetails) {
            reportHTML += `
                <div class="detail-item" style="grid-column: 1 / -1; margin-top: 10px;">
                    <strong>تفاصيل التخليص والإجراءات الجمركية:</strong>
                    <p style="margin-top: 5px; white-space: pre-wrap;">${shipment.customsDetails}</p>
                </div>
            `;
        }
        
        if (shipment.stages && shipment.stages.length > 0) {
            reportHTML += `
                <div class="stages-list">
                    <strong style="color: #007bff; display: block; margin-bottom: 10px;">المراحل:</strong>
                    <ul>
            `;
            shipment.stages.forEach(stage => {
                reportHTML += `<li>${stage}</li>`;
            });
            reportHTML += `
                    </ul>
                </div>
            `;
        }
        
        reportHTML += `
            </div>
        `;
    });
    
    reportHTML += `
            <div class="footer">
                <p>تم إنشاء هذا التقرير بواسطة نظام إدارة الشحنات - الجهات الأربع</p>
                <p style="margin-top: 5px;">${new Date().toLocaleString('ar-SA')}</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = function() {
        printWindow.print();
    };
}

// Populate archive search responsible dropdown
function populateArchiveSearchResponsible() {
    const responsibles = JSON.parse(localStorage.getItem('responsibles')) || [];
    const select = document.getElementById('archiveSearchResponsible');
    
    if (select) {
        select.innerHTML = '<option value="">الكل</option>';
        responsibles.forEach(responsible => {
            const option = document.createElement('option');
            option.value = responsible;
            option.textContent = responsible;
            select.appendChild(option);
        });
    }
}
