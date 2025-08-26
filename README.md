# EdgeVideo AI - React Application

Modern React application for EdgeVideo AI platform featuring live streaming, user authentication, and interactive video experiences.

## 🚀 **Features**

### **Core Platform**

- ✅ React 18 with Vite for fast development
- ✅ Responsive design with mobile optimization
- ✅ Dark/light theme support
- ✅ SEO optimization with dynamic meta tags
- ✅ Progressive Web App capabilities

### **Video Streaming**

- ✅ HLS.js integration for live streams
- ✅ Multi-channel support with quality switching
- ✅ Dedicated stream pages (e.g., `/euronews-travel`)
- ✅ Video error handling and recovery
- ✅ Optimized loading states

### **User Experience**

- ✅ Google OAuth authentication
- ✅ Points system with daily check-ins
- ✅ Wallet integration (WalletConnect, Rainbow)
- ✅ Live shopping features
- ✅ Social sharing and analytics

## 🛠 **Development**

### **Quick Start**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### **Available Scripts**

- `npm run dev` - Development server with hot reload
- `npm run build` - Production build (optimized)
- `npm run build:staging` - Staging build (with source maps)
- `npm run preview` - Preview built application
- `npm run lint` - ESLint code checking

## 📦 **Build Modes**

- **Development**: Hot reload, source maps, debugging tools
- **Staging**: Unminified with source maps for testing
- **Production**: Minified, optimized, no source maps

## 🌐 **Deployment**

### **Automated GitHub Actions**

- **Staging**: Auto-deploy on push to `main` branch
- **Production**: Deploy via `production` branch
- **Preview**: Automatic PR preview deployments

### **Manual Deployment**

```bash
# Staging
npm run build:staging && firebase hosting:channel:deploy staging

# Production
npm run build && firebase deploy --only hosting
```

## 📁 **Project Structure**

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components and routes
├── contexts/      # React context providers
├── hooks/         # Custom React hooks
├── services/      # API and external services
├── styles/        # CSS stylesheets
├── utils/         # Utility functions
└── assets/        # Static assets
```

## 🔧 **Technical Stack**

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router
- **Styling**: CSS Modules
- **Video**: HLS.js
- **Authentication**: Google OAuth + JWT
- **Deployment**: Firebase Hosting

## 🌍 **Live URLs**

- **Staging**: https://staging--edgevideo-ai-8753a.web.app
- **Production**: edgevideo.ai (when DNS switched from Webflow)

## 📝 **Key Pages**

- `/` - Landing page
- `/app` - Main application
- `/demo` - Video streaming demo
- `/euronews-travel` - Dedicated HLS stream
- `/channels`, `/brands`, `/viewers` - Information pages
- `/privacy`, `/terms` - Legal pages
