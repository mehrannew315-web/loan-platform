const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

// تنظیمات دسترسی (CORS) برای اینکه فرانت‌اند بتواند به سرور متصل شود
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const JWT_SECRET = 'my_super_secret_key_123';

// ذخیره‌سازی موقت کاربران و آگهی‌ها در حافظه سرور
let users = [];
let loans = [];

// ۱. مسیر ورود یا ثبت‌نام کاربر با شماره موبایل
app.post('/api/auth/login', (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: 'شماره موبایل الزامی است' });
    }
    let user = users.find(u => u.phone === phone);
    if (!user) {
        user = { id: Date.now().toString(), phone };
        users.push(user);
    }
    const token = jwt.sign({ userId: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, message: 'ورود موفقیت‌آمیز' });
});

// ۲. مسیر دریافت لیست تمام آگهی‌های وام
app.get('/api/loans', (req, res) => {
    res.json(loans);
});

// ۳. مسیر ثبت آگهی جدید (نیازمند توکن ورود)
app.post('/api/loans', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'لطفاً ابتدا وارد حساب کاربری خود شوید' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { bankName, amount, price } = req.body;
        if (!bankName || !amount || !price) {
            return res.status(400).json({ error: 'لطفاً تمام فیلدها را پر کنید' });
        }
        const newLoan = {
            id: Date.now().toString(),
            bankName,
            amount: Number(amount),
            price: Number(price),
            user: { phone: decoded.phone }
        };
        loans.unshift(newLoan); // اضافه کردن به ابتدای لیست
        res.status(201).json({ message: 'آگهی شما با موفقیت ثبت شد', loan: newLoan });
    } catch (err) {
        res.status(403).json({ error: 'توکن نامعتبر است یا اعتبار آن به پایان رسیده' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
