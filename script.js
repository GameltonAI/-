class FileConverter {
    constructor() {
        this.fileInput = document.getElementById('fileInput');
        this.dropZone = document.getElementById('dropZone');
        this.formatSelect = document.getElementById('formatSelect');
        this.convertBtn = document.getElementById('convertBtn');
        this.resultArea = document.getElementById('resultArea');
        this.fileList = document.getElementById('fileList');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        this.themeToggle = document.getElementById('themeToggle');
        this.scrollToTop = document.getElementById('scrollToTop');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        this.historyList = document.getElementById('historyList');
        
        this.files = [];
        this.stats = {
            totalConversions: parseInt(localStorage.getItem('totalConversions')) || 0,
            filesProcessed: parseInt(localStorage.getItem('filesProcessed')) || 0,
            timeSaved: parseInt(localStorage.getItem('timeSaved')) || 0
        };

        this.initEvents();
        this.initUI();
        this.updateStats();
        this.loadHistory();
        this.showToast('Готов к работе! Перетащите файлы или нажмите для выбора', 'success');
    }

    initEvents() {
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        this.convertBtn.addEventListener('click', () => this.convertFiles());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.scrollToTop.addEventListener('click', () => this.scrollToTopFunc());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Свайп-жесты для мобильных устройств
        this.dropZone.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        this.dropZone.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Настройки качества
        this.qualitySlider.addEventListener('input', () => {
            this.qualityValue.textContent = `${this.qualitySlider.value}%`;
        });

        // Быстрые действия
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                this.formatSelect.value = format;
                this.showToast(`Формат установлен: ${format.toUpperCase()}`, 'success');
            });
        });

        // Прокрутка
        window.addEventListener('scroll', () => this.toggleScrollButton());
    }

    initUI() {
        // Загрузка темы
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(savedTheme);
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
        this.animateUploadProgress();
    }

    isSupportedFormat(file) {
        const supportedTypes = [
            'video/webm', 'video/mp4', 'video/x-msvideo', 'video/quicktime',
            'image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/tiff'
        ];
        return supportedTypes.includes(file.type) || 
               file.name.toLowerCase().endsWith('.avi') ||
               file.name.toLowerCase().endsWith('.mov');
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
                if (result) {
                    results.push(result);
                    this.addToHistory(this.files[i], this.formatSelect.value);
                }
                
                const progress = ((i + 1) / this.files.length) * 100;
                this.updateConversionProgress(progress);
            }

            this.incrementStats(this.files.length);
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
            
            reader.onload = async (e) => {
                try {
                    const result = e.target.result;
                    const isVideo = file.type.startsWith('video/');
                    const targetFormat = this.formatSelect.value;

                    if (isVideo) {
                        const frame = await this.extractFrameFromVideo(result, file.name);
                        if (frame) {
                            const converted = await this.convertImage(frame, targetFormat, file.name);
                            resolve(converted);
                        } else {
                            resolve(null);
                        }
                    } else {
                        const converted = await this.convertImage(result, targetFormat, file.name);
                        resolve(converted);
                    }
                } catch (error) {
                    console.error('Error converting file:', error);
                    this.showToast(`Ошибка конвертации: ${file.name}`, 'error');
                    resolve(null);
                }
            };

            reader.onerror = () => {
                this.showToast(`Ошибка чтения файла: ${file.name}`, 'error');
                resolve(null);
            };

            reader.readAsDataURL(file);
        });
    }

    extractFrameFromVideo(videoUrl, filename) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.setAttribute('crossOrigin', 'anonymous');
            video.setAttribute('preload', 'metadata');
            
            let seeked = false;

            const onSeeked = () => {
                if (seeked) return;
                seeked = true;
                
                try {
                    canvas.width = video.videoWidth || 800;
                    canvas.height = video.videoHeight || 600;
                    
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Проверяем не пустой ли canvas
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    let isEmpty = true;
                    
                    for (let i = 0; i < imageData.length; i += 4) {
                        if (imageData[i] !== 0 || imageData[i + 1] !== 0 || imageData[i + 2] !== 0) {
                            isEmpty = false;
                            break;
                        }
                    }
                    
                    if (isEmpty) {
                        this.showToast(`Не удалось извлечь кадр из видео: ${filename}`, 'warning');
                        resolve(null);
                    } else {
                        resolve(canvas.toDataURL('image/png'));
                    }
                } catch (error) {
                    console.error('Error extracting frame:', error);
                    resolve(null);
                }
            };

            video.addEventListener('loadeddata', () => {
                video.currentTime = Math.min(1, video.duration * 0.1);
            });

            video.addEventListener('seeked', onSeeked);
            video.addEventListener('loadedmetadata', () => {
                video.currentTime = Math.min(1, video.duration * 0.1);
            });

            video.addEventListener('error', (e) => {
                console.error('Video error:', e);
                this.showToast(`Ошибка обработки видео: ${filename}`, 'error');
                resolve(null);
            });

            setTimeout(() => {
                if (!seeked) {
                    this.showToast(`Таймаут обработки видео: ${filename}`, 'warning');
                    resolve(null);
                }
            }, 10000);

            video.src = videoUrl;
            video.load();
        });
    }

    convertImage(imageUrl, targetFormat, filename) {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Создаем белый фон для форматов без прозрачности
                if (targetFormat === 'jpeg' || targetFormat === 'bmp') {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Применяем настройки качества
                const quality = (targetFormat === 'jpeg' || targetFormat === 'webp') ? 
                    (this.qualitySlider.value / 100) : 1;
                
                const mimeType = targetFormat === 'jpg' ? 'image/jpeg' : `image/${targetFormat}`;
                
                try {
                    const dataUrl = canvas.toDataURL(mimeType, quality);
                    
                    resolve({
                        dataUrl,
                        format: targetFormat,
                        filename: filename.replace(/\.[^/.]+$/, '') + '.' + targetFormat,
                        size: this.getDataUrlSize(dataUrl)
                    });
                } catch (error) {
                    console.error('Conversion error:', error);
                    this.showToast(`Ошибка конвертации: ${filename}`, 'error');
                    resolve(null);
                }
            };

            img.onerror = () => {
                this.showToast(`Ошибка загрузки изображения: ${filename}`, 'error');
                resolve(null);
            };

            img.src = imageUrl;
        });
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

        // Если много файлов, предлагаем скачать архив
        if (validResults.length > 1) {
            const downloadAllBtn = document.createElement('button');
            downloadAllBtn.className = 'download-btn';
            downloadAllBtn.style.marginTop = '20px';
            downloadAllBtn.innerHTML = `
                <span class="material-icons">archive</span>
                Скачать все файлы (ZIP)
            `;
            downloadAllBtn.onclick = () => this.downloadAllResults(validResults);
            
            this.resultArea.appendChild(downloadAllBtn);
        }
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

    downloadAllResults(results) {
        if (!window.JSZip) {
            this.showToast('Ошибка: библиотека ZIP не загружена', 'error');
            return;
        }

        const zip = new JSZip();
        
        results.forEach((result, index) => {
            const blob = this.dataUrlToBlob(result.dataUrl);
            zip.file(result.filename, blob);
        });

        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'converted_files.zip';
            link.click();
            URL.revokeObjectURL(link.href);
            
            this.showToast(`Архив с ${results.length} файлами скачивается`, 'success');
        });
    }

    dataUrlToBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    // Тема
    applyTheme(theme) {
        const isDark = theme === 'dark';
        document.body.classList.toggle('dark-theme', isDark);
        
        const icon = this.themeToggle.querySelector('span');
        icon.textContent = isDark ? 'light_mode' : 'dark_mode';
        
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        const isDark = !document.body.classList.contains('dark-theme');
        this.applyTheme(isDark ? 'dark' : 'light');
    }

    // Прокрутка
    scrollToTopFunc() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    toggleScrollButton() {
        if (window.pageYOffset > 300) {
            this.scrollToTop.classList.add('show');
        } else {
            this.scrollToTop.classList.remove('show');
        }
    }

    // Статистика
    updateStats() {
        document.getElementById('totalConversions').textContent = this.stats.totalConversions;
        document.getElementById('filesProcessed').textContent = this.stats.filesProcessed;
        document.getElementById('timeSaved').textContent = this.stats.timeSaved;
    }

    incrementStats(filesCount) {
        this.stats.totalConversions++;
        this.stats.filesProcessed += filesCount;
        this.stats.timeSaved += Math.ceil(filesCount * 0.5);

        localStorage.setItem('totalConversions', this.stats.totalConversions);
        localStorage.setItem('filesProcessed', this.stats.filesProcessed);
        localStorage.setItem('timeSaved', this.stats.timeSaved);

        this.updateStats();
    }

    // История
    loadHistory() {
        const history = JSON.parse(localStorage.getItem('conversionHistory')) || [];
        this.displayHistory(history);
    }

    displayHistory(history) {
        if (history.length === 0) {
            this.historyList.innerHTML = '<p class="no-history">История конвертаций пуста</p>';
            return;
        }

        this.historyList.innerHTML = history.slice(0, 6).map(item => `
            <div class="history-item" onclick="fileConverter.useHistoryItem('${item.format}')">
                <div class="history-filename">${this.truncateFileName(item.originalName)}</div>
                <div class="history-details">→ ${item.format.toUpperCase()} • ${new Date(item.timestamp).toLocaleDateString()}</div>
            </div>
        `).join('');
    }

    addToHistory(file, format) {
        const history = JSON.parse(localStorage.getItem('conversionHistory')) || [];
        
        history.unshift({
            originalName: file.name,
            format: format,
            timestamp: Date.now()
        });

        if (history.length > 20) history.pop();

        localStorage.setItem('conversionHistory', JSON.stringify(history));
        this.loadHistory();
    }

    clearHistory() {
        localStorage.removeItem('conversionHistory');
        this.loadHistory();
        this.showToast('История очищена', 'success');
    }

    useHistoryItem(format) {
        this.formatSelect.value = format;
        this.showToast(`Формат установлен: ${format.toUpperCase()}`, 'success');
    }

    // Уведомления
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

// Обработка глобальных ошибок
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});