# 🇻🇳 Vietnam Tax Calculator 2025

**Công cụ tính thuế Thu nhập Cá nhân Việt Nam - So sánh luật thuế cũ và mới**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Site-2ea44f?style=for-the-badge)](https://vietvudanh.github.io/vietnam-tax-2025/)
[![GitHub](https://img.shields.io/github/stars/vietvudanh/vietnam-tax-2025?style=for-the-badge&logo=github)](https://github.com/vietvudanh/vietnam-tax-2025)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

## 📖 About | Giới thiệu

A comprehensive **Vietnam Personal Income Tax (PIT) Calculator** that compares tax calculations between the current tax law and the new tax law effective **July 1, 2025**.

Công cụ tính **Thuế Thu nhập Cá nhân (TNCN) Việt Nam** toàn diện, so sánh thuế giữa luật thuế hiện hành và luật thuế mới có hiệu lực từ **01/07/2025**.

---

## ✨ Features | Tính năng

| Feature | Tính năng |
|---------|-----------|
| 💰 **Income Input** | Nhập lương, số người phụ thuộc và vùng lương tối thiểu |
| 🔄 **Auto Calculation** | Tự động tính bảo hiểm xã hội, bảo hiểm y tế, thuế TNCN |
| 📊 **Side-by-Side Comparison** | So sánh song song thu nhập thực lĩnh giữa luật cũ và mới |
| 📈 **Progressive Tax Brackets** | Hiển thị bảng thuế lũy tiến chi tiết |
| 👨‍👩‍👧‍👦 **Dependent Deductions** | Tính giảm trừ gia cảnh cho người phụ thuộc |
| 🏢 **Employer/Employee Breakdown** | Phân tích các khoản đóng bảo hiểm cho cả người lao động và doanh nghiệp |

---

## 📸 Screenshot

<div align="center">
  <img src="assets/screenshot.png" alt="Vietnam Tax Calculator 2025 Screenshot" width="800" />
</div>

---

## 🚀 Quick Start | Bắt đầu nhanh

### Prerequisites | Yêu cầu

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation | Cài đặt

```bash
# Clone the repository
git clone https://github.com/vietvudanh/vietnam-tax-2025.git
cd vietnam-tax-2025

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **TypeScript 5.8** | Type Safety |
| **Vite 6** | Build Tool & Dev Server |
| **Recharts** | Charts & Data Visualization |
| **Lucide React** | Icons |
| **Tailwind CSS** | Styling |

---

## 📁 Project Structure

```
vietnam-tax-2025/
├── 📄 App.tsx              # Main application component
├── 📂 components/          # React components
│   ├── BracketTable.tsx    # Tax bracket display
│   ├── ComparisonChart.tsx # Old vs New comparison chart
│   ├── DeductionDetailTable.tsx # Deduction breakdown
│   └── InputForm.tsx       # Salary input form
├── 📂 utils/               # Utility functions
├── 📄 types.ts             # TypeScript type definitions
├── 📂 assets/              # Images and static assets
└── 📂 public/              # Public static files
```

---

## 📚 Tax Law Reference | Tham khảo Luật Thuế

The calculator implements:
- **Current Law**: Personal Income Tax Law (Luật Thuế TNCN hiện hành)
- **New Law**: Revised PIT provisions effective July 1, 2025

Key changes in the new law include updated tax brackets and deduction amounts.

---

## 🤝 Contributing | Đóng góp

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 Blog Post

📖 **Read about how this was built**: [Mình đã tạo page này thế nào?](https://vietvudanh.substack.com/p/minh-a-tao-trang-tinh-thue-tncn-2026)

---

## 👤 Author

<div align="center">
  
  **Viet Vu Danh**
  
  [![GitHub](https://img.shields.io/badge/GitHub-vietvudanh-181717?style=for-the-badge&logo=github)](https://github.com/vietvudanh)
  [![Substack](https://img.shields.io/badge/Substack-vietvudanh-FF6719?style=for-the-badge&logo=substack&logoColor=white)](https://vietvudanh.substack.com/)

</div>

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  
  ⭐ **Star this repo if you find it useful!** ⭐
  
  Made with ❤️ in Vietnam 🇻🇳
  
</div>
