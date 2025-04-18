document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spin-btn');
    const itemsContainer = document.getElementById('items-container');
    const addItemBtn = document.getElementById('add-item');
    const resetBtn = document.getElementById('reset-wheel');
    const fixedResultSelect = document.getElementById('fixed-result-select');
    const spinToFixedBtn = document.getElementById('spin-to-fixed');
    
    let wheelItems = [
        { text: "Phần 1", weight: 1, color: "#FF6384" },
        { text: "Phần 2", weight: 1, color: "#36A2EB" },
        { text: "Phần 3", weight: 1, color: "#FFCE56" },
        { text: "Phần 4", weight: 1, color: "#4BC0C0" }
    ];
    
    let isSpinning = false;
    let currentRotation = 0;
    let targetRotation = 0;
    let spinAnimation = null;
    
    // Khởi tạo vòng quay
    function initWheel() {
        drawWheel();
        renderItemsList();
        updateFixedResultSelect();
    }
    
    // Vẽ vòng quay
    function drawWheel() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Tính tổng trọng số
        const totalWeight = wheelItems.reduce((sum, item) => sum + item.weight, 0);
        
        let startAngle = 0;
        
        wheelItems.forEach((item, index) => {
            const sliceAngle = (2 * Math.PI) * (item.weight / totalWeight);
            const endAngle = startAngle + sliceAngle;
            
            // Vẽ phần
            ctx.beginPath();
            ctx.fillStyle = item.color;
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            
            // Vẽ viền
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Vẽ text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px Arial";
            
            // Điều chỉnh vị trí text
            const textRadius = radius - 50;
            ctx.fillText(item.text, textRadius, 5);
            ctx.restore();
            
            startAngle = endAngle;
        });
    }
    
    // Render danh sách các mục
    function renderItemsList() {
        itemsContainer.innerHTML = '';
        
        wheelItems.forEach((item, index) => {
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
                wheelItems[index].text = textInput.value;
                drawWheel();
                updateFixedResultSelect();
            });
            
            colorInput.addEventListener('change', () => {
                wheelItems[index].color = colorInput.value;
                drawWheel();
            });
            
            weightInput.addEventListener('change', () => {
                wheelItems[index].weight = Math.max(1, parseInt(weightInput.value) || 1);
                drawWheel();
            });
            
            removeBtn.addEventListener('click', () => {
                if (wheelItems.length > 1) {
                    wheelItems.splice(index, 1);
                    renderItemsList();
                    drawWheel();
                    updateFixedResultSelect();
                } else {
                    alert('Vòng quay phải có ít nhất 1 mục!');
                }
            });
        });
    }
    
    // Cập nhật dropdown chọn kết quả cố định
    function updateFixedResultSelect() {
        fixedResultSelect.innerHTML = '';
        
        wheelItems.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = item.text;
            fixedResultSelect.appendChild(option);
        });
    }
    
    // Quay vòng quay
    function spinWheel(targetIndex = null) {
        if (isSpinning) return;
        
        isSpinning = true;
        spinBtn.style.pointerEvents = 'none';
        
        // Tính toán góc quay
        const totalWeight = wheelItems.reduce((sum, item) => sum + item.weight, 0);
        
        let targetAngle;
        if (targetIndex !== null) {
            // Quay đến mục chỉ định
            let cumulativeWeight = 0;
            for (let i = 0; i < targetIndex; i++) {
                cumulativeWeight += wheelItems[i].weight;
            }
            
            const sliceAngle = (2 * Math.PI) * (wheelItems[targetIndex].weight / totalWeight);
            targetAngle = (2 * Math.PI) * (cumulativeWeight / totalWeight) + sliceAngle / 2;
        } else {
            // Quay ngẫu nhiên
            const random = Math.random() * totalWeight;
            let cumulativeWeight = 0;
            let selectedIndex = 0;
            
            for (let i = 0; i < wheelItems.length; i++) {
                cumulativeWeight += wheelItems[i].weight;
                if (random <= cumulativeWeight) {
                    selectedIndex = i;
                    break;
                }
            }
            
            let cumulativeWeightBefore = 0;
            for (let i = 0; i < selectedIndex; i++) {
                cumulativeWeightBefore += wheelItems[i].weight;
            }
            
            const sliceAngle = (2 * Math.PI) * (wheelItems[selectedIndex].weight / totalWeight);
            targetAngle = (2 * Math.PI) * (cumulativeWeightBefore / totalWeight) + sliceAngle / 2;
        }
        
        // Thêm nhiều vòng quay trước khi dừng
        const spinDuration = 5000; // 5 giây
        const extraRotations = 5; // 5 vòng quay thêm
        targetRotation = currentRotation + (extraRotations * 2 * Math.PI) + (2 * Math.PI - targetAngle);
        
        const startTime = performance.now();
        
        function animateSpin(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            // Easing function để tạo hiệu ứng giảm tốc
            const easing = (t) => {
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            };
            
            const easedProgress = easing(progress);
            currentRotation = easedProgress * (targetRotation - currentRotation) + currentRotation;
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(currentRotation);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            drawWheel();
            ctx.restore();
            
            if (progress < 1) {
                spinAnimation = requestAnimationFrame(animateSpin);
            } else {
                isSpinning = false;
                spinBtn.style.pointerEvents = 'auto';
                
                // Hiển thị kết quả
                const finalAngle = (2 * Math.PI) - (currentRotation % (2 * Math.PI));
                let cumulativeWeight = 0;
                let selectedIndex = 0;
                const totalWeight = wheelItems.reduce((sum, item) => sum + item.weight, 0);
                
                for (let i = 0; i < wheelItems.length; i++) {
                    const sliceAngle = (2 * Math.PI) * (wheelItems[i].weight / totalWeight);
                    if (finalAngle >= cumulativeWeight && finalAngle < cumulativeWeight + sliceAngle) {
                        selectedIndex = i;
                        break;
                    }
                    cumulativeWeight += sliceAngle;
                }
                
                setTimeout(() => {
                    alert(`Kết quả: ${wheelItems[selectedIndex].text}`);
                }, 500);
            }
        }
        
        spinAnimation = requestAnimationFrame(animateSpin);
    }
    
    // Sự kiện nút quay
    spinBtn.addEventListener('click', () => {
        spinWheel();
    });
    
    // Sự kiện thêm mục mới
    addItemBtn.addEventListener('click', () => {
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC24A', '#F06292'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        wheelItems.push({
            text: `Phần ${wheelItems.length + 1}`,
            weight: 1,
            color: randomColor
        });
        
        renderItemsList();
        drawWheel();
        updateFixedResultSelect();
    });
    
    // Sự kiện đặt lại
    resetBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn đặt lại vòng quay?')) {
            cancelAnimationFrame(spinAnimation);
            isSpinning = false;
            currentRotation = 0;
            spinBtn.style.pointerEvents = 'auto';
            
            wheelItems = [
                { text: "Phần 1", weight: 1, color: "#FF6384" },
                { text: "Phần 2", weight: 1, color: "#36A2EB" },
                { text: "Phần 3", weight: 1, color: "#FFCE56" },
                { text: "Phần 4", weight: 1, color: "#4BC0C0" }
            ];
            
            initWheel();
        }
    });
    
    // Sự kiện quay đến kết quả chỉ định
    spinToFixedBtn.addEventListener('click', () => {
        const selectedIndex = parseInt(fixedResultSelect.value);
        if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < wheelItems.length) {
            spinWheel(selectedIndex);
        }
    });
    
    // Khởi tạo ban đầu
    initWheel();
});
