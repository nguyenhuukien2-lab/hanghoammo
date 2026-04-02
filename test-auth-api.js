// Test auth API endpoints
const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function testRegister() {
    console.log('\n=== TEST REGISTER ===');
    try {
        const response = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: '12345678',
            phone: '0123456789'
        });
        console.log('✅ Register success:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Register failed:', error.response?.data || error.message);
        return null;
    }
}

async function testLogin() {
    console.log('\n=== TEST LOGIN ===');
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'huukiennguyen711@gmail.com',
            password: 'HangHoaMMO@2025#Secure!'
        });
        console.log('✅ Login success:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return null;
    }
}

async function runTests() {
    console.log('Starting API tests...');
    
    await testRegister();
    await testLogin();
    
    console.log('\n=== TESTS COMPLETED ===');
}

runTests();
