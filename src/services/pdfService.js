// PDF Invoice Service
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
    generateInvoice(order, user, items) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const fileName = `invoice-${order.id}-${Date.now()}.pdf`;
                const filePath = path.join(__dirname, '../../invoices', fileName);
                
                // Ensure invoices directory exists
                const invoicesDir = path.join(__dirname, '../../invoices');
                if (!fs.existsSync(invoicesDir)) {
                    fs.mkdirSync(invoicesDir, { recursive: true });
                }
                
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);
                
                // Header
                doc.fontSize(20)
                   .text('HÓA ĐƠN BÁN HÀNG', { align: 'center' })
                   .moveDown();
                
                // Company info
                doc.fontSize(10)
                   .text('HangHoaMMO', { align: 'left' })
                   .text('Chợ MMO uy tín #1 Việt Nam')
                   .text('Hotline: 0879.06.2222')
                   .text('Email: support@hanghoammo.com')
                   .moveDown();
                
                // Invoice info
                doc.fontSize(12)
                   .text(`Mã đơn hàng: ${order.id}`, { align: 'right' })
                   .text(`Ngày: ${new Date(order.created_at).toLocaleDateString('vi-VN')}`, { align: 'right' })
                   .moveDown();
                
                // Customer info
                doc.fontSize(12)
                   .text('THÔNG TIN KHÁCH HÀNG', { underline: true })
                   .fontSize(10)
                   .text(`Họ tên: ${user.name || user.email}`)
                   .text(`Email: ${user.email}`)
                   .text(`Số điện thoại: ${user.phone || 'N/A'}`)
                   .moveDown();
                
                // Table header
                const tableTop = doc.y;
                doc.fontSize(10)
                   .text('STT', 50, tableTop, { width: 30 })
                   .text('Sản phẩm', 90, tableTop, { width: 200 })
                   .text('Số lượng', 300, tableTop, { width: 60, align: 'center' })
                   .text('Đơn giá', 370, tableTop, { width: 80, align: 'right' })
                   .text('Thành tiền', 460, tableTop, { width: 80, align: 'right' });
                
                // Draw line
                doc.moveTo(50, tableTop + 20)
                   .lineTo(550, tableTop + 20)
                   .stroke();
                
                // Table items
                let yPosition = tableTop + 30;
                items.forEach((item, index) => {
                    const itemTotal = item.price * item.quantity;
                    
                    doc.text(index + 1, 50, yPosition, { width: 30 })
                       .text(item.product_name || item.name, 90, yPosition, { width: 200 })
                       .text(item.quantity, 300, yPosition, { width: 60, align: 'center' })
                       .text(item.price.toLocaleString('vi-VN') + 'đ', 370, yPosition, { width: 80, align: 'right' })
                       .text(itemTotal.toLocaleString('vi-VN') + 'đ', 460, yPosition, { width: 80, align: 'right' });
                    
                    yPosition += 25;
                });
                
                // Draw line
                doc.moveTo(50, yPosition)
                   .lineTo(550, yPosition)
                   .stroke();
                
                yPosition += 10;
                
                // Total
                doc.fontSize(12)
                   .text('TỔNG CỘNG:', 370, yPosition, { width: 80, align: 'right' })
                   .text(order.total_amount.toLocaleString('vi-VN') + 'đ', 460, yPosition, { width: 80, align: 'right' });
                
                yPosition += 30;
                
                // Payment info
                doc.fontSize(10)
                   .text(`Phương thức thanh toán: ${this.getPaymentMethodText(order.payment_method)}`, 50, yPosition)
                   .text(`Trạng thái: ${this.getStatusText(order.status)}`, 50, yPosition + 15);
                
                if (order.transaction_id) {
                    doc.text(`Mã giao dịch: ${order.transaction_id}`, 50, yPosition + 30);
                }
                
                // Footer
                doc.fontSize(8)
                   .text('Cảm ơn quý khách đã mua hàng tại HangHoaMMO!', 50, 700, { align: 'center' })
                   .text('Mọi thắc mắc vui lòng liên hệ: 0879.06.2222', { align: 'center' });
                
                doc.end();
                
                stream.on('finish', () => {
                    resolve({ filePath, fileName });
                });
                
                stream.on('error', reject);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    getPaymentMethodText(method) {
        const methods = {
            'wallet': 'Ví tiền',
            'vnpay': 'VNPay',
            'momo': 'Momo',
            'bank_transfer': 'Chuyển khoản ngân hàng'
        };
        return methods[method] || method;
    }
    
    getStatusText(status) {
        const statuses = {
            'pending': 'Chờ xử lý',
            'paid': 'Đã thanh toán',
            'processing': 'Đang xử lý',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy'
        };
        return statuses[status] || status;
    }
}

module.exports = new PDFService();
