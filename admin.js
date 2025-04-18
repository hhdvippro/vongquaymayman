document.addEventListener('DOMContentLoaded', function() {
    const previewCanvas = document.getElementById('wheel-preview');
    const previewCtx = previewCanvas.getContext('2d');
    const itemsContainer = document.getElementById('items-container');
    const addItemBtn = document.getElementById('add-item');
    const resetBtn = document.getElementById('reset-wheel');
    const fixedResultSelect = document.getElementById('fixed-result-select');
    const spinToFixedBtn = document.getElementById('spin-to-fixed');
    
    // Load cấu hình từ localStorage
    let wheelConfig = JSON.parse(localStorage.getItem('wheelConfig')) || {
        items: [
            { text: "Phần 1", weight: 1, color: "#FF6384" },
            { text: "Phần 2", weight: 1, color: "#36A2EB" },
            { text: "Phần 3", weight: 1, color: "#FFCE56" },
            { text: "Phần 4", weight: 1, color: "#4BC0C0" }
        ]
    };
    
    let previewRotation = 0;
    let isPreviewSpinning = false;
    let previewAnimation = null;
    
    // Lưu cấu hình
    function saveConfig() {
        localStorage.setItem('wheelConfig', JSON.stringify(wheelConfig));
    }
    
    // Vẽ bản xem trước
    function drawPreview() {
        const centerX = previewCanvas.width / 2;
        const centerY = previewCanvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        // Tính tổng trọng số
        const totalWeight = wheelConfig.items.reduce((sum, item) => sum + item.weight, 0);
        
        let startAngle = 0;
        
        wheelConfig.items.forEach((item, index) => {
            const sliceAngle = (2 * Math.PI) * (item.weight / totalWeight);
            const endAngle = startAngle + sliceAngle;
            
            // Vẽ phần
            previewCtx.beginPath();
            previewCtx.fillStyle = item.color;
            previewCtx.moveTo(centerX, centerY);
            previewCtx.arc(centerX, centerY, radius, startAngle, endAngle);
            previewCtx.closePath();
            previewCtx.fill();
            
            // Vẽ viền
            previewCtx.strokeStyle = "#fff";
            previewCtx.lineWidth = 1;
            previewCtx.stroke();
            
            startAngle = endAngle;
        });
    }
    
    // Render danh sách các mục
    function renderItemsList() {
        itemsContainer.innerHTML = '';
        
        wheelConfig.items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            
            itemDiv.innerHTML = `
                <input type="text" class="item-text" value="${item.text}" placeholder="Nội dung">
                <input type="color" class="item-color" value="${item.color}">
                <input type="number" class="item-weight" value="${item.weight}" min="1" placeholder="Tỉ lệ">
                <button class="remove-item">Xóa</button>
            `;
            
            itemsContainer.appendChild(itemDiv);
            
            // Thêm sự kiện thay đổi
            const textInput = itemDiv.querySelector('.item-text');
            const colorInput = itemDiv.querySelector('.item-color');
            const weightInput = itemDiv.querySelector('.item-weight');
            const removeBtn = itemDiv.querySelector('.remove-item');
            
            textInput.addEventListener('change', () => {
                wheelConfig.items[index].text = textInput.value;
                drawPreview();
                updateFixedResultSelect();
                saveConfig();
            });
            
            colorInput.addEventListener('change', () => {
                wheelConfig.items[index].color = colorInput.value;
                drawPreview();
                saveConfig();
            });
            
            weightInput.addEventListener('change', () => {
                wheelConfig.items[index].weight = Math.max(1, parseInt(weightInput.value) || 1);
                drawPreview();
                saveConfig();
            });
            
            removeBtn.addEventListener('click', () => {
                if (wheelConfig.items.length > 1) {
                    wheelConfig.items.splice(index, 1);
                    renderItemsList();
                    drawPreview();
                    updateFixedResultSelect();
                    saveConfig();
                } else {
                    alert('Vòng quay phải có ít nhất 1 mục!');
                }
            });
        });
    }
    
    // Cập nhật dropdown chọn kết quả cố định
    function updateFixedResultSelect() {
        fixedResultSelect.innerHTML = '';
        
        wheelConfig.items.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = item.text;
            fixedResultSelect.appendChild(option);
        });
    }
    
    // Quay bản xem trước đến mục chỉ định
    function spinPreviewTo(targetIndex) {
        if (isPreviewSpinning) {
            cancelAnimationFrame(previewAnimation);
        }
        
        isPreviewSpinning = true;
        
        const totalWeight = wheelConfig.items.reduce((sum, item) => sum + item.weight, 0);
        let cumulativeWeight = 0;
        for (let i = 0; i < targetIndex; i++) {
            cumulativeWeight += wheelConfig.items[i].weight;
        }
        
        const sliceAngle = (2 * Math.PI) * (wheelConfig.items[targetIndex].weight / totalWeight);
        const targetAngle = (2 * Math.PI) * (cumulativeWeight / totalWeight) + sliceAngle / 2;
        
        const spinDuration = 3000;
        const extraRotations = 3;
        const targetRotation = previewRotation + (extraRotations * 2 * Math.PI) + (2 * Math.PI - targetAngle);
        
        const startTime = performance.now();
        
        function animateSpin(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            const easing = (t) => {
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            };
            
            const easedProgress = easing(progress);
            previewRotation = easedProgress * (targetRotation - previewRotation) + previewRotation;
            
            previewCtx.save();
            previewCtx.translate(previewCanvas.width / 2, previewCanvas.height / 2);
            previewCtx.rotate(previewRotation);
            previewCtx.translate(-previewCanvas.width / 2, -previewCanvas.height / 2);
            drawPreview();
            previewCtx.restore();
            
            if (progress < 1) {
                previewAnimation = requestAnimationFrame(animateSpin);
            } else {
                isPreviewSpinning = false;
                
                setTimeout(() => {
                    alert(`Kết quả kiểm thử: ${wheelConfig.items[targetIndex].text}`);
                }, 500);
            }
        }
        
        previewAnimation = requestAnimationFrame(animateSpin);
    }
    
    // Sự kiện thêm mục mới
    addItemBtn.addEventListener('click', () => {
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC24A', '#F06292'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        wheelConfig.items.push({
            text: `Phần ${wheelConfig.items.length + 1}`,
            weight: 1,
            color: randomColor
        });
        
        renderItemsList();
        drawPreview();
        updateFixedResultSelect();
        saveConfig();
    });
    
    // Sự kiện đặt lại
    resetBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn đặt lại vòng quay về mặc định?')) {
            wheelConfig = {
                items: [
                    { text: "Phần 1", weight: 1, color: "#FF6384" },
                    { text: "Phần 2", weight: 1, color: "#36A2EB" },
                    { text: "Phần 3", weight: 1, color: "#FFCE56" },
                    { text: "Phần 4", weight: 1, color: "#4BC0C0" }
                ]
            };
            
            renderItemsList();
            drawPreview();
            updateFixedResultSelect();
            saveConfig();
        }
    });
    
    // Sự kiện quay đến kết quả chỉ định
    spinToFixedBtn.addEventListener('click', () => {
        const selectedIndex = parseInt(fixedResultSelect.value);
        if (!isNaN(selectedIndex) {
            spinPreviewTo(selectedIndex);
        }
    });
    
    // Khởi tạo ban đầu
    drawPreview();
    renderItemsList();
    updateFixedResultSelect();
});
