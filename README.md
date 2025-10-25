# Cloudflare R2 File Manager

A comprehensive Node.js TypeScript application for managing files in Cloudflare R2 storage with a beautiful web interface.

## Features

✨ **Full File Management**
- 📂 Browse folders and files
- 👁️ Preview images (JPG, PNG, GIF)
- 🎵 Preview audio files (MP3, WAV, OGG, M4A)
- 📄 Preview text files (JSON, XML)
- ⬆️ Upload new files
- 🔄 Replace existing files
- 🗑️ Delete files
- 📥 Download files

✨ **Search & Navigation**
- 🔍 Real-time file search/filtering
- 📑 Smart pagination (50/100/250/500 items per page)
- 🗂️ Handles folders with 15,000+ files efficiently
- 🍞 Breadcrumb navigation

✨ **Large File Support**
- Handles files up to 50MB
- Efficient streaming for large files
- Multipart upload for better performance

✨ **Beautiful UI**
- Modern, responsive design
- Real-time file preview
- File type icons
- Mobile-friendly

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Cloudflare R2 account with credentials

## Installation

1. **Clone or navigate to the project directory**

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Configure environment variables**
   
   Edit the `.env` file and update it with your Cloudflare R2 credentials:
   
   ```env
   R2_ENDPOINT=https://cd835e291160c7050993823a4bf8f246.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=f460f93f20e39f9b8d785699a9cff70f
   R2_SECRET_ACCESS_KEY=e38fe384f6e7ef75c65295ee2ebf2bb38772abee6a007401d1c68860979182bd
   R2_BUCKET_NAME=your-bucket-name
   PORT=3000
   ```
   
   **Important:** Replace `your-bucket-name` with your actual R2 bucket name.

## Usage

### Development Mode

Run the application in development mode with auto-reload:

```powershell
npm run dev
```

### Production Mode

Build and run in production:

```powershell
npm run build
npm start
```

### Access the Application

Once started, open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### List Files
```
GET /api/files?prefix=path/to/folder
```

### Get File Metadata
```
GET /api/files/metadata?key=path/to/file.jpg
```

### Download/Preview File
```
GET /api/files/download?key=path/to/file.jpg
```

### Upload File
```
POST /api/files/upload
Content-Type: multipart/form-data
Body: file, path
```

### Replace File
```
PUT /api/files/replace
Content-Type: multipart/form-data
Body: file, key
```

### Delete File
```
DELETE /api/files?key=path/to/file.jpg
```

## Project Structure

```
MeBomba/
├── src/
│   ├── index.ts           # Main application entry
│   ├── config.ts          # Configuration management
│   ├── r2Client.ts        # R2 client wrapper
│   └── routes/
│       └── fileRoutes.ts  # API route handlers
├── public/
│   ├── index.html         # Web interface
│   └── app.js            # Frontend JavaScript
├── .env                   # Environment variables
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md            # This file
```

## Supported File Types

### Preview Support

**Images:**
- JPG/JPEG
- PNG
- GIF

**Audio:**
- MP3
- WAV
- OGG
- M4A

**Text Files:**
- JSON (with syntax formatting)
- XML
- TXT

**Other Files:**
- Download-only for unsupported types

## Performance Features

✅ **Optimized for Large Directories**
- Automatically fetches all files in folders with 15k+ items
- Client-side pagination for smooth browsing
- Search/filter across thousands of files instantly
- Configurable page sizes (50, 100, 250, 500 items)

✅ **Smart Loading**
- Lazy loading of file previews
- Efficient S3 API pagination with continuation tokens
- Minimal memory footprint

## Security Notes

⚠️ **Important Security Considerations:**

1. The `.env` file contains sensitive credentials - never commit it to version control
2. Consider adding authentication/authorization for production use
3. The current configuration allows file uploads up to 50MB
4. CORS is enabled for all origins - restrict this in production
5. Consider adding rate limiting for API endpoints

## Troubleshooting

### "Cannot find bucket" error
- Verify your R2 bucket name in `.env` is correct
- Ensure the bucket exists in your Cloudflare account

### Connection errors
- Check that your R2 endpoint URL is correct
- Verify your access key and secret key are valid
- Ensure your Cloudflare R2 API token has the correct permissions

### File upload fails
- Check file size (default limit is 50MB)
- Ensure you have write permissions on the bucket
- Check available storage quota

### Port already in use
- Change the PORT value in `.env` to a different port
- Kill any processes using port 3000: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force`

## Development

### Type Checking
```powershell
npm run type-check
```

### Building
```powershell
npm run build
```

## License

MIT

## Support

For issues related to:
- Cloudflare R2: Check [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- AWS SDK: Check [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
