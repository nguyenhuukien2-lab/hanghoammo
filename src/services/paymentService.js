// Payment Service - VNPay, Momo & ZaloPay Integration
const crypto = require('crypto');
const querystring = require('querystring');
const moment = require('moment');
const https = require('https');

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

        // ZaloPay Config (sandbox mặc định)
        this.zalopay = {
            appId: process.env.ZALOPAY_APP_ID || '2553',
            key1: process.env.ZALOPAY_KEY1 || 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
            key2: process.env.ZALOPAY_KEY2 || 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz',
            endpoint: 'https://sb-openapi.zalopay.vn/v2/create',
            queryEndpoint: 'https://sb-openapi.zalopay.vn/v2/query',
            redirectUrl: process.env.ZALOPAY_REDIRECT_URL || `${process.env.BASE_URL || 'http://localhost:3001'}/api/payment/zalopay/callback`,
            callbackUrl: process.env.ZALOPAY_CALLBACK_URL || `${process.env.BASE_URL || 'http://localhost:3001'}/api/payment/zalopay/notify`
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
        keys.forEach(key => { sorted[key] = obj[key]; });
        return sorted;
    }

    // ─── ZaloPay ──────────────────────────────────────────────────────────────

    // Tạo đơn hàng ZaloPay
    async createZaloPayPayment(orderId, amount, description) {
        const appTransId = `${moment().format('YYMMDD')}_${orderId}_${Date.now()}`;
        const embedData = JSON.stringify({ redirecturl: this.zalopay.redirectUrl });
        const items = JSON.stringify([]);
        const transTime = Date.now();

        const data = [
            this.zalopay.appId,
            appTransId,
            'user_' + Date.now(),
            amount,
            transTime,
            embedData,
            items
        ].join('|');

        const mac = crypto.createHmac('sha256', this.zalopay.key1).update(data).digest('hex');

        const params = new URLSearchParams({
            app_id: this.zalopay.appId,
            app_trans_id: appTransId,
            app_user: 'hanghoammo_user',
            app_time: transTime,
            item: items,
            embed_data: embedData,
            amount: amount,
            description: description || `HangHoaMMO - Thanh toán đơn #${orderId}`,
            bank_code: '',
            callback_url: this.zalopay.callbackUrl,
            mac: mac
        });

        return new Promise((resolve, reject) => {
            const postData = params.toString();
            const options = {
                hostname: 'sb-openapi.zalopay.vn',
                path: '/v2/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', c => body += c);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        result.app_trans_id = appTransId; // trả về để lưu DB
                        resolve(result);
                    } catch (e) { reject(e); }
                });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    // Verify ZaloPay callback
    verifyZaloPayCallback(data) {
        const mac = crypto
            .createHmac('sha256', this.zalopay.key2)
            .update(data.data)
            .digest('hex');
        return mac === data.mac;
    }

    // Query trạng thái đơn ZaloPay
    async queryZaloPayOrder(appTransId) {
        const data = `${this.zalopay.appId}|${appTransId}|${this.zalopay.key1}`;
        const mac = crypto.createHmac('sha256', this.zalopay.key1).update(data).digest('hex');

        const params = new URLSearchParams({ app_id: this.zalopay.appId, app_trans_id: appTransId, mac });

        return new Promise((resolve, reject) => {
            const postData = params.toString();
            const options = {
                hostname: 'sb-openapi.zalopay.vn',
                path: '/v2/query',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', c => body += c);
                res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
}

module.exports = new PaymentService();
