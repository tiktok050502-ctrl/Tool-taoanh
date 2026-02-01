# Tool Tạo Ảnh AFL - AI Fashion Try-On

## 🌐 Live Demo
- **GitHub Pages**: https://tiktok050502-ctrl.github.io/Tool-taoanh/
- **Netlify**: (Sẽ có sau khi deploy)

## 🚀 Deployment

### Deploy lên GitHub Pages
```bash
npm run deploy
```

### Deploy lên Netlify

#### Option 1: Sử dụng Netlify CLI
```bash
# Cài đặt Netlify CLI
npm install -g netlify-cli

# Build project
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

#### Option 2: Kết nối GitHub với Netlify
1. Truy cập https://app.netlify.com/
2. Click "New site from Git"
3. Chọn repository: tiktok050502-ctrl/Tool-taoanh
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

## 💻 Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🔑 API Key Setup
Create a `.env.local` file:
```
GEMINI_API_KEY=your_api_key_here
```

## 📁 Project Structure
```
tool-afl/
├── components/        # React components
├── services/         # API services
├── App.tsx           # Main app component
├── index.tsx         # Entry point
├── types.ts          # TypeScript types
└── vite.config.ts    # Vite configuration
```

## 🛠️ Technologies
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Google Generative AI
- Lucide React Icons
