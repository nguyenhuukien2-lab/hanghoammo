// Payment Service - VNPay & Momo Integration
const crypto = require('crypto');
const querystring = require('querystring');
const moment = require('moment');

class PaymentService {
    constructor() {
        // VNPay Config
        this.vnpay = {
            tmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE',
            hashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET',
            url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payment/vnpay/callback'
        };
        
        // Momo Config
        this.momo = {
            partnerCode: process.env.MOMO_PARTNER_CODE || 'YOUR_PARTNER_CODE',
            accessKey: process.env.MOMO_ACCESS_KEY || 'YOUR_ACCESS_KEY',
            secretKey: process.env.MOMO_SECRET_KEY || 'YOUR_SECRET_KEY',
            endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
            returnUrl: process.env.MOMO_RETURN_URL || 'http://localhost:3000/api/payment/momo/callback',
            notifyUrl: process.env.MOMO_NOTIFY_URL || 'http://localhost:3000/api/payment/momo/notify'
        };
    }
    
    // VNPay - Create payment URL
    createVNPayPayment(orderId, amount, orderInfo, ipAddr) {
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const orderId_vnpay = moment(date).format('DDHHmmss');
        
        let vnp_Params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': this.vnpay.tmnCode,
            'vnp_Locale': 'vn',
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': orderId,
            'vnp_OrderInfo': orderInfo,
            'vnp_OrderType': 'other',
            'vnp_Amount': amount * 100, // VNPay requires amount in smallest unit
            'vnp_ReturnUrl': this.vnpay.returnUrl,
            'vnp_IpAddr': ipAddr,
            'vnp_CreateDate': createDate
        };
        
        vnp_Params = this.sortObject(vnp_Params);
        
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', this.vnpay.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnp_Params['vnp_SecureHash'] = signed;
        
        const paymentUrl = this.vnpay.url + '?' + querystring.stringify(vnp_Params, { encode: false });
        
        return paymentUrl;
    }
    
    // VNPay - Verify callback
    verifyVNPayCallback(vnp_Params) {
        const secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];
        
        vnp_Params = this.sortObject(vnp_Params);
        
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', this.vnpay.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        return secureHash === signed;
    }
    
    // Momo - Create payment
    async createMomoPayment(orderId, amount, orderInfo) {
        const requestId = orderId + '-' + Date.now();
        const requestType = 'captureWallet';
        const extraData = '';
        
        const rawSignature = `accessKey=${this.momo.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.momo.notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.momo.partnerCode}&redirectUrl=${this.momo.returnUrl}&requestId=${requestId}&requestType=${requestType}`;
        
        const signature = crypto
            .createHmac('sha256', this.momo.secretKey)
            .update(rawSignature)
            .digest('hex');
        
        const requestBody = {
            partnerCode: this.momo.partnerCode,
            accessKey: this.momo.accessKey,
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: this.momo.returnUrl,
            ipnUrl: this.momo.notifyUrl,
            extraData: extraData,
            requestType: requestType,
            signature: signature,
            lang: 'vi'
        };
        
        try {
            const response = await fetch(this.momo.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Momo payment error:', error);
            throw error;
        }
    }
    
    // Momo - Verify callback
    verifyMomoCallback(data) {
        const rawSignature = `accessKey=${this.momo.accessKey}&amount=${data.amount}&extraData=${data.extraData}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;
        
        const signature = crypto
            .createHmac('sha256', this.momo.secretKey)
            .update(rawSignature)
            .digest('hex');
        
        return signature === data.signature;
    }
    
    // Helper - Sort object by key
    sortObject(obj) {
        const sorted = {};
        const keys = Object.keys(obj).sort();
        keys.forEach(key => {
            sorted[key] = obj[key];
        });
        return sorted;
    }
}

module.exports = new PaymentService();
