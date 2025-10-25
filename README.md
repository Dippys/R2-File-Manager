# Cloudflare R2 File Manager

A high-performance Node.js TypeScript application for managing files in Cloudflare R2 storage with an intelligent caching system and beautiful web interface.

## 🌟 Features

### 📁 **Full File Management**
- 📂 Browse folders and files with breadcrumb navigation
- 👁️ Preview images (JPG, PNG, GIF)
- 🎵 Preview audio files (MP3, WAV, OGG, M4A) with built-in player
- 📄 Preview text files (JSON, XML) with syntax highlighting
- ⬆️ Upload new files with drag-and-drop support
- 🔄 Replace existing files
- 🗑️ Delete files
- 📥 Download files

### 🚀 **High-Performance Caching**
- ⚡ **Intelligent Cache System**: In-memory cache with 24-hour TTL
- 💾 **Persistent Cache**: Cache survives crashes/restarts via JSON storage
- 🔄 **Recursive Preload**: Automatically loads all directories on startup
- 📊 **Real-time Stats**: Monitor cache size, RAM, and CPU usage
- 🔁 **Force Refresh**: Manually refresh cache when needed
- 🎯 **Instant Navigation**: Browse 40,000+ files without delays

### 🔍 **Search & Navigation**
- � Real-time file search/filtering across entire bucket
- 📑 Smart pagination (50/100/250/500 items per page)
- 🗂️ Handles folders with 40,000+ files efficiently
- 🍞 Intuitive breadcrumb navigation
- ⚡ Client-side filtering for instant results

### 💪 **Large File Support**
- Handles files up to 50MB
- Efficient streaming for large files
- Multipart upload for better performance
- Progress indication for uploads

### 🎨 **Beautiful UI**
- Modern, responsive design
- Real-time file preview modal
- File type icons with color coding
- System statistics dashboard
- Mobile-friendly interface

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Cloudflare R2 account with credentials
- At least 100MB RAM for caching large directories

## 🚀 Quick Start

### 1. Installation

Clone the repository and install dependencies:

```powershell
git clone https://github.com/Dippys/R2-File-Manager
cd R2-File-Manager
npm install
```

### 2. Configuration

Create a `.env` file in the root directory with your Cloudflare R2 credentials:

```env
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your-bucket-name
PORT=3000
```

> 💡 **Tip**: You can find your R2 credentials in the Cloudflare Dashboard under R2 > Manage R2 API Tokens

### 3. Run the Application

**Development Mode** (with hot-reload):
```powershell
npm run dev
```

**Production Mode**:
```powershell
npm run build
npm start
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 🎯 Usage Guide

### File Operations

- **Browse**: Click on folders to navigate
- **Upload**: Click "Upload File" button or drag and drop
- **Preview**: Click on any supported file to preview
- **Delete**: Click the trash icon next to any file
- **Replace**: Upload a file with the same name (prompts for confirmation)
- **Download**: Click the download icon

### Search & Filter

- Use the search bar to filter files by name
- Search works across all visible files in the current folder
- Results update in real-time as you type

### Pagination

- Choose page size: 50, 100, 250, or 500 items
- Navigate with Previous/Next buttons
- Current page indicator shows your position

### Cache Management

- **Stats Bar**: View real-time cache statistics (folders cached, total items, RAM usage, CPU usage)
- **Auto-refresh**: Cache automatically refreshes after file operations
- **Manual Refresh**: Force refresh available via API endpoint
- **Persistent**: Cache survives application restarts via JSON storage

## 🏗️ Architecture

### Caching System

The application uses an intelligent multi-layer caching system:

1. **In-Memory Cache**: Fast access to frequently used directory listings
2. **Persistent Cache**: JSON file storage at `./cache/r2-cache.json`
3. **Automatic Preload**: Recursively loads all directories on startup
4. **TTL Management**: 24-hour cache expiration with automatic validation
5. **Crash Recovery**: Cache persists across restarts and crashes

### Performance Optimizations

- **Batched Loading**: Loads directories in batches of 5 to avoid API overwhelm
- **Continuation Tokens**: Efficient pagination for large directories
- **Client-Side Filtering**: Instant search results without API calls
- **Lazy Loading**: Preview content loaded only when needed

## 📡 API Endpoints

### File Operations

#### List Files
```http
GET /api/files?prefix=path/to/folder
```
Returns list of files and folders at the specified prefix.

#### Get File Metadata
```http
GET /api/files/metadata?key=path/to/file.jpg
```
Returns metadata for a specific file (size, content type, last modified).

#### Download/Preview File
```http
GET /api/files/download?key=path/to/file.jpg
```
Downloads or previews the specified file.

#### Upload File
```http
POST /api/files/upload
Content-Type: multipart/form-data

Body:
  - file: File to upload
  - path: Destination path in bucket
```

#### Replace File
```http
PUT /api/files/replace
Content-Type: multipart/form-data

Body:
  - file: Replacement file
  - key: Path of file to replace
```

#### Delete File
```http
DELETE /api/files?key=path/to/file.jpg
```

### Cache Operations

#### Get Cache Statistics
```http
GET /api/stats
```
Returns cache statistics, RAM usage, and CPU usage.

#### Clear Cache
```http
POST /api/cache/clear
Content-Type: application/json

Body (optional):
  { "prefix": "path/to/folder" }
```
Clears cache for specific prefix or entire cache if no prefix provided.

## 📂 Project Structure

```
R2-File-Manager/
├── src/
│   ├── index.ts              # Application entry point
│   ├── config.ts             # Environment configuration
│   ├── r2Client.ts           # R2 client with caching logic
│   └── routes/
│       └── fileRoutes.ts     # API route handlers
├── public/
│   ├── index.html            # Web interface
│   └── app.js                # Frontend JavaScript
├── cache/
│   └── r2-cache.json         # Persistent cache (auto-generated)
├── dist/                     # Compiled JavaScript (build output)
├── .env                      # Environment variables (not in git)
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── LICENSE                  # MIT License
└── README.md                # This file
```

## 🎨 Supported File Types

### Preview Support

**Images:**
- JPG/JPEG
- PNG
- GIF
- WebP

**Audio:**
- MP3
- WAV
- OGG
- M4A
- FLAC

**Text Files:**
- JSON (with syntax formatting)
- XML
- TXT
- CSV
- Markdown

**Other Files:**
- Download-only for unsupported types

## ⚡ Performance Features

### Optimized for Large Directories
- ✅ Handles 40,000+ files per directory
- ✅ Recursive preload of entire bucket on startup
- ✅ 24-hour cache TTL with persistent storage
- ✅ Client-side pagination for smooth browsing
- ✅ Instant search/filter across cached files
- ✅ Configurable page sizes (50, 100, 250, 500 items)

### Smart Caching
- ✅ In-memory cache for instant access
- ✅ JSON file persistence for crash recovery
- ✅ Automatic cache invalidation after 24 hours
- ✅ Selective cache clearing by folder
- ✅ Batched API requests to avoid rate limits

### Resource Monitoring
- ✅ Real-time RAM usage tracking
- ✅ CPU usage monitoring
- ✅ Cache statistics dashboard
- ✅ File count and folder metrics

## 🔒 Security Notes

⚠️ **Important Security Considerations:**

1. **Credentials**: The `.env` file contains sensitive credentials - never commit it to version control
2. **Authentication**: Consider adding authentication/authorization for production use
3. **File Size Limits**: Current configuration allows file uploads up to 50MB
4. **CORS**: CORS is enabled for all origins - restrict this in production
5. **Rate Limiting**: Consider adding rate limiting for API endpoints
6. **Input Validation**: All file uploads are validated for size and type
7. **Cache Security**: Cache files are excluded from git via `.gitignore`

## 🐛 Troubleshooting

### Common Issues

#### "Cannot find bucket" error
- Verify your R2 bucket name in `.env` is correct
- Ensure the bucket exists in your Cloudflare account
- Check bucket permissions for your API token

#### Connection errors
- Check that your R2 endpoint URL is correct
- Verify your access key and secret key are valid
- Ensure your Cloudflare R2 API token has the correct permissions
- Check your internet connection and firewall settings

#### File upload fails
- Check file size (default limit is 50MB)
- Ensure you have write permissions on the bucket
- Check available storage quota in Cloudflare dashboard
- Verify the file path is valid

#### Port already in use
- Change the PORT value in `.env` to a different port
- Kill any processes using port 3000:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
  ```

#### Cache issues
- Delete `./cache/r2-cache.json` to force a fresh preload
- Check available RAM if caching large directories
- Ensure write permissions for the `./cache` directory
- Monitor cache stats in the web interface

#### Slow initial load
- First startup preloads all directories (may take minutes for large buckets)
- Subsequent startups load from cache file (instant)
- Check network latency to Cloudflare R2
- Consider reducing the number of files/folders if possible

## 🛠️ Development

### Available Scripts

```powershell
# Development mode with hot-reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Run production build
npm start

# Clean build directory
npm run clean
```

### Tech Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Storage**: Cloudflare R2 (S3-compatible)
- **SDK**: AWS SDK v3 for JavaScript
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Caching**: In-memory + JSON file persistence

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🙏 Acknowledgments

- Built with Cloudflare R2 storage
- Powered by AWS SDK v3
- Uses Express.js for the server
- Styled with modern CSS3

## 📧 Support

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Open an issue on GitHub
3. Check Cloudflare R2 status page for service issues

---

Made with ❤️ for efficient R2 file management
