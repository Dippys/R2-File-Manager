# 🚀 Quick Start Guide

## Step 1: Configure Your Bucket Name

**Important:** Before running the application, you MUST update the `.env` file with your actual R2 bucket name.

Open `.env` and change:
```env
R2_BUCKET_NAME=your-bucket-name
```

To your actual bucket name, for example:
```env
R2_BUCKET_NAME=my-files
```

## Step 2: Start the Application

Run in development mode:
```powershell
npm run dev
```

Or build and run in production:
```powershell
npm run build
npm start
```

## Step 3: Open in Browser

Navigate to:
```
http://localhost:3000
```

## 🎉 You're Ready!

You should now see the R2 File Manager interface where you can:
- Browse your files and folders
- Preview images (JPG, PNG, GIF)
- Preview JSON and XML files
- Upload new files
- Replace existing files
- Delete files
- Download files

## Troubleshooting

### If you see "Failed to list files" error:
1. Check that your R2_BUCKET_NAME is correct
2. Verify the bucket exists in your Cloudflare dashboard
3. Ensure your credentials have access to this bucket

### If the server won't start:
1. Make sure port 3000 is not in use
2. Check that all dependencies are installed: `npm install`
3. Verify your `.env` file is in the project root

### If uploads fail:
1. Check you have write permissions on the bucket
2. Verify file size is under 50MB
3. Check available storage quota in your Cloudflare account

## Need Help?

Check the main README.md file for detailed documentation and API reference.
