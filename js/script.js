/* ==========================================================
   IMAGE → PDF PRO CONVERTER (REMASTERED UI)
   Features: Themes, Animations, Robust Processing
========================================================== */

class ImageToPDFConverter {
    constructor() {
        this.init();
    }

    init() {
        this.pica = window.pica();
        this.images = []; 
        this.dragIndex = null;
        
        this.cacheDOM();
        this.initTheme(); // Load theme logic
        this.attachEvents();
        this.updateHUD();
    }

    cacheDOM() {
        // Inputs
        this.fileInput = document.getElementById("fileInput");
        this.themeSelector = document.getElementById("theme-selector");
        
        // Display Areas
        this.dropZone = document.getElementById("drop-zone");
        this.thumbsContainer = document.getElementById("thumbs");
        this.workspace = document.querySelector(".workspace");
        
        // Stats
        this.countEl = document.getElementById("count");
        this.totalSizeEl = document.getElementById("totalSize");
        this.pagesEl = document.getElementById("pages");
        
        // Modals
        this.processingOverlay = document.getElementById("processingOverlay");
        this.overlayStatus = document.getElementById("overlayStatus");
        this.imageModal = document.getElementById("imageModal");
        this.modalImg = document.getElementById("modalImg");
        this.toastContainer = document.getElementById("toastContainer");
        
        // Controls
        this.progressBar = document.getElementById("progressBar");
        this.statusText = document.getElementById("statusText");
        this.createBtn = document.getElementById("createBtn");
        this.removeAllBtn = document.getElementById("removeAllBtn");
        
        // Settings
        this.pageSizeEl = document.getElementById("pageSize");
        this.customSizeRow = document.getElementById("customSizeRow");
        this.customW = document.getElementById("customW");
        this.customH = document.getElementById("customH");
        this.qualityEl = document.getElementById("quality");
        this.qualityValueEl = document.getElementById("qualityValue");
    }

    initTheme() {
        const savedTheme = localStorage.getItem('pdf_theme') || 'theme-light';
        document.documentElement.className = savedTheme;
        this.themeSelector.value = savedTheme;

        this.themeSelector.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            document.documentElement.className = newTheme;
            localStorage.setItem('pdf_theme', newTheme);
        });
    }

    attachEvents() {
        document.getElementById("uploadBtn").addEventListener("click", () => this.fileInput.click());
        this.fileInput.addEventListener("change", (e) => this.handleFiles(e.target.files));

        // Drag & Drop
        this.workspace.addEventListener("dragover", (e) => { e.preventDefault(); this.workspace.classList.add("drag-active"); });
        this.workspace.addEventListener("dragleave", (e) => { if(e.target === this.workspace) this.workspace.classList.remove("drag-active"); });
        this.workspace.addEventListener("drop", this.handleDrop.bind(this));

        // Controls
        this.createBtn.addEventListener("click", this.createPDF.bind(this));
        this.removeAllBtn.addEventListener("click", this.removeAllImages.bind(this));
        this.qualityEl.addEventListener("input", (e) => this.qualityValueEl.textContent = e.target.value);
        
        this.pageSizeEl.addEventListener("change", () => {
            this.customSizeRow.classList.toggle('hidden', this.pageSizeEl.value !== 'custom');
            this.updateHUD();
        });
        
        // Modal
        this.imageModal.addEventListener('click', (e) => {
            if(e.target === this.imageModal || e.target.closest('.close-modal')) {
                this.imageModal.classList.remove('active');
            }
        });
    }

    /* --- FILE HANDLING --- */
    handleDrop(e) {
        e.preventDefault();
        this.workspace.classList.remove("drag-active");
        if(e.dataTransfer.files.length) this.handleFiles(e.dataTransfer.files);
    }

    handleFiles(fileList) {
        const validTypes = ["image/png", "image/jpeg", "image/webp"];
        let addedCount = 0;

        Array.from(fileList).forEach(file => {
            if (!validTypes.includes(file.type)) return;
            if (this.images.some(img => img.name === file.name && img.size === file.size)) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                this.images.push({
                    name: file.name,
                    size: file.size,
                    src: e.target.result,
                    type: file.type,
                    rotation: 0
                });
                addedCount++;
                if (addedCount === 1 || addedCount === fileList.length) this.renderThumbs();
            };
            reader.readAsDataURL(file);
        });
    }

    /* --- UI RENDERING --- */
    renderThumbs() {
        this.thumbsContainer.innerHTML = "";
        let totalBytes = 0;

        this.images.forEach((img, index) => {
            totalBytes += img.size;
            const card = document.createElement("div");
            card.className = "thumb-card";
            card.draggable = true;
            card.style.animationDelay = `${index * 0.05}s`; // Staggered animation

            card.innerHTML = `
                <div class="img-wrapper">
                    <img src="${img.src}" style="transform: rotate(${img.rotation}deg)">
                    <div class="card-actions">
                        <button class="action-btn" onclick="converter.preview(${index})"><i class="fa-solid fa-eye"></i></button>
                        <button class="action-btn" onclick="converter.rotate(${index})"><i class="fa-solid fa-rotate-right"></i></button>
                        <button class="action-btn delete" onclick="converter.remove(${index})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="card-info">
                    <span>${index + 1}</span>
                    <span>${(img.size / 1024).toFixed(0)} KB</span>
                </div>
            `;
            
            this.setupDragEvents(card, index);
            this.thumbsContainer.appendChild(card);
        });

        this.updateHUD(totalBytes);
    }

    setupDragEvents(card, index) {
        card.addEventListener('dragstart', (e) => { this.dragIndex = index; card.classList.add('dragging'); });
        card.addEventListener('dragend', () => { card.classList.remove('dragging'); this.dragIndex = null; });
        card.addEventListener('dragover', (e) => e.preventDefault());
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.dragIndex === null || this.dragIndex === index) return;
            const item = this.images.splice(this.dragIndex, 1)[0];
            this.images.splice(index, 0, item);
            this.renderThumbs();
        });
    }

    /* --- ACTIONS --- */
    preview(index) {
        this.modalImg.src = this.images[index].src;
        this.modalImg.style.transform = `rotate(${this.images[index].rotation}deg)`;
        this.imageModal.classList.add("active");
    }

    rotate(index) {
        this.images[index].rotation = (this.images[index].rotation + 90) % 360;
        this.renderThumbs();
    }

    remove(index) {
        this.images.splice(index, 1);
        this.renderThumbs();
    }

    removeAllImages() {
        if(confirm("Clear all images?")) {
            this.images = [];
            this.renderThumbs();
        }
    }

    updateHUD(bytes = 0) {
        // Calculate size if not provided
        if(bytes === 0) bytes = this.images.reduce((acc, img) => acc + img.size, 0);
        
        this.countEl.textContent = this.images.length;
        this.totalSizeEl.textContent = (bytes / (1024*1024)).toFixed(2) + " MB";
        
        const size = this.pageSizeEl.value;
        this.pagesEl.textContent = size === 'custom' ? 'Custom' : size.toUpperCase();
        
        this.createBtn.disabled = this.images.length === 0;
        this.statusText.textContent = this.images.length ? "Ready to export" : "Waiting for files...";
        this.progressBar.style.width = this.images.length ? "10%" : "0%";
    }

    /* --- PDF GENERATION --- */
    async createPDF() {
        if (!this.images.length) return;
        
        this.processingOverlay.classList.add("active");
        this.overlayStatus.textContent = "Initializing...";
        
        try {
            // Slight delay to allow UI to update
            await new Promise(r => setTimeout(r, 100)); 
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: document.getElementById("orientation").value,
                unit: "mm",
                format: this.getPageFormat()
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = Number(document.getElementById("margin").value);
            const quality = Number(this.qualityEl.value);
            const fitMode = document.getElementById("imageFit").value;

            for (let i = 0; i < this.images.length; i++) {
                this.overlayStatus.textContent = `Processing page ${i + 1} of ${this.images.length}`;
                this.updateProgress((i / this.images.length) * 100);
                
                if (i > 0) doc.addPage();
                
                const imgData = await this.processImage(this.images[i], pageWidth, pageHeight, quality);
                const dims = this.calcDimensions(imgData.width, imgData.height, pageWidth, pageHeight, margin, fitMode);
                
                doc.addImage(imgData.data, 'JPEG', dims.x, dims.y, dims.w, dims.h);
                
                if(document.getElementById("pageNumbers").checked) {
                    doc.setFontSize(10);
                    doc.text(`${i+1} / ${this.images.length}`, pageWidth - margin, pageHeight - margin, { align: 'right' });
                }
            }

            doc.save("document.pdf");
            this.showToast("PDF Downloaded Successfully!", "success");
            this.updateProgress(100);
            
        } catch (err) {
            console.error(err);
            this.showToast("Error creating PDF", "error");
        } finally {
            setTimeout(() => {
                this.processingOverlay.classList.remove("active");
                this.updateProgress(0);
            }, 1000);
        }
    }

    getPageFormat() {
        const val = this.pageSizeEl.value;
        if(val === 'custom') {
            return [Number(this.customW.value)||210, Number(this.customH.value)||297];
        }
        return val; // a4, letter
    }

    async processImage(imgObj, pW, pH, quality) {
        const img = new Image();
        img.src = imgObj.src;
        await img.decode();
        
        // Handle Rotation Logic internally for canvas
        const isRotated = imgObj.rotation % 180 !== 0;
        const srcW = isRotated ? img.height : img.width;
        const srcH = isRotated ? img.width : img.height;

        // Resize logic (using canvas for simplicity & Pica for quality if needed, 
        // simplified here for stability)
        const canvas = document.createElement('canvas');
        // Max resolution cap for PDF performance
        const scale = Math.min(1, 2000 / Math.max(srcW, srcH)); 
        canvas.width = srcW * scale;
        canvas.height = srcH * scale;
        
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(imgObj.rotation * Math.PI / 180);
        ctx.drawImage(img, -img.width*scale/2, -img.height*scale/2, img.width*scale, img.height*scale);
        
        return {
            data: canvas.toDataURL('image/jpeg', quality),
            width: canvas.width,
            height: canvas.height
        };
    }

    calcDimensions(imgW, imgH, pageW, pageH, margin, mode) {
        const safeW = pageW - (margin * 2);
        const safeH = pageH - (margin * 2);
        const imgRatio = imgW / imgH;
        const pageRatio = safeW / safeH;
        
        let w = safeW, h = safeH;

        if (mode === 'fit') {
            if (imgRatio > pageRatio) h = safeW / imgRatio;
            else w = safeH * imgRatio;
        } else if (mode === 'cover') {
            // Logic for cover implies cropping, standard addImage doesn't crop easily 
            // without clipping masks. For simplicity, 'cover' acts like 'stretch' here 
            // or max-fill. Let's default to "Fill Area" logic.
             if (imgRatio > pageRatio) w = safeH * imgRatio;
             else h = safeW / imgRatio;
        }
        // 'stretch' uses full w/h
        
        return {
            x: margin + (safeW - w) / 2,
            y: margin + (safeH - h) / 2,
            w: w,
            h: h
        };
    }

    updateProgress(pct) {
        this.progressBar.style.width = `${pct}%`;
    }

    showToast(msg, type="success") {
        const t = document.createElement("div");
        t.className = `toast ${type}`;
        t.innerHTML = `<i class="fa-solid ${type==='success'?'fa-check':'fa-circle-exclamation'}"></i> ${msg}`;
        this.toastContainer.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }
}

// Init
let converter;
document.addEventListener('DOMContentLoaded', () => {
    converter = new ImageToPDFConverter();
    // Expose to window for onclick handlers in HTML string
    window.converter = converter; 
});
