// 定义全局变量
let scene, camera, renderer, controls;
let surface, tangentPlane, gradientVector;
let currentFunction, currentPoint, currentFunctionValue;
let currentFx, currentFy;

// 函数定义
const functions = {
    function1: {
        name: 'f(x,y) = x² + y²',
        func: (x, y) => x*x + y*y,
        fx: (x, y) => 2*x,
        fy: (x, y) => 2*y,
        fxx: (x, y) => 2,
        fyy: (x, y) => 2,
        fxy: (x, y) => 0,
        range: [-3, 3]
    },
    function2: {
        name: 'f(x,y) = sin(x) + cos(y)',
        func: (x, y) => Math.sin(x) + Math.cos(y),
        fx: (x, y) => Math.cos(x),
        fy: (x, y) => -Math.sin(y),
        fxx: (x, y) => -Math.sin(x),
        fyy: (x, y) => -Math.cos(y),
        fxy: (x, y) => 0,
        range: [-Math.PI, Math.PI]
    },
    function3: {
        name: 'f(x,y) = x² - y²',
        func: (x, y) => x*x - y*y,
        fx: (x, y) => 2*x,
        fy: (x, y) => -2*y,
        fxx: (x, y) => 2,
        fyy: (x, y) => -2,
        fxy: (x, y) => 0,
        range: [-3, 3]
    },
    function4: {
        name: 'f(x,y) = e^(-(x²+y²))',
        func: (x, y) => Math.exp(-(x*x + y*y)),
        fx: (x, y) => -2*x*Math.exp(-(x*x + y*y)),
        fy: (x, y) => -2*y*Math.exp(-(x*x + y*y)),
        fxx: (x, y) => (-2 + 4*x*x)*Math.exp(-(x*x + y*y)),
        fyy: (x, y) => (-2 + 4*y*y)*Math.exp(-(x*x + y*y)),
        fxy: (x, y) => 4*x*y*Math.exp(-(x*x + y*y)),
        range: [-3, 3]
    }
};

// 初始化函数
function init() {
    // 初始化Three.js场景
    initThreeJS();
    
    // 初始化控件事件监听
    initEventListeners();
    
    // 设置默认函数和点
    currentFunction = functions.function1;
    currentPoint = { x: 1, y: 1 };
    
    // 更新可视化
    updateVisualization();
    
    // 初始化等高线图
    initContourPlot();
    
    // 初始化方向导数图
    initDirectionPlot();
}

// 初始化Three.js场景
function initThreeJS() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(document.getElementById('3d-plot').clientWidth, document.getElementById('3d-plot').clientHeight);
    document.getElementById('3d-plot').appendChild(renderer.domElement);
    
    // 添加轨道控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    
    // 添加坐标轴
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // 添加光源
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // 开始动画循环
    animate();
    
    // 处理窗口大小变化
    window.addEventListener('resize', onWindowResize);
}

// 窗口大小变化处理函数
function onWindowResize() {
    const container = document.getElementById('3d-plot');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// 初始化事件监听器
function initEventListeners() {
    // 函数选择
    document.getElementById('function-select').addEventListener('change', function(e) {
        currentFunction = functions[e.target.value];
        updateVisualization();
        updateContourPlot();
        updateDirectionPlot();
    });
    
    // x值滑块
    document.getElementById('x-value').addEventListener('input', function(e) {
        currentPoint.x = parseFloat(e.target.value);
        document.getElementById('x-value-display').textContent = currentPoint.x.toFixed(1);
        updateVisualization();
        updateDirectionPlot();
    });
    
    // y值滑块
    document.getElementById('y-value').addEventListener('input', function(e) {
        currentPoint.y = parseFloat(e.target.value);
        document.getElementById('y-value-display').textContent = currentPoint.y.toFixed(1);
        updateVisualization();
        updateDirectionPlot();
    });
    
    // 显示选项
    document.getElementById('show-surface').addEventListener('change', function(e) {
        if (surface) surface.visible = e.target.checked;
    });
    
    document.getElementById('show-tangent-plane').addEventListener('change', function(e) {
        if (tangentPlane) tangentPlane.visible = e.target.checked;
    });
    
    document.getElementById('show-gradient').addEventListener('change', function(e) {
        if (gradientVector) gradientVector.visible = e.target.checked;
        updateContourPlot();
    });
    
    document.getElementById('show-contour').addEventListener('change', function(e) {
        const contourPlot = document.getElementById('contour-plot');
        contourPlot.style.display = e.target.checked ? 'block' : 'none';
        if (e.target.checked) updateContourPlot();
    });
    
    // 方向导数控件
    document.getElementById('direction-angle').addEventListener('input', function(e) {
        const angle = parseFloat(e.target.value);
        document.getElementById('direction-angle-display').textContent = angle + '°';
        updateDirectionPlot();
    });
    
    // 添加比较点按钮
    document.getElementById('add-point').addEventListener('click', addComparisonPoint);
    
    // 清除比较点按钮
    document.getElementById('clear-points').addEventListener('click', clearComparisonPoints);
    
    // 曲率比较按钮
    document.getElementById('show-high-curvature').addEventListener('click', function() {
        showCurvatureComparison('high');
    });
    
    document.getElementById('show-low-curvature').addEventListener('click', function() {
        showCurvatureComparison('low');
    });
}

// 更新可视化
function updateVisualization() {
    // 移除旧的曲面和切平面
    if (surface) scene.remove(surface);
    if (tangentPlane) scene.remove(tangentPlane);
    if (gradientVector) scene.remove(gradientVector);
    
    // 创建新的曲面
    createSurface();
    
    // 创建切平面
    createTangentPlane();
    
    // 创建梯度向量
    createGradientVector();
    
    // 更新信息面板
    updateInfoPanel();
}

// 创建函数曲面
function createSurface() {
    const range = currentFunction.range;
    const resolution = 50;
    const step = (range[1] - range[0]) / resolution;
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    // 创建顶点
    for (let i = 0; i <= resolution; i++) {
        const x = range[0] + i * step;
        for (let j = 0; j <= resolution; j++) {
            const y = range[0] + j * step;
            const z = currentFunction.func(x, y);
            vertices.push(x, z, y); // 注意：Three.js中y是上方向，所以交换y和z
        }
    }
    
    // 创建索引（三角形）
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            const a = i * (resolution + 1) + j;
            const b = i * (resolution + 1) + j + 1;
            const c = (i + 1) * (resolution + 1) + j;
            const d = (i + 1) * (resolution + 1) + j + 1;
            
            indices.push(a, c, b);
            indices.push(c, d, b);
        }
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshPhongMaterial({
        color: 0x3498db,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        wireframe: false
    });
    
    surface = new THREE.Mesh(geometry, material);
    scene.add(surface);
}

// 创建切平面
function createTangentPlane() {
    const x0 = currentPoint.x;
    const y0 = currentPoint.y;
    const z0 = currentFunction.func(x0, y0);
    const fx0 = currentFunction.fx(x0, y0);
    const fy0 = currentFunction.fy(x0, y0);
    
    // 保存当前函数值和偏导数值
    currentFunctionValue = z0;
    currentFx = fx0;
    currentFy = fy0;
    
    // 切平面方程: z = z0 + fx0*(x-x0) + fy0*(y-y0)
    const size = 2;
    const geometry = new THREE.PlaneGeometry(size * 2, size * 2, 1, 1);
    
    // 调整平面顶点以匹配切平面方程
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i] + x0;
        const y = positions[i + 2] + y0; // 注意：Three.js中y是上方向，所以使用i+2
        const z = z0 + fx0 * (x - x0) + fy0 * (y - y0);
        positions[i] = x;
        positions[i + 1] = z; // 设置高度（z坐标）
        positions[i + 2] = y; // 设置y坐标
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshPhongMaterial({
        color: 0xe74c3c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
        wireframe: false
    });
    
    tangentPlane = new THREE.Mesh(geometry, material);
    scene.add(tangentPlane);
    
    // 添加一个点表示当前选择的点
    const pointGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.position.set(x0, z0, y0);
    tangentPlane.add(point);
}

// 创建梯度向量
function createGradientVector() {
    const x0 = currentPoint.x;
    const y0 = currentPoint.y;
    const z0 = currentFunction.func(x0, y0);
    const fx0 = currentFunction.fx(x0, y0);
    const fy0 = currentFunction.fy(x0, y0);
    
    // 创建一个箭头表示梯度向量
    const origin = new THREE.Vector3(x0, z0, y0);
    const direction = new THREE.Vector3(fx0, 0, fy0).normalize();
    const length = Math.sqrt(fx0*fx0 + fy0*fy0) * 0.5; // 缩放梯度向量长度
    
    const arrowHelper = new THREE.ArrowHelper(
        direction,
        origin,
        length,
        0x00ff00,
        0.2,
        0.1
    );
    
    gradientVector = arrowHelper;
    gradientVector.visible = document.getElementById('show-gradient').checked;
    scene.add(gradientVector);
}

// 更新信息面板
function updateInfoPanel() {
    const x0 = currentPoint.x;
    const y0 = currentPoint.y;
    const z0 = currentFunctionValue;
    const fx0 = currentFx;
    const fy0 = currentFy;
    
    document.getElementById('function-value').textContent = z0.toFixed(4);
    document.getElementById('fx-value').textContent = fx0.toFixed(4);
    document.getElementById('fy-value').textContent = fy0.toFixed(4);
    
    const tangentPlaneEquation = `z = ${z0.toFixed(2)} + ${fx0.toFixed(2)}(x - ${x0.toFixed(2)}) + ${fy0.toFixed(2)}(y - ${y0.toFixed(2)})`;
    document.getElementById('tangent-plane-equation').textContent = tangentPlaneEquation;
}

// 初始化等高线图
function initContourPlot() {
    // 初始时隐藏等高线图
    document.getElementById('contour-plot').style.display = 'none';
    updateContourPlot();
}

// 更新等高线图
function updateContourPlot() {
    if (!document.getElementById('show-contour').checked) return;
    
    const range = currentFunction.range;
    const resolution = 50;
    const step = (range[1] - range[0]) / resolution;
    
    // 生成数据
    const x = [];
    const y = [];
    const z = [];
    
    for (let i = 0; i <= resolution; i++) {
        const xVal = range[0] + i * step;
        x.push(xVal);
    }
    
    for (let j = 0; j <= resolution; j++) {
        const yVal = range[0] + j * step;
        y.push(yVal);
    }
    
    for (let i = 0; i <= resolution; i++) {
        const row = [];
        for (let j = 0; j <= resolution; j++) {
            row.push(currentFunction.func(x[i], y[j]));
        }
        z.push(row);
    }
    
    // 创建等高线图
    const data = [{
        x: x,
        y: y,
        z: z,
        type: 'contour',
        contours: {
            coloring: 'heatmap'
        },
        colorscale: 'Viridis'
    }];
    
    // 如果显示梯度，添加梯度向量
    if (document.getElementById('show-gradient').checked) {
        const x0 = currentPoint.x;
        const y0 = currentPoint.y;
        const fx0 = currentFunction.fx(x0, y0);
        const fy0 = currentFunction.fy(x0, y0);
        
        // 添加梯度向量
        data.push({
            x: [x0, x0 + fx0 * 0.5],
            y: [y0, y0 + fy0 * 0.5],
            mode: 'lines+markers',
            line: {
                color: 'green',
                width: 3
            },
            marker: {
                size: [8, 0],
                color: 'red'
            },
            showlegend: false
        });
    }
    
    const layout = {
        title: '函数等高线图',
        xaxis: {
            title: 'x',
            range: range
        },
        yaxis: {
            title: 'y',
            range: range
        },
        margin: {
            l: 50,
            r: 50,
            b: 50,
            t: 50,
            pad: 4
        }
    };
    
    Plotly.newPlot('contour-plot', data, layout, {responsive: true});
}

// 初始化方向导数图
function initDirectionPlot() {
    updateDirectionPlot();
}

// 更新方向导数图
function updateDirectionPlot() {
    const angle = parseFloat(document.getElementById('direction-angle').value) * Math.PI / 180;
    const x0 = currentPoint.x;
    const y0 = currentPoint.y;
    const fx0 = currentFunction.fx(x0, y0);
    const fy0 = currentFunction.fy(x0, y0);
    
    // 计算方向导数
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const directionalDerivative = fx0 * ux + fy0 * uy;
    
    document.getElementById('dir-derivative').textContent = directionalDerivative.toFixed(4);
    
    // 创建方向导数图
    const angles = [];
    const derivatives = [];
    
    for (let a = 0; a < 360; a += 5) {
        const rad = a * Math.PI / 180;
        const ux = Math.cos(rad);
        const uy = Math.sin(rad);
        const derivative = fx0 * ux + fy0 * uy;
        
        angles.push(a);
        derivatives.push(derivative);
    }
    
    // 添加当前选择的方向
    const currentAngle = parseFloat(document.getElementById('direction-angle').value);
    
    const data = [
        {
            r: derivatives,
            theta: angles,
            type: 'scatterpolar',
            mode: 'lines',
            name: '方向导数',
            line: {
                color: 'blue'
            }
        },
        {
            r: [directionalDerivative],
            theta: [currentAngle],
            type: 'scatterpolar',
            mode: 'markers',
            name: '当前方向',
            marker: {
                size: 10,
                color: 'red'
            }
        }
    ];
    
    const layout = {
        title: '方向导数极坐标图',
        polar: {
            radialaxis: {
                visible: true,
                range: [Math.min(...derivatives) * 1.2, Math.max(...derivatives) * 1.2]
            }
        },
        showlegend: true,
        margin: {
            l: 50,
            r: 50,
            b: 50,
            t: 50,
            pad: 4
        }
    };
    
    Plotly.newPlot('direction-plot', data, layout, {responsive: true});
}

// 添加比较点
function addComparisonPoint() {
    const x0 = currentPoint.x;
    const y0 = currentPoint.y;
    const z0 = currentFunctionValue;
    const fx0 = currentFx;
    const fy0 = currentFy;
    
    // 随机生成一个附近的点
    const dx = (Math.random() - 0.5) * 0.5;
    const dy = (Math.random() - 0.5) * 0.5;
    const x = x0 + dx;
    const y = y0 + dy;
    
    // 计算实际函数值
    const actualValue = currentFunction.func(x, y);
    
    // 计算切平面近似值
    const approximateValue = z0 + fx0 * (x - x0) + fy0 * (y - y0);
    
    // 计算误差
    const error = Math.abs(actualValue - approximateValue);
    
    // 添加到表格
    const tbody = document.getElementById('approximation-data');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>(${x.toFixed(2)}, ${y.toFixed(2)})</td>
        <td>${actualValue.toFixed(4)}</td>
        <td>${approximateValue.toFixed(4)}</td>
        <td>${error.toFixed(4)}</td>
    `;
    
    tbody.appendChild(row);
}

// 清除比较点
function clearComparisonPoints() {
    document.getElementById('approximation-data').innerHTML = '';
}

// 显示曲率比较
function showCurvatureComparison(type) {
    let highCurvaturePoint, lowCurvaturePoint;
    
    // 根据当前函数找出高曲率和低曲率点
    if (currentFunction === functions.function1) {
        highCurvaturePoint = { x: 2.5, y: 2.5 };
        lowCurvaturePoint = { x: 0.5, y: 0.5 };
    } else if (currentFunction === functions.function2) {
        highCurvaturePoint = { x: Math.PI/2, y: 0 };
        lowCurvaturePoint = { x: 0, y: 0 };
    } else if (currentFunction === functions.function3) {
        highCurvaturePoint = { x: 2.5, y: 2.5 };
        lowCurvaturePoint = { x: 0.5, y: 0.5 };
    } else if (currentFunction === functions.function4) {
        highCurvaturePoint = { x: 0.7, y: 0.7 };
        lowCurvaturePoint = { x: 2.0, y: 2.0 };
    }
    
    // 设置当前点为高曲率或低曲率点
    if (type === 'high') {
        document.getElementById('x-value').value = highCurvaturePoint.x;
        document.getElementById('y-value').value = highCurvaturePoint.y;
        document.getElementById('x-value-display').textContent = highCurvaturePoint.x.toFixed(1);
        document.getElementById('y-value-display').textContent = highCurvaturePoint.y.toFixed(1);
        currentPoint = highCurvaturePoint;
    } else {
        document.getElementById('x-value').value = lowCurvaturePoint.x;
        document.getElementById('y-value').value = lowCurvaturePoint.y;
        document.getElementById('x-value-display').textContent = lowCurvaturePoint.x.toFixed(1);
        document.getElementById('y-value-display').textContent = lowCurvaturePoint.y.toFixed(1);
        currentPoint = lowCurvaturePoint;
    }
    
    // 更新可视化
    updateVisualization();
    updateContourPlot();
    updateDirectionPlot();
    
    // 清除并添加几个比较点
    clearComparisonPoints();
    for (let i = 0; i < 5; i++) {
        addComparisonPoint();
    }
    
    // 创建曲率比较图
    createCurvatureComparisonPlot(type);
}

// 创建曲率比较图
function createCurvatureComparisonPlot(type) {
    const x0 = currentPoint.x;
    const y0 = currentPoint.y;
    const z0 = currentFunctionValue;
    const fx0 = currentFx;
    const fy0 = currentFy;
    
    // 生成一条穿过当前点的曲线
    const points = 100;
    const range = 1;
    const xValues = [];
    const actualValues = [];
    const approximateValues = [];
    
    for (let i = 0; i < points; i++) {
        const t = -range + 2 * range * i / (points - 1);
        const x = x0 + t;
        const y = y0;
        
        xValues.push(t);
        actualValues.push(currentFunction.func(x, y));
        approximateValues.push(z0 + fx0 * (x - x0) + fy0 * (y - y0));
    }
    
    const data = [
        {
            x: xValues,
            y: actualValues,
            type: 'scatter',
            mode: 'lines',
            name: '实际函数值',
            line: {
                color: 'blue',
                width: 2
            }
        },
        {
            x: xValues,
            y: approximateValues,
            type: 'scatter',
            mode: 'lines',
            name: '切平面近似值',
            line: {
                color: 'red',
                width: 2,
                dash: 'dash'
            }
        }
    ];
    
    const layout = {
        title: type === 'high' ? '高曲率点的近似精度' : '低曲率点的近似精度',
        xaxis: {
            title: 'x - x₀',
            zeroline: true
        },
        yaxis: {
            title: 'z',
            zeroline: true
        },
        legend: {
            x: 0,
            y: 1
        },
        margin: {
            l: 50,
            r: 50,
            b: 50,
            t: 50,
            pad: 4
        }
    };
    
    Plotly.newPlot('curvature-comparison', data, layout, {responsive: true});
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);