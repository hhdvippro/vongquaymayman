// Biến lưu cấu hình vòng quay
let wheelConfig = JSON.parse(localStorage.getItem('wheelConfig')) || {
    items: [
        { text: "Phần 1", weight: 1, color: "#FF6384" },
        { text: "Phần 2", weight: 1, color: "#36A2EB" },
        { text: "Phần 3", weight: 1, color: "#FFCE56" },
        { text: "Phần 4", weight: 1, color: "#4BC0C0" }
    ]
};

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('wheel');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spin-btn');
    
    let isSpinning = false;
    let currentRotation = 0;
    let targetRotation = 0;
    let spinAnimation = null;
    
    // Vẽ vòng quay
    function drawWheel() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Tính tổng trọng số
        const totalWeight = wheelConfig.items.reduce((sum, item) => sum + item.weight, 0);
        
        let startAngle = 0;
        
        wheelConfig.items.forEach((item, index) => {
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
    
    // Quay vòng quay
    function spinWheel() {
        if (isSpinning) return;
        
        isSpinning = true;
        spinBtn.style.pointerEvents = 'none';
        
        // Tính toán góc quay
        const totalWeight = wheelConfig.items.reduce((sum, item) => sum + item.weight, 0);
        const random = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        let selectedIndex = 0;
        
        for (let i = 0; i < wheelConfig.items.length; i++) {
            cumulativeWeight += wheelConfig.items[i].weight;
            if (random <= cumulativeWeight) {
                selectedIndex = i;
                break;
            }
        }
        
        let cumulativeWeightBefore = 0;
        for (let i = 0; i < selectedIndex; i++) {
            cumulativeWeightBefore += wheelConfig.items[i].weight;
        }
        
        const sliceAngle = (2 * Math.PI) * (wheelConfig.items[selectedIndex].weight / totalWeight);
        const targetAngle = (2 * Math.PI) * (cumulativeWeightBefore / totalWeight) + sliceAngle / 2;
        
        // Thêm nhiều vòng quay trước khi dừng
        const spinDuration = 5000;
        const extraRotations = 5;
        targetRotation = currentRotation + (extraRotations * 2 * Math.PI) + (2 * Math.PI - targetAngle);
        
        const startTime = performance.now();
        
        function animateSpin(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
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
                setTimeout(() => {
                    alert(`Kết quả: ${wheelConfig.items[selectedIndex].text}`);
                }, 500);
            }
        }
        
        spinAnimation = requestAnimationFrame(animateSpin);
    }
    
    // Sự kiện nút quay
    spinBtn.addEventListener('click', spinWheel);
    
    // Khởi tạo ban đầu
    drawWheel();
});
