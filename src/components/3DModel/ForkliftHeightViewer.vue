<template>
    <div class="forklift-height-viewer">
        <div v-show="isVisible" ref="container" class="viewer-container"></div>
        <div class="height-indicator">
            <span>牙叉高度: {{ currentHeight }} mm</span>
        </div>
        <div v-if="!isInitialized" class="loading-indicator"> 正在初始化 3D 場景... </div>
    </div>
</template>
<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default {
    name: 'ForkliftHeightViewer',
    props: {
        height: {
            type: Number,
            default: 0
        }
    },
    data() {
        return {
            currentHeight: 0,
            animationFrameId: null,
            isInitialized: false,
            initAttempts: 0,
            maxInitAttempts: 20,
            isActive: false,
            initTimer: null,
            isVisible: false,
            observer: null
        };
    },
    watch: {
        height(newHeight) {
            this.currentHeight = newHeight;
            if (this.isInitialized && this.isActive) {
                this.updateForkliftHeight(newHeight);
            }
        }
    },
    mounted() {
        console.log('Component mounted');
        this.setupVisibilityObserver();
    },
    activated() {
        console.log('Component activated');
        this.isActive = true;
        this.checkVisibility();
    },
    deactivated() {
        console.log('Component deactivated');
        this.isActive = false;
        this.stopAnimation();
    },
    beforeDestroy() {
        console.log('Component beforeDestroy');
        this.isActive = false;
        this.cleanup();
        if (this.observer) {
            this.observer.disconnect();
        }
    },
    methods: {
        setupVisibilityObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    this.isVisible = entry.isIntersecting;
                    if (this.isVisible && !this.isInitialized) {
                        this.startInitialization();
                    }
                });
            }, {
                threshold: 0.1
            });

            this.$nextTick(() => {
                if (this.$el) {
                    this.observer.observe(this.$el);
                }
            });
        },
        checkVisibility() {
            if (this.$el) {
                const rect = this.$el.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                this.isVisible = isVisible;
                if (isVisible && !this.isInitialized) {
                    this.startInitialization();
                }
            }
        },
        startInitialization() {
            console.log('Starting initialization');
            this.initAttempts = 0;
            this.initialize();
        },
        async initialize() {
            console.log(`Initialization attempt ${this.initAttempts + 1}/${this.maxInitAttempts}`);

            if (!this.isActive || !this.isVisible) {
                console.log('Component is not active or visible, stopping initialization');
                return;
            }

            if (this.initAttempts >= this.maxInitAttempts) {
                console.error('Maximum initialization attempts reached');
                return;
            }

            this.initAttempts++;

            if (!this.$refs.container) {
                console.warn('Container not found, retrying...');
                this.scheduleRetry();
                return;
            }

            try {
                await this.$nextTick();

                const container = this.$refs.container;
                console.log('Container dimensions:', {
                    width: container.clientWidth,
                    height: container.clientHeight
                });

                if (container.clientWidth === 0 || container.clientHeight === 0) {
                    console.warn('Container has no size, retrying...');
                    this.scheduleRetry();
                    return;
                }

                this.initScene();
                this.createForklift();
                this.animate();
                this.isInitialized = true;
                window.addEventListener('resize', this.onWindowResize);

                console.log('Initialization successful');
            } catch (error) {
                console.error('Initialization error:', error);
                this.scheduleRetry();
            }
        },
        scheduleRetry() {
            if (this.initTimer) {
                clearTimeout(this.initTimer);
            }
            this.initTimer = setTimeout(() => {
                if (this.isActive && this.isVisible) {
                    this.initialize();
                }
            }, 100);
        },
        stopAnimation() {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            if (this.initTimer) {
                clearTimeout(this.initTimer);
                this.initTimer = null;
            }
        },
        initScene() {
            console.log('Initializing scene');

            // 清理現有場景
            if (this.scene) {
                this.cleanup();
            }

            // 創建場景
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xf0f0f0);

            // 創建相機
            this.camera = new THREE.PerspectiveCamera(
                45,
                this.$refs.container.clientWidth / this.$refs.container.clientHeight,
                0.1,
                1000
            );
            this.camera.position.set(3, 3, 3);
            this.camera.lookAt(0, 0, 0);

            // 創建渲染器
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(
                this.$refs.container.clientWidth,
                this.$refs.container.clientHeight
            );
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;

            // 清除容器並添加新的渲染器
            this.$refs.container.innerHTML = '';
            this.$refs.container.appendChild(this.renderer.domElement);

            // 添加軌道控制器
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.target.set(0, 0, 0);

            // 添加光源
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 5, 5);
            directionalLight.castShadow = true;
            this.scene.add(directionalLight);

            // 添加網格輔助線
            const gridHelper = new THREE.GridHelper(10, 10);
            this.scene.add(gridHelper);

            // 添加坐標軸輔助線
            const axesHelper = new THREE.AxesHelper(2);
            this.scene.add(axesHelper);
        },
        createForklift() {
            // 創建立柱
            const pillarGeometry = new THREE.BoxGeometry(0.8, 4, 0.8);
            const pillarMaterial = new THREE.MeshPhongMaterial({
                color: 0x2c5a7c,  // 藍色
                shininess: 30
            });
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(0, 2, 0);
            pillar.castShadow = true;
            pillar.receiveShadow = true;

            // 創建底座
            const baseGeometry = new THREE.BoxGeometry(1.74, 0.4, 0.83);
            const baseMaterial = new THREE.MeshPhongMaterial({
                color: 0x2c5a7c  // 藍色
            });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.set(0, 0.2, 0);
            base.castShadow = true;
            base.receiveShadow = true;

            // 創建叉子
            const forkGeometry = new THREE.BoxGeometry(0.3, 0.15, 2);
            const forkMaterial = new THREE.MeshPhongMaterial({
                color: 0x8b2c8c  // 紫色
            });

            const leftFork = new THREE.Mesh(forkGeometry, forkMaterial);
            leftFork.position.set(-0.4, 0.5, 0.5);

            const rightFork = new THREE.Mesh(forkGeometry, forkMaterial);
            rightFork.position.set(0.4, 0.5, 0.5);

            // 組裝叉車
            this.forklift = new THREE.Group();
            this.forklift.add(pillar);
            this.forklift.add(base);
            this.forklift.add(leftFork);
            this.forklift.add(rightFork);

            // 調整整體位置和方向
            this.forklift.rotation.y = Math.PI / 4;
            this.forklift.position.y = -0.3;

            this.scene.add(this.forklift);
        },
        updateForkliftHeight(height) {
            if (!this.forklift || !this.forklift.children || this.forklift.children.length < 4) {
                console.warn('Forklift not ready for height update');
                return;
            }

            const normalizedHeight = (height / 2000) * 2;
            const leftFork = this.forklift.children[2];
            const rightFork = this.forklift.children[3];

            if (leftFork && rightFork) {
                leftFork.position.y = 0.5 + normalizedHeight;
                rightFork.position.y = 0.5 + normalizedHeight;
            }
        },
        animate() {
            if (!this.isActive || !this.scene || !this.camera || !this.renderer) {
                console.warn('Scene not ready for animation or component is not active');
                return;
            }

            this.animationFrameId = requestAnimationFrame(this.animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        },
        onWindowResize() {
            if (!this.camera || !this.renderer || !this.$refs.container) {
                console.warn('Components not ready for resize');
                return;
            }

            this.camera.aspect = this.$refs.container.clientWidth / this.$refs.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(
                this.$refs.container.clientWidth,
                this.$refs.container.clientHeight
            );
        },
        cleanup() {
            window.removeEventListener('resize', this.onWindowResize);

            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            if (this.renderer) {
                this.renderer.dispose();
                this.renderer.forceContextLoss();
            }

            if (this.scene) {
                this.scene.traverse((object) => {
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
            }

            // 清除所有引用
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.controls = null;
            this.forklift = null;
            this.isInitialized = false;
        }
    }
};
</script>
<style scoped>
.forklift-height-viewer {
    width: 100%;
    height: 400px;
    position: relative;
}

.viewer-container {
    width: 100%;
    height: 100%;
}

.height-indicator {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
}

.loading-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 14px;
}
</style>