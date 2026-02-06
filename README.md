# Label Genius 🏷️

A full-stack web application that transforms spreadsheet data into professional, print-ready barcode labels in seconds. Built for inventory management, warehousing, and any business that needs to generate barcode labels at scale.

## 🌟 Overview

Label Genius automates the tedious process of creating barcode labels from inventory data. Upload a CSV or Excel file containing your product information, and the system generates professionally formatted Code 128 barcode labels arranged on standard label sheets, ready for printing.

### Key Features

- **⚡ Lightning Fast Processing** - Generate thousands of labels in seconds with multi-threaded barcode generation
- **📊 Flexible Input** - Supports CSV, Excel (.xlsx, .xls) files up to 50MB
- **🎨 Professional Output** - Code 128 barcodes formatted for 4x5 label sheets (20 labels per sheet)
- **☁️ Cloud Storage** - Generated labels stored securely in Supabase with persistent access
- **🔄 Resumable Uploads** - TUS protocol implementation for reliable large file uploads with automatic retry
- **📦 ZIP Download** - All label sheets packaged and ready for batch printing
- **🔐 Secure Authentication** - Session-based auth with Supabase integration
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **⏱️ Real-time Progress** - Visual feedback during processing and uploads

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)

```
src/
├── components/
│   ├── LandingPage.tsx      # Marketing landing page with features
│   ├── login.tsx             # User authentication
│   ├── signup.tsx            # New user registration
│   ├── dashboard.tsx         # Main app interface
│   ├── labelUploader.tsx     # File upload & sheet management
│   ├── ProtectedRoute.tsx    # Route authentication guard
│   └── header.tsx            # Navigation component
└── config/
    └── config.ts             # Supabase client configuration
```

**Tech Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Axios for HTTP requests
- React Router for navigation

### Backend (Flask + Python)

```
backend/
├── auth/
│   ├── auth.py              # Login/logout endpoints
│   └── decorators.py        # Session auth middleware
├── routes/
│   ├── uploads.py           # File upload handling
│   ├── sheets.py            # Sheet download/management
│   └── api.py               # Database operations
├── services/
│   ├── label_service.py     # Core label processing logic
│   ├── sheet_service.py     # Sheet retrieval & ZIP creation
│   └── storage_service.py   # Supabase storage integration
├── utils/
│   ├── BarcodeGenerator.py  # Barcode image generation
│   ├── LabelSheetGenerator.py # Sheet layout & composition
│   ├── file_utils.py        # File validation utilities
│   └── security.py          # Security & rate limiting
└── models/
    ├── database.py          # Supabase client setup
    └── settings.py          # Configuration management
```

**Tech Stack:**
- Flask 3.0
- Supabase (PostgreSQL + Storage)
- PIL/Pillow for image processing
- python-barcode for Code 128 generation
- pandas for data parsing
- tuspy (TUS client) for resumable uploads
- concurrent.futures for parallel processing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Supabase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/label-genius.git
cd label-genius
```

2. **Backend Setup**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
FLASK_SECRET_KEY=your_secure_secret_key
FLASK_ENV=development
EOF

# Create required folders
mkdir -p uploads images sheets

# Run the Flask server
python app.py
```

3. **Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000" > .env

# Run development server
npm run dev
```

4. **Database Setup**

Create the following tables in your Supabase project:

```sql
-- Users table (handled by Supabase Auth)

-- User sheets metadata
CREATE TABLE user_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  label_count INTEGER NOT NULL,
  sheet_count INTEGER NOT NULL,
  total_size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual sheet files
CREATE TABLE sheet_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_sheet_id UUID NOT NULL REFERENCES user_sheets(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  sheet_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_sheets_user_id ON user_sheets(user_id);
CREATE INDEX idx_sheet_files_user_sheet_id ON sheet_files(user_sheet_id);
```

Create a storage bucket in Supabase:
- Bucket name: `label-sheets`
- Public: No (private)

5. **Access the application**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 📖 Usage

### Basic Workflow

1. **Sign Up / Login**
   - Create an account or log in with existing credentials
   - Session-based authentication keeps you logged in

2. **Prepare Your Data**
   
   Your CSV/Excel file should have this format:
   ```csv
   Location,Part Number,Description,Unit
   A-01-01,SKU12345,Widget Assembly,EA
   A-01-02,SKU12346,Gadget Component,PCS
   B-02-01,SKU12347,Tool Kit,SET
   ```
   
   - **Column 1 (Location)**: Warehouse location or identifier
   - **Column 2 (Part Number)**: Product SKU (becomes barcode)
   - **Column 3 (Description)**: Product description (optional)
   - **Column 4 (Unit)**: Unit of measure (displayed on label)

3. **Upload & Generate**
   - Drag and drop or browse to select your file
   - Click "Generate Label Sheets"
   - Watch real-time progress as labels are created
   - Processing time: ~2-5 seconds per 100 labels

4. **Download & Print**
   - Download the ZIP file containing all label sheets
   - Extract and print on 4x5 label paper
   - Each sheet contains 20 labels (4 columns × 5 rows)

### Advanced Features

- **Session Management**: Previously generated sheets are saved and accessible from your dashboard
- **Download Tracking**: Visual indicators show which sheets you've already downloaded
- **Bulk Delete**: Remove old label sheets when no longer needed
- **Progress Indicators**: Real-time feedback during file processing

## ⚙️ Configuration

### Environment Variables

**Backend (.env)**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_KEY=eyJhb...

# Flask Configuration
FLASK_SECRET_KEY=your-256-bit-secret-key
FLASK_ENV=development  # or 'production'

# Optional: Redis for rate limiting
REDIS_URL=redis://localhost:6379
```

**Frontend (.env)**
```bash
VITE_API_URL=http://localhost:5000  # Backend URL
```

### Label Specifications

Default label dimensions (configurable in `label_service.py`):
- Label size: 2.5" × 2.0" (width × height)
- Sheet layout: 4 columns × 5 rows
- DPI: 600 (high quality)
- Barcode type: Code 128
- Output format: PNG images

To customize, modify these constants in `BarcodeGenerator.py` and `LabelSheetGenerator.py`:
```python
# BarcodeGenerator.py
width_inches = 2.5
height_inches = 2.0
dpi = 600

# LabelSheetGenerator.py
label_width = 220
label_height = 180
x_gap = 35
y_gap = 85
rows = 5
columns = 4
```

## 🔒 Security Features

- **File Validation**: Magic byte checking, MIME type validation, extension verification
- **Rate Limiting**: 5 uploads per hour, 15 per day per user
- **Session Security**: HTTP-only cookies, CSRF protection, secure session tokens
- **Input Sanitization**: SQL injection prevention, XSS protection
- **File Size Limits**: 50MB max (25MB in production)
- **Authentication**: Protected routes, token-based session management

## 🚀 Performance Optimizations

### Backend
- **Multi-threaded Processing**: Concurrent barcode generation (6 workers by default)
- **Thread-safe Operations**: File locking for shared resources
- **Parallel Uploads**: Concurrent Supabase storage uploads
- **Optimized ZIP Creation**: Single ZIP file instead of individual files
- **Async Cleanup**: Background image deletion

### TUS Resumable Uploads 🔄
One of the standout features is the implementation of the **TUS protocol** for resumable uploads to Supabase storage. This provides several critical advantages:

**Why TUS?**
- **Fault Tolerance**: Uploads automatically resume from where they left off if interrupted
- **Network Resilience**: Handles unstable connections gracefully without data loss
- **Large File Support**: Reliable handling of multi-megabyte ZIP files
- **Chunked Transfer**: 6MB chunks for optimal upload performance
- **No Re-uploads**: Users never have to restart failed uploads from scratch

**Implementation Details:**
```python
# storage_service.py
def upload_zip_to_storage(user_id, user_sheet_id, zip_buffer, original_filename):
    tus_client = create_tus_client()
    
    # TUS uploader with chunking
    uploader = tus_client.uploader(
        file_stream=zip_buffer, 
        chunk_size=6*1024*1024,  # 6MB chunks
        metadata={
            'bucketName': 'label-sheets',
            'objectName': storage_path,
            'contentType': 'application/zip'
        }
    )
    uploader.upload()  # Automatically resumes on failure
```

This is particularly valuable for:
- Users with slower internet connections
- Large label sheet batches (1000+ labels)
- Mobile users with intermittent connectivity
- Production environments where reliability is critical

### Frontend
- **Lazy Loading**: Code splitting with React.lazy()
- **State Persistence**: LocalStorage for download tracking
- **Optimistic UI**: Immediate feedback before backend confirmation
- **Efficient Re-renders**: React.memo and useCallback optimizations

### Benchmarks
- 100 labels: ~3-5 seconds
- 500 labels: ~10-15 seconds
- 1,000 labels: ~20-30 seconds
- 5,000 labels: ~2-3 minutes

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests
cd frontend
npm run test
```

## 📦 Deployment

### Backend (Railway / Heroku / DigitalOcean)

1. Set environment variables in your hosting platform
2. Configure production CORS origins in `settings.py`
3. Update `SESSION_COOKIE_SECURE = True` for HTTPS
4. Use production Supabase credentials
5. Deploy with Dockerfile or buildpack

**Example Railway deployment:**
```bash
railway login
railway init
railway up
```

### Frontend (Vercel / Netlify)

1. Build the production bundle:
```bash
npm run build
```

2. Set environment variable:
```
VITE_API_URL=https://your-backend-url.com
```

3. Deploy:
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

## 🛠️ Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| HTTP Client | Axios |
| Backend Framework | Flask 3.0 |
| Database | PostgreSQL (Supabase) |
| Storage | Supabase Storage |
| Upload Protocol | TUS (tuspy client) |
| Image Processing | Pillow 10.0 |
| Barcode Generation | python-barcode 0.15 |
| Data Processing | pandas 2.0 |
| Authentication | Supabase Auth + Sessions |

## 📊 Database Schema

```
┌─────────────────┐
│   auth.users    │ (Supabase managed)
└────────┬────────┘
         │
         │ user_id (FK)
         ▼
┌─────────────────┐
│  user_sheets    │
├─────────────────┤
│ id (PK)         │
│ user_id         │
│ original_filename│
│ label_count     │
│ sheet_count     │
│ total_size_bytes│
│ created_at      │
└────────┬────────┘
         │
         │ user_sheet_id (FK)
         ▼
┌─────────────────┐
│  sheet_files    │
├─────────────────┤
│ id (PK)         │
│ user_sheet_id   │
│ filename        │
│ storage_path    │
│ file_size_bytes │
│ sheet_number    │
│ created_at      │
└─────────────────┘
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [python-barcode](https://github.com/WhyNotHugo/python-barcode) for Code 128 generation
- [tuspy](https://github.com/tus/tus-py-client) for TUS resumable upload protocol
- [Supabase](https://supabase.com/) for backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- [Vite](https://vitejs.dev/) for blazing fast development

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact via your preferred method

---

**Made with ❤️ for businesses that need efficient label generation**