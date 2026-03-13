// Database helper functions
const { supabase } = require('./supabase');

const db = {
    // Users
    async createUser(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async getUserByEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async getUserById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Wallet
    async getWallet(userId) {
        const { data, error } = await supabase
            .from('wallet')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error) throw error;
        return data;
    },

    async updateWalletBalance(userId, newBalance) {
        const { data, error } = await supabase
            .from('wallet')
            .update({ balance: newBalance, updated_at: new Date() })
            .eq('user_id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Products
    async getAllProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async getProductById(id) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    async createProduct(productData) {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async updateProduct(id, productData) {
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async deleteProduct(id) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },

    // Orders
    async createOrder(orderData) {
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async getOrdersByUserId(userId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async getAllOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // Accounts (tài khoản bán)
    async getAvailableAccount(productId) {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('product_id', productId)
            .eq('status', 'available')
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async markAccountAsSold(accountId, userId, orderId) {
        const { data, error } = await supabase
            .from('accounts')
            .update({
                status: 'sold',
                sold_at: new Date(),
                sold_to: userId
            })
            .eq('id', accountId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async createAccount(accountData) {
        const { data, error } = await supabase
            .from('accounts')
            .insert([accountData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Transactions
    async createTransaction(transactionData) {
        const { data, error } = await supabase
            .from('transactions')
            .insert([transactionData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async getTransactionsByUserId(userId) {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // Deposit Requests
    async createDepositRequest(depositData) {
        const { data, error } = await supabase
            .from('deposit_requests')
            .insert([depositData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async getDepositRequestsByUserId(userId) {
        const { data, error } = await supabase
            .from('deposit_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async getAllDepositRequests() {
        const { data, error } = await supabase
            .from('deposit_requests')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async updateDepositRequest(id, updateData) {
        const { data, error } = await supabase
            .from('deposit_requests')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

// Export supabase client for direct queries
db.supabase = supabase;

module.exports = db;
