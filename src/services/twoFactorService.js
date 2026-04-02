const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate 2FA secret
const generateSecret = (userEmail) => {
    const secret = speakeasy.generateSecret({
        name: `HangHoaMMO (${userEmail})`,
        issuer: 'HangHoaMMO'
    });
    
    return {
        secret: secret.base32,
        otpauth_url: secret.otpauth_url
    };
};

// Generate QR code
const generateQRCode = async (otpauth_url) => {
    try {
        const qrCodeDataURL = await QRCode.toDataURL(otpauth_url);
        return qrCodeDataURL;
    } catch (error) {
        throw new Error('Failed to generate QR code');
    }
};

// Verify TOTP token
const verifyToken = (secret, token) => {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps before/after
    });
};

module.exports = {
    generateSecret,
    generateQRCode,
    verifyToken
};
