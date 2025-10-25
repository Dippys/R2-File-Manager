// State management
let currentPath = '';
let selectedFile = null;
let files = [];
let allFiles = []; // Store all files for search/filtering
let filteredFiles = []; // Files after search filter
let currentPage = 1;
let pageSize = 100;
let searchQuery = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
    
    // Breadcrumb navigation
    document.getElementById('breadcrumb-root').addEventListener('click', () => {
        navigateToPath('');
    });
});

// Load files from server
async function loadFiles(prefix = '') {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading files...</p>
        </div>
    `;

    try {
        const response = await fetch(`/api/files?prefix=${encodeURIComponent(prefix)}`);
        const data = await response.json();

        if (data.success) {
            allFiles = data.files;
            currentPath = prefix;
            currentPage = 1;
            searchQuery = '';
            document.getElementById('searchInput').value = '';
            applyFiltersAndRender();
            updateBreadcrumb();
        } else {
            throw new Error(data.error || 'Failed to load files');
        }
    } catch (error) {
        console.error('Error loading files:', error);
        fileList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3>Error loading files</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Apply search filter and pagination
function applyFiltersAndRender() {
    // Apply search filter
    if (searchQuery.trim() === '') {
        filteredFiles = [...allFiles];
    } else {
        const query = searchQuery.toLowerCase();
        filteredFiles = allFiles.filter(file => {
            const fileName = getFileName(file.key).toLowerCase();
            return fileName.includes(query);
        });
    }
    
    // Render current page
    renderFilesWithPagination();
}

// Handle search input
function handleSearch() {
    searchQuery = document.getElementById('searchInput').value;
    currentPage = 1; // Reset to first page on search
    applyFiltersAndRender();
}

// Render file list with pagination
function renderFilesWithPagination() {
    const container = document.getElementById('fileList');
    const totalFiles = filteredFiles.length;
    
    // Calculate pagination
    const totalPages = Math.ceil(totalFiles / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalFiles);
    const pageFiles = filteredFiles.slice(startIndex, endIndex);

    if (totalFiles === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📂</div>
                <h3>${searchQuery ? 'No matches found' : 'Empty folder'}</h3>
                <p>${searchQuery ? 'Try a different search term' : 'No files found in this directory'}</p>
            </div>
        `;
        document.getElementById('paginationContainer').style.display = 'none';
        return;
    }

    // Render files
    container.innerHTML = pageFiles.map(file => {
        const isDirectory = file.isDirectory;
        const icon = isDirectory ? '📁' : getFileIcon(file.key);
        const size = isDirectory ? '' : formatFileSize(file.size);
        
        return `
            <div class="file-item" onclick='selectFile(${JSON.stringify(file)})'>
                <div class="file-icon">${icon}</div>
                <div class="file-info">
                    <div class="file-name">${getFileName(file.key)}</div>
                    <div class="file-meta">${size}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Update pagination controls
    updatePaginationControls(totalFiles, startIndex, endIndex, totalPages);
}

// Update pagination controls
function updatePaginationControls(totalFiles, startIndex, endIndex, totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageNumbers = document.getElementById('pageNumbers');
    
    // Show pagination if more than one page
    if (totalPages > 1) {
        paginationContainer.style.display = 'flex';
    } else {
        paginationContainer.style.display = 'none';
        return;
    }
    
    // Update info text
    paginationInfo.textContent = `Showing ${startIndex + 1} - ${endIndex} of ${totalFiles} ${searchQuery ? 'matches' : 'items'}`;
    
    // Update buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // Generate page numbers (show max 5 pages)
    let pageNumbersHtml = '';
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    if (startPage > 1) {
        pageNumbersHtml += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            pageNumbersHtml += `<span style="padding: 0 5px;">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        pageNumbersHtml += `<button class="page-btn ${activeClass}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pageNumbersHtml += `<span style="padding: 0 5px;">...</span>`;
        }
        pageNumbersHtml += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    pageNumbers.innerHTML = pageNumbersHtml;
}

// Pagination functions
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        applyFiltersAndRender();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredFiles.length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        applyFiltersAndRender();
    }
}

function goToPage(page) {
    currentPage = page;
    applyFiltersAndRender();
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSizeSelector').value);
    currentPage = 1;
    applyFiltersAndRender();
}

// Get file icon based on extension
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️',
        'json': '📋',
        'xml': '📄',
        'txt': '📝',
        'pdf': '📕',
        'zip': '🗜️',
        'mp4': '🎬',
        'mp3': '🎵',
        'wav': '🎵',
        'ogg': '🎵',
        'm4a': '🎵',
    };
    return icons[ext] || '📄';
}

// Get filename from path
function getFileName(path) {
    if (path.endsWith('/')) {
        return path.split('/').slice(-2)[0];
    }
    return path.split('/').pop();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Select file
function selectFile(file) {
    if (file.isDirectory) {
        navigateToPath(file.key);
        return;
    }

    selectedFile = file;
    
    // Update UI
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.target.closest('.file-item').classList.add('selected');
    
    // Enable buttons
    document.getElementById('replaceBtn').disabled = false;
    document.getElementById('deleteBtn').disabled = false;
    
    // Load preview
    loadPreview(file);
}

// Load file preview
async function loadPreview(file) {
    const previewArea = document.getElementById('previewArea');
    const ext = file.key.split('.').pop().toLowerCase();
    
    previewArea.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading preview...</p>
        </div>
    `;

    try {
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
            // Image preview
            const url = `/api/files/download?key=${encodeURIComponent(file.key)}`;
            previewArea.innerHTML = `
                <div class="preview-container">
                    <h3>${getFileName(file.key)}</h3>
                    <p style="color: #6c757d; margin: 10px 0;">Size: ${formatFileSize(file.size)}</p>
                    <img src="${url}" alt="${getFileName(file.key)}" class="preview-image" />
                </div>
            `;
        } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
            // Audio preview
            const url = `/api/files/download?key=${encodeURIComponent(file.key)}`;
            previewArea.innerHTML = `
                <div class="preview-container">
                    <h3>🎵 ${getFileName(file.key)}</h3>
                    <p style="color: #6c757d; margin: 10px 0;">Size: ${formatFileSize(file.size)}</p>
                    <div class="audio-player-container">
                        <audio controls class="audio-player">
                            <source src="${url}" type="audio/${ext === 'mp3' ? 'mpeg' : ext}">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                    <div style="margin-top: 15px;">
                        <a href="${url}" 
                           download="${getFileName(file.key)}"
                           style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">
                            ⬇️ Download Audio File
                        </a>
                    </div>
                </div>
            `;
        } else if (['json', 'xml', 'txt'].includes(ext)) {
            // Text/Code preview
            const response = await fetch(`/api/files/download?key=${encodeURIComponent(file.key)}`);
            let content = await response.text();
            
            // Pretty print JSON
            if (ext === 'json') {
                try {
                    content = JSON.stringify(JSON.parse(content), null, 2);
                } catch (e) {
                    // Invalid JSON, show as-is
                }
            }
            
            // Limit display for very large files
            const maxDisplayLength = 100000; // ~100KB of text
            let displayContent = content;
            let truncated = false;
            
            if (content.length > maxDisplayLength) {
                displayContent = content.substring(0, maxDisplayLength);
                truncated = true;
            }
            
            previewArea.innerHTML = `
                <div class="preview-container">
                    <h3>${getFileName(file.key)}</h3>
                    <p style="color: #6c757d; margin: 10px 0;">
                        Size: ${formatFileSize(file.size)}
                        ${truncated ? ' (Preview truncated - file is too large to display completely)' : ''}
                    </p>
                    <pre class="preview-code">${escapeHtml(displayContent)}</pre>
                    <div style="margin-top: 15px;">
                        <a href="/api/files/download?key=${encodeURIComponent(file.key)}" 
                           download="${getFileName(file.key)}"
                           style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">
                            ⬇️ Download Full File
                        </a>
                    </div>
                </div>
            `;
        } else {
            // Unsupported preview
            previewArea.innerHTML = `
                <div class="preview-container">
                    <div class="empty-state">
                        <div class="empty-state-icon">${getFileIcon(file.key)}</div>
                        <h3>${getFileName(file.key)}</h3>
                        <p style="color: #6c757d; margin: 10px 0;">Size: ${formatFileSize(file.size)}</p>
                        <p>Preview not available for this file type</p>
                        <div style="margin-top: 20px;">
                            <a href="/api/files/download?key=${encodeURIComponent(file.key)}" 
                               download="${getFileName(file.key)}"
                               style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">
                                ⬇️ Download File
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading preview:', error);
        previewArea.innerHTML = `
            <div class="preview-container">
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <h3>Error loading preview</h3>
                    <p>${error.message}</p>
                </div>
            </div>
        `;
    }
}

// Escape HTML for safe display
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Navigate to path
function navigateToPath(path) {
    loadFiles(path);
    selectedFile = null;
    document.getElementById('replaceBtn').disabled = true;
    document.getElementById('deleteBtn').disabled = true;
    document.getElementById('previewArea').innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <h2>No file selected</h2>
            <p>Select a file from the sidebar to preview it</p>
        </div>
    `;
}

// Update breadcrumb
function updateBreadcrumb() {
    const pathElement = document.getElementById('breadcrumb-path');
    
    if (!currentPath) {
        pathElement.innerHTML = '';
        return;
    }
    
    const parts = currentPath.split('/').filter(p => p);
    let breadcrumbHtml = '';
    let accumulatedPath = '';
    
    parts.forEach((part, index) => {
        accumulatedPath += part + '/';
        breadcrumbHtml += ` / <span onclick="navigateToPath('${accumulatedPath}')">${part}</span>`;
    });
    
    pathElement.innerHTML = breadcrumbHtml;
}

// Refresh files
function refreshFiles() {
    loadFiles(currentPath);
}

// Upload modal functions
function showUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
    document.getElementById('uploadFile').value = '';
    document.getElementById('uploadError').innerHTML = '';
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
}

async function uploadFile() {
    const fileInput = document.getElementById('uploadFile');
    const errorDiv = document.getElementById('uploadError');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        errorDiv.innerHTML = '<div class="error-message">Please select a file</div>';
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentPath);
    
    try {
        const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
            errorDiv.innerHTML = '<div class="success-message">File uploaded successfully!</div>';
            setTimeout(() => {
                closeUploadModal();
                refreshFiles();
            }, 1000);
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        errorDiv.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

// Replace modal functions
function showReplaceModal() {
    if (!selectedFile) return;
    
    document.getElementById('replaceModal').classList.add('active');
    document.getElementById('replaceFileKey').value = selectedFile.key;
    document.getElementById('replaceFile').value = '';
    document.getElementById('replaceError').innerHTML = '';
}

function closeReplaceModal() {
    document.getElementById('replaceModal').classList.remove('active');
}

async function replaceFile() {
    const fileInput = document.getElementById('replaceFile');
    const errorDiv = document.getElementById('replaceError');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        errorDiv.innerHTML = '<div class="error-message">Please select a file</div>';
        return;
    }
    
    if (!selectedFile) {
        errorDiv.innerHTML = '<div class="error-message">No file selected</div>';
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', selectedFile.key);
    
    try {
        const response = await fetch('/api/files/replace', {
            method: 'PUT',
            body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
            errorDiv.innerHTML = '<div class="success-message">File replaced successfully!</div>';
            setTimeout(() => {
                closeReplaceModal();
                refreshFiles();
                loadPreview(selectedFile);
            }, 1000);
        } else {
            throw new Error(data.error || 'Replace failed');
        }
    } catch (error) {
        console.error('Error replacing file:', error);
        errorDiv.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

// Delete file
async function deleteFile() {
    if (!selectedFile) return;
    
    if (!confirm(`Are you sure you want to delete "${getFileName(selectedFile.key)}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/files?key=${encodeURIComponent(selectedFile.key)}`, {
            method: 'DELETE',
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('File deleted successfully!');
            selectedFile = null;
            document.getElementById('replaceBtn').disabled = true;
            document.getElementById('deleteBtn').disabled = true;
            refreshFiles();
        } else {
            throw new Error(data.error || 'Delete failed');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        alert(`Error deleting file: ${error.message}`);
    }
}
