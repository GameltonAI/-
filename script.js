class FileConverter {
    constructor() {
        this.fileInput = document.getElementById('fileInput');
        this.dropZone = document.getElementById('dropZone');
        this.formatSelect = document.getElementById('formatSelect');
        this.convertBtn = document.getElementById('convertBtn');
        this.resultArea = document.getElementById('resultArea');
        this.fileList = document.getElementById('fileList');
        this.uploadProgress = document.getElementById('uploadProgress');
        
        this.files = [];
        this.initEvents();
        this.showToast('Готов к работе! Перетащите файлы или нажмите для выбора', 'success');
    }

    initEvents() {
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        this.convertBtn.addEventListener('click', () => this.convertFiles());
        
        // Свайп-жесты для мобильных устройств
        this.dropZone.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        this.dropZone.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        if (!this.dropZone.contains(e.relatedTarget)) {
            this.dropZone.classList.remove('dragover');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        this.handleFileSelect(e.dataTransfer.files);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.fileInput.click();
    }

    handleFileSelect(fileList) {
        if (fileList.length === 0) return;

        const newFiles = Array.from(fileList).filter(file => 
            this.isSupportedFormat(file) && !this.isDuplicate(file)
        );

        if (newFiles.length === 0) {
            this.showToast('Неподдерживаемый формат файла или файл уже добавлен', 'error');
            return;
        }

        this.files.push(...newFiles);
        this.updateFileList();
        this.updateConvertButton();
        this.showToast(`Добавлено ${newFiles.length} файл(ов)`, 'success');
        
        // Анимация успешной загрузки
        this.animateUploadProgress();
    }

    isSupportedFormat(file) {
        const supportedTypes = [
            'video/webm', 'video/mp4', 'video/avi', 'video/quicktime',
            'image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/tiff'
        ];
        return supportedTypes.some(type => file.type.includes(type.replace('video/', '').replace('image/', '')));
    }

    isDuplicate(file) {
        return this.files.some(existingFile => 
            existingFile.name === file.name && existingFile.size === file.size
        );
    }

    animateUploadProgress() {
        this.uploadProgress.style.display = 'block';
        const progressBar = this.uploadProgress.querySelector('.progress-bar');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.uploadProgress.style.display = 'none';
                    progressBar.style.width = '0%';
                }, 500);
            }
        }, 30);
    }

    updateFileList() {
        if (this.files.length === 0) {
            this.fileList.style.display = 'none';
            return;
        }

        this.fileList.style.display = 'block';
        this.fileList.innerHTML = this.files.map((file, index) => `
            <div class="file-item">
                <span class="material-icons file-icon">${this.getFileIcon(file)}</span>
                <div class="file-info">
                    <div class="file-name">${this.truncateFileName(file.name)}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                </div>
                <button class="file-remove" onclick="fileConverter.removeFile(${index})">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `).join('');
    }

    getFileIcon(file) {
        if (file.type.startsWith('video/')) return 'videocam';
        if (file.type.startsWith('image/')) return 'image';
        return 'insert_drive_file';
    }

    truncateFileName(name, maxLength = 30) {
        return name.length > maxLength ? name.substring(0, maxLength - 3) + '...' : name;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileList();
        this.updateConvertButton();
    }

    updateConvertButton() {
        this.convertBtn.disabled = this.files.length === 0;
        if (this.files.length > 0) {
            this.convertBtn.classList.add('pulse');
        } else {
            this.convertBtn.classList.remove('pulse');
        }
    }

    async convertFiles() {
        if (this.files.length === 0) return;

        this.setConvertButtonLoading(true);
        this.resultArea.innerHTML = '<div class="result-placeholder"><div class="loader"></div><p>Конвертация...</p></div>';

        try {
            const results = [];
            for (let i = 0; i < this.files.length; i++) {
                const result = await this.convertFile(this.files[i]);
                if (result) results.push(result);
                
                // Имитация прогресса для лучшего UX
                const progress = ((i + 1) / this.files.length) * 100;
                this.updateConversionProgress(progress);
            }

            this.displayResults(results);
            this.showToast(`Успешно сконвертировано ${results.length} файл(ов)`, 'success');
        } catch (error) {
            console.error('Conversion error:', error);
            this.showToast('Ошибка при конвертации файлов', 'error');
        } finally {
            this.setConvertButtonLoading(false);
        }
    }

    setConvertButtonLoading(loading) {
        this.convertBtn.disabled = loading;
        this.convertBtn.classList.toggle('loading', loading);
    }

    updateConversionProgress(progress) {
        const placeholder = this.resultArea.querySelector('.result-placeholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <div class="loader"></div>
                <p>Конвертация... ${Math.round(progress)}%</p>
            `;
        }
    }

    async convertFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const result = e.target.result;
                const isVideo = file.type.startsWith('video/');
                const targetFormat = this.formatSelect.value;

                if (isVideo) {
                    this.extractFrameFromVideo(result, targetFormat, file.name).then(resolve);
                } else {
                    const converted = this.convertImage(result, targetFormat, file.name);
                    resolve(converted);
                }
            };

            reader.onerror = () => {
                this.showToast(`Ошибка чтения файла: ${file.name}`, 'error');
                resolve(null);
            };

            if (file.type.startsWith('video/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }

    extractFrameFromVideo(videoUrl, targetFormat, filename) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.src = videoUrl;
            video.currentTime = 0.5; // Более ранний кадр для лучшего результата

            video.addEventListener('loadeddata', () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                video.addEventListener('seeked', () => {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const result = this.createResult(canvas, targetFormat, filename);
                    resolve(result);
                });
            });

            video.addEventListener('error', () => {
                this.showToast(`Ошибка обработки видео: ${filename}`, 'error');
                resolve(null);
            });

            // Таймаут для медленных видео
            setTimeout(() => {
                if (video.readyState < 2) {
                    this.showToast(`Видео ${filename} загружается слишком долго`, 'warning');
                }
            }, 5000);
        });
    }

    convertImage(imageUrl, targetFormat, filename) {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };

        img.src = imageUrl;
        return this.createResult(canvas, targetFormat, filename);
    }

    createResult(canvas, format, filename) {
        const quality = format === 'jpeg' ? 0.92 : 1;
        const dataUrl = canvas.toDataURL(`image/${format}`, quality);
        
        return {
            dataUrl,
            format,
            filename: filename.replace(/\.[^/.]+$/, '') + '.' + format,
            size: this.getDataUrlSize(dataUrl)
        };
    }

    getDataUrlSize(dataUrl) {
        const base64 = dataUrl.split(',')[1];
        const binary = atob(base64);
        return binary.length;
    }

    displayResults(results) {
        const validResults = results.filter(result => result !== null);
        
        if (validResults.length === 0) {
            this.resultArea.innerHTML = `
                <div class="result-placeholder">
                    <span class="material-icons">error_outline</span>
                    <p>Не удалось сконвертировать файлы</p>
                </div>
            `;
            return;
        }

        this.resultArea.innerHTML = `
            <div class="result-grid">
                ${validResults.map(result => `
                    <div class="result-item">
                        <img src="${result.dataUrl}" alt="${result.filename}" loading="lazy">
                        <div class="result-info">
                            <div class="result-name">${this.truncateFileName(result.filename)}</div>
                            <div class="result-size">${this.formatFileSize(result.size)}</div>
                        </div>
                        <button class="download-btn" onclick="fileConverter.downloadResult('${result.dataUrl}', '${result.filename}')">
                            <span class="material-icons">download</span>
                            Скачать ${result.format.toUpperCase()}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        // Анимация появления результатов
        const resultItems = this.resultArea.querySelectorAll('.result-item');
        resultItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });
    }

    downloadResult(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast(`Файл ${filename} скачивается`, 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

// Инициализация при загрузке страницы
let fileConverter;
document.addEventListener('DOMContentLoaded', () => {
    fileConverter = new FileConverter();
});

// Обработка ошибок
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// Service Worker для оффлайн-работы (опционально)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    });
}