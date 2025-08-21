class KokoApp {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.currentStream = null;
        this.scanHistory = JSON.parse(localStorage.getItem('scanHistory') || '[]');
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.currentLanguage = localStorage.getItem('language') || 'ko';
        this.isLoading = false;
        this.recognition = null;
        
        // 바코드 스캐너 관련
        this.html5QrcodeScanner = null;
        this.isScanning = false;
        
        // 다크모드 설정
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        // 번역 시스템
        this.translations = {
            ko: {
                searchPlaceholder: "상품명이나 바코드를 검색하세요",
                welcome: "한국 상품을 쉽게 알아보세요!",
                welcomeDesc: "카메라로 찍거나 바코드를 스캔하면<br>AI가 상품 정보를 분석해드립니다.",
                analyzedProducts: "분석된 상품",
                accuracy: "정확도 %",
                scanMethod: "스캔 방법 선택",
                scanMethodDesc: "원하는 방법으로 상품을 스캔해보세요",
                photoScan: "사진으로 스캔",
                photoScanDesc: "카메라로 상품 촬영",
                barcodeScan: "바코드 스캔",
                barcodeScanDesc: "바코드로 빠른 인식",
                recentScans: "최근 스캔 기록",
                popularCategories: "인기 상품 카테고리",
                categoriesDesc: "관광객들이 많이 찾는 한국 상품들",
                tip: "팁:",
                tipDesc: "밝은 곳에서 촬영하면 더 정확한 분석이 가능해요!",
                analyzing: "AI가 분석 중입니다",
                recognizing: "상품을 인식하고 있어요...",
                home: "홈",
                favorites: "찜",
                camera: "카메라",
                viewAll: "전체보기",
                noScans: "아직 스캔 기록이 없습니다.",
                scanProduct: "상품을 스캔해보세요!",
                productAnalysis: "상품 분석 결과",
                productDesc: "상품 설명",
                nutritionInfo: "영양 정보",
                addFavorites: "찜하기",
                share: "공유하기",
                calories: "칼로리:",
                fat: "지방:",
                sodium: "나트륨:",
                carbs: "탄수화물:",
                close: "닫기",
                categoryExplore: "카테고리의 인기 상품들을 확인해보세요.",
                favoritesTitle: "찜한 상품",
                noFavorites: "찜한 상품이 없습니다.",
                startFavoriting: "마음에 드는 상품을 찜해보세요!",
                removeFavorite: "찜 해제",
                themeLight: "라이트 모드",
                themeDark: "다크 모드"
            }
        };
        
        this.init();
    }

    init() {
        console.log('KokoApp 초기화 시작...');
        
        if (document.readyState !== 'loading') {
            console.log('DOM 이미 로드됨 - 즉시 초기화');
            this.initializeApp();
        } else {
            console.log('DOM 로딩 대기 중...');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOMContentLoaded 이벤트 발생');
                this.initializeApp();
            });
        }
    }

    initializeApp() {
        try {
            console.log('앱 초기화 진행...');
            
            this.showSplashScreen();
            
            setTimeout(() => {
                this.setupEventListeners();
                this.loadScanHistory();
                this.loadFavorites();
                this.setupLanguage();
                this.setupTheme();
                this.animateCounters();
                this.setupVoiceSearch();
                
                console.log('✅ 앱 초기화 완료');
            }, 500);
            
        } catch (error) {
            console.error('앱 초기화 중 오류:', error);
            this.showErrorMessage('앱을 초기화하는 중 오류가 발생했습니다.');
        }
    }

    showSplashScreen() {
        console.log('스플래시 스크린 표시');
        const splashScreen = document.getElementById('splashScreen');
        
        if (!splashScreen) {
            console.warn('스플래시 스크린 요소를 찾을 수 없습니다.');
            this.forceShowUI();
            return;
        }
        
        setTimeout(() => {
            splashScreen.style.animation = 'splashFadeOut 1s ease-in-out forwards';
        }, 3000);
        
        setTimeout(() => {
            splashScreen.remove();
            const appContainer = document.getElementById('appContainer');
            if (appContainer) {
                appContainer.style.opacity = '1';
                appContainer.style.visibility = 'visible';
            }
        }, 4000);
        
        setTimeout(() => {
            this.forceShowUI();
        }, 4500);
    }

    forceShowUI() {
        console.log('UI 강제 표시');
        document.querySelectorAll('.fade-in-up').forEach(element => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
        
        const appContainer = document.getElementById('appContainer');
        if (appContainer) {
            appContainer.style.opacity = '1';
            appContainer.style.visibility = 'visible';
        }
    }

    setupEventListeners() {
        console.log('이벤트 리스너 설정 시작...');
        
        try {
            // 스캔 버튼 이벤트
            this.bindEventSafely('photoScan', 'click', (e) => {
                console.log('사진 스캔 버튼 클릭됨');
                this.addClickEffect(e.currentTarget);
                setTimeout(() => this.startCamera(), 200);
            });

            this.bindEventSafely('barcodeScan', 'click', (e) => {
                console.log('바코드 스캔 버튼 클릭됨');
                this.addClickEffect(e.currentTarget);
                setTimeout(() => this.startBarcodeScanner(), 200);
            });

            // 카메라 네비게이션 버튼
            this.bindEventSafely('cameraNavBtn', 'click', (e) => {
                console.log('카메라 네비게이션 버튼 클릭됨');
                this.addClickEffect(e.currentTarget);
                this.switchTab(e.currentTarget);
                setTimeout(() => this.startCamera(), 200);
            });

            // 카메라 제어 버튼
            this.bindEventSafely('captureBtn', 'click', (e) => {
                console.log('촬영 버튼 클릭됨');
                this.addClickEffect(e.currentTarget, 'capture');
                this.capturePhoto();
            });

            this.bindEventSafely('closeCamera', 'click', (e) => {
                console.log('카메라 닫기 버튼 클릭됨');
                this.addClickEffect(e.currentTarget);
                this.stopCamera();
            });

            this.bindEventSafely('switchCamera', 'click', (e) => {
                console.log('카메라 전환 버튼 클릭됨');
                this.addClickEffect(e.currentTarget);
                this.switchCamera();
            });

            // 결과 닫기
            this.bindEventSafely('closeResult', 'click', (e) => {
                console.log('결과 닫기 버튼 클릭됨');
                this.addClickEffect(e.currentTarget);
                this.closeResults();
            });

            // 바코드 입력 관련 이벤트
            this.bindEventSafely('closeBarcodeInput', 'click', (e) => {
                console.log('바코드 입력 닫기 버튼 클릭됨');
                this.addClickEffect(e.currentTarget);
                this.closeBarcodeInput();
            });

            this.bindEventSafely('submitBarcode', 'click', (e) => {
                console.log('바코드 제출 버튼 클릭됨');
                this.addClickEffect(e.currentTarget);
                this.submitBarcodeManual();
            });

            // 바코드 카메라 스캔 버튼
            this.bindEventSafely('startBarcodeCamera', 'click', (e) => {
                console.log('바코드 카메라 버튼 클릭됨');
                this.addClickEffect(e.currentTarget);
                if (this.isScanning) {
                    this.stopBarcodeCamera();
                } else {
                    this.startBarcodeCamera();
                }
            });

            // 바코드 수동 입력
            this.bindEventSafely('barcodeManualInput', 'keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitBarcodeManual();
                }
                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                    e.preventDefault();
                }
            });

            // 입력 방법 전환
            this.bindEventsSafely('.input-method', 'click', (e) => {
                this.switchInputMethod(e.currentTarget);
            });

            // 검색 기능
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.handleSearch(e.target.value);
                });

                searchInput.addEventListener('focus', () => {
                    const searchBox = document.querySelector('.search-box');
                    if (searchBox) searchBox.style.transform = 'scale(1.02)';
                });

                searchInput.addEventListener('blur', () => {
                    const searchBox = document.querySelector('.search-box');
                    if (searchBox) searchBox.style.transform = 'scale(1)';
                    setTimeout(() => {
                        const suggestions = document.getElementById('searchSuggestions');
                        if (suggestions) suggestions.classList.add('hidden');
                    }, 200);
                });
            }

            // 음성 검색
            this.bindEventSafely('voiceSearch', 'click', () => {
                this.toggleVoiceSearch();
            });

            // 카테고리 카드 클릭
            this.bindEventsSafely('.category-card', 'click', (e) => {
                console.log('카테고리 카드 클릭됨');
                this.addClickEffect(e.currentTarget);
                const category = e.currentTarget.getAttribute('data-category');
                this.showCategoryProducts(category);
            });

            // 하단 네비게이션
            this.bindEventsSafely('.nav-item', 'click', (e) => {
                if (!e.currentTarget.hasAttribute('data-tab')) return;
                console.log('네비게이션 아이템 클릭됨:', e.currentTarget.getAttribute('data-tab'));
                this.switchTab(e.currentTarget);
            });

            // 언어 변경
            this.bindEventSafely('language', 'change', (e) => {
                console.log('언어 변경:', e.target.value);
                this.changeLanguage(e.target.value);
            });

            // 다크모드 토글
            this.bindEventSafely('themeToggle', 'click', () => {
                console.log('테마 토글 버튼 클릭됨');
                this.toggleTheme();
            });

            // 터치 이벤트
            this.setupTouchEvents();

            console.log('✅ 모든 이벤트 리스너 설정 완료');

        } catch (error) {
            console.error('이벤트 리스너 설정 중 오류:', error);
        }
    }

    // 안전한 이벤트 바인딩 헬퍼 메서드
    bindEventSafely(elementId, eventType, handler) {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener(eventType, handler);
                console.log(`✅ ${elementId}에 ${eventType} 이벤트 바인딩 성공`);
            } else {
                console.warn(`⚠️ ${elementId} 요소를 찾을 수 없습니다.`);
            }
        } catch (error) {
            console.error(`❌ ${elementId} 이벤트 바인딩 실패:`, error);
        }
    }

    // 여러 요소에 안전한 이벤트 바인딩
    bindEventsSafely(selector, eventType, handler) {
        try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                elements.forEach(element => {
                    element.addEventListener(eventType, handler);
                });
                console.log(`✅ ${selector} (${elements.length}개)에 ${eventType} 이벤트 바인딩 성공`);
            } else {
                console.warn(`⚠️ ${selector} 요소들을 찾을 수 없습니다.`);
            }
        } catch (error) {
            console.error(`❌ ${selector} 이벤트 바인딩 실패:`, error);
        }
    }

    // ===== 스캔 기능 =====
    
    async startCamera() {
        console.log('카메라 시작');
        
        try {
            this.isLoading = true;
            this.showMiniLoading('카메라를 시작하는 중...');
            
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video = document.getElementById('video');
            this.canvas = document.getElementById('canvas');
            
            if (this.video) {
                this.video.srcObject = this.currentStream;
            }
            
            const cameraSection = document.getElementById('cameraSection');
            if (cameraSection) {
                cameraSection.classList.remove('hidden');
                cameraSection.style.opacity = '0';
                cameraSection.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    cameraSection.style.transition = 'all 0.4s ease-out';
                    cameraSection.style.opacity = '1';
                    cameraSection.style.transform = 'translateY(0)';
                }, 50);
            }
            
            this.hideMiniLoading();
            this.isLoading = false;
            this.showNotification('카메라가 시작되었습니다.', 'success');
            
        } catch (error) {
            console.error('카메라 접근 오류:', error);
            this.showErrorMessage('카메라에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.');
            this.isLoading = false;
        }
    }

    stopCamera() {
        console.log('카메라 중지');
        
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        const cameraSection = document.getElementById('cameraSection');
        if (cameraSection) {
            cameraSection.style.transition = 'all 0.3s ease-in';
            cameraSection.style.opacity = '0';
            cameraSection.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                cameraSection.classList.add('hidden');
                cameraSection.style.transform = 'translateY(20px)';
            }, 300);
        }
        
        this.showNotification('카메라가 중지되었습니다.', 'info');
    }

    capturePhoto() {
        console.log('사진 촬영');
        
        if (!this.video || !this.canvas || this.isLoading) return;

        this.showCaptureFlash();

        const context = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        context.drawImage(this.video, 0, 0);
        
        const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
        
        this.stopCamera();
        setTimeout(() => {
            this.analyzeImage(imageData);
        }, 500);
    }

    switchCamera() {
        console.log('카메라 전환');
        this.showNotification('카메라를 전환하고 있습니다...', 'info');
        
        if (this.currentStream) {
            this.stopCamera();
            setTimeout(() => {
                this.startCamera();
            }, 500);
        }
    }

    // ===== 바코드 스캔 기능 =====
    
    startBarcodeScanner() {
        console.log('바코드 스캐너 시작');
        
        if (this.isLoading) return;
        
        const barcodeSection = document.getElementById('barcodeInputSection');
        if (barcodeSection) {
            barcodeSection.classList.remove('hidden');
            this.loadBarcodeHistory();
            this.showNotification('바코드 스캐너가 시작되었습니다.', 'success');
        }
    }

    async startBarcodeCamera() {
        console.log('바코드 카메라 시작');
        
        if (this.isScanning) {
            this.stopBarcodeCamera();
            return;
        }
        
        try {
            if (typeof Html5Qrcode !== 'undefined') {
                await this.cleanupBarcodeScanner();
                
                this.html5QrcodeScanner = new Html5Qrcode("qr-reader");

                const config = {
                    fps: 10,
                    qrbox: { 
                        width: Math.min(300, window.innerWidth - 40), 
                        height: 200 
                    },
                    aspectRatio: 1.5,
                    disableFlip: false,
                    videoConstraints: {
                        facingMode: "environment"
                    },
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.UPC_A,
                        Html5QrcodeSupportedFormats.UPC_E
                    ]
                };

                const cameraConstraints = {
                    facingMode: { ideal: "environment" }
                };

                await this.html5QrcodeScanner.start(
                    cameraConstraints,
                    config,
                    (decodedText, decodedResult) => {
                        console.log(`바코드 스캔 성공: ${decodedText}`);
                        this.onBarcodeScanned(decodedText, decodedResult);
                    },
                    (errorMessage) => {
                        // 스캔 실패는 조용히 처리
                    }
                );

                this.isScanning = true;
                this.updateBarcodeButton(true);
                this.showNotification('바코드 카메라 스캔을 시작했습니다.', 'success');

            } else {
                this.showNotification('바코드 스캔 라이브러리가 로드되지 않았습니다.', 'error');
            }

        } catch (error) {
            console.error('바코드 카메라 시작 오류:', error);
            this.handleBarcodeError(error);
            this.isScanning = false;
            this.updateBarcodeButton(false);
        }
    }

    async stopBarcodeCamera() {
        console.log('바코드 카메라 중지');
        
        try {
            await this.cleanupBarcodeScanner();
            this.updateBarcodeButton(false);
            this.showNotification('바코드 스캔을 중지했습니다.', 'info');
            
        } catch (error) {
            console.error('바코드 카메라 중지 오류:', error);
            this.isScanning = false;
            this.updateBarcodeButton(false);
        }
    }

    async cleanupBarcodeScanner() {
        try {
            if (this.html5QrcodeScanner) {
                if (this.isScanning) {
                    await this.html5QrcodeScanner.stop();
                }
                this.html5QrcodeScanner.clear();
                this.html5QrcodeScanner = null;
            }
            
            const qrReaderElement = document.getElementById('qr-reader');
            if (qrReaderElement) {
                qrReaderElement.innerHTML = '<div class="qr-reader-placeholder"><i class="fas fa-camera" style="font-size: 2rem; margin-bottom: 1rem;"></i><p>스캔 시작 버튼을 눌러주세요</p></div>';
            }
            
            this.isScanning = false;
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.warn('바코드 스캐너 정리 중 오류:', error);
            this.isScanning = false;
        }
    }

    onBarcodeScanned(decodedText, decodedResult) {
        console.log('바코드 스캔 결과:', decodedText);
        
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        this.showNotification(`바코드 감지: ${decodedText}`, 'success');
        this.stopBarcodeCamera();
        this.addBarcodeToHistory(decodedText);
        
        setTimeout(() => {
            this.searchByBarcode(decodedText);
            this.closeBarcodeInput();
        }, 1000);
    }

    handleBarcodeError(error) {
        let errorMessage = '바코드 스캔 중 오류가 발생했습니다.';
        
        console.error('바코드 스캔 오류:', error);
        
        if (error.name === 'NotAllowedError' || error.message.includes('Permission')) {
            errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
        } else if (error.name === 'NotFoundError' || error.message.includes('NotFoundError')) {
            errorMessage = '카메라를 찾을 수 없습니다. 디바이스에 카메라가 있는지 확인해주세요.';
        } else if (error.name === 'NotReadableError' || error.message.includes('NotReadableError')) {
            errorMessage = '카메라가 다른 앱에서 사용 중입니다. 다른 앱을 종료하고 다시 시도해주세요.';
        }
        
        this.showNotification(errorMessage, 'error');
    }

    updateBarcodeButton(isScanning) {
        const button = document.getElementById('startBarcodeCamera');
        if (button) {
            if (isScanning) {
                button.innerHTML = '<i class="fas fa-stop"></i> 스캔 중지';
                button.classList.add('scanning');
            } else {
                button.innerHTML = '<i class="fas fa-play"></i> 스캔 시작';
                button.classList.remove('scanning');
            }
        }
    }

    closeBarcodeInput() {
        console.log('바코드 입력 닫기');
        
        if (this.isScanning) {
            this.stopBarcodeCamera();
        }
        
        const barcodeSection = document.getElementById('barcodeInputSection');
        if (barcodeSection) {
            barcodeSection.classList.add('hidden');
        }
    }

    submitBarcodeManual() {
        console.log('바코드 수동 제출');
        
        const barcodeInput = document.getElementById('barcodeManualInput');
        if (!barcodeInput) return;
        
        const barcode = barcodeInput.value.trim();
        
        if (barcode.length < 8) {
            this.showNotification('바코드는 최소 8자리 이상이어야 합니다.', 'warning');
            return;
        }
        
        this.addBarcodeToHistory(barcode);
        this.searchByBarcode(barcode);
        barcodeInput.value = '';
        this.closeBarcodeInput();
    }

    searchByBarcode(barcode) {
        console.log('바코드로 검색:', barcode);
        
        this.showNotification(`바코드 ${barcode} 분석 중...`, 'info');
        this.showAdvancedLoading();
        
        setTimeout(() => {
            this.hideLoading();
            const product = this.generateProductByBarcode(barcode);
            this.showResults(product);
        }, 2500);
    }

    addBarcodeToHistory(barcode) {
        const history = JSON.parse(localStorage.getItem('barcodeHistory') || '[]');
        const filteredHistory = history.filter(item => item.barcode !== barcode);
        
        filteredHistory.unshift({
            barcode: barcode,
            timestamp: new Date().toISOString()
        });
        
        if (filteredHistory.length > 10) {
            filteredHistory.splice(10);
        }
        
        localStorage.setItem('barcodeHistory', JSON.stringify(filteredHistory));
    }

    loadBarcodeHistory() {
        const history = JSON.parse(localStorage.getItem('barcodeHistory') || '[]');
        const historyContainer = document.getElementById('barcodeHistory');
        
        if (!historyContainer) return;
        
        if (history.length === 0) {
            historyContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">최근 스캔한 바코드가 없습니다.</p>';
            return;
        }
        
        historyContainer.innerHTML = history.map(item => `
            <div class="barcode-item" onclick="app.useBarcodeFromHistory('${item.barcode}')">
                <span class="barcode-number">${item.barcode}</span>
                <span class="barcode-date">${this.formatDate(item.timestamp)}</span>
            </div>
        `).join('');
    }

    useBarcodeFromHistory(barcode) {
        const barcodeInput = document.getElementById('barcodeManualInput');
        if (barcodeInput) {
            barcodeInput.value = barcode;
            this.submitBarcodeManual();
        }
    }

    switchInputMethod(methodElement) {
        if (!methodElement) return;
        
        document.querySelectorAll('.input-method').forEach(method => {
            method.classList.remove('active');
        });
        
        methodElement.classList.add('active');
    }

    // ===== 카테고리 기능 =====
    
    getCategoryProducts(category) {
        const products = {
            snacks: [
                { 
                    name: '허니버터칩', 
                    description: '달콤한 꿀과 고소한 버터맛이 만난 프리미엄 감자칩', 
                    price: '₩2,500', 
                    color: 'linear-gradient(135deg, #0066CC 0%, #00BCD4 50%, #0066CC 100%)',
                    rating: 4.6,
                    reviews: 1857,
                    badge: 'BEST'
                },
                { 
                    name: '새우깡', 
                    description: '바삭바삭한 식감과 진한 새우맛의 대표 스낵', 
                    price: '₩1,800', 
                    color: 'linear-gradient(135deg, #0066CC 0%, #00BCD4 50%, #0066CC 100%)',
                    rating: 4.4,
                    reviews: 923,
                    badge: 'HOT'
                },
                { 
                    name: '초코파이', 
                    description: '부드러운 마시멜로와 달콤한 초콜릿의 조화', 
                    price: '₩3,200', 
                    color: 'linear-gradient(135deg, #0066CC 0%, #00BCD4 50%, #0066CC 100%)',
                    rating: 4.5,
                    reviews: 1234,
                    badge: 'NEW'
                }
            ],
            fashion: [
                { 
                    name: '한복', 
                    description: '전통과 현대가 만난 아름다운 한국의 전통 의상', 
                    price: '₩150,000', 
                    color: 'linear-gradient(135deg, #E91E63 0%, #7B1FA2 50%, #E91E63 100%)',
                    rating: 4.8,
                    reviews: 234,
                    badge: 'PREMIUM'
                }
            ],
            beauty: [
                { 
                    name: '마스크팩', 
                    description: '깊은 보습과 영양 공급으로 건강한 피부 케어', 
                    price: '₩15,000', 
                    color: 'linear-gradient(135deg, #00BCD4 0%, #0066CC 30%, #E91E63 70%, #00BCD4 100%)',
                    rating: 4.7,
                    reviews: 1245,
                    badge: 'BEST'
                }
            ],
            food: [
                { 
                    name: '김치', 
                    description: '한국의 대표 발효식품, 건강과 맛의 완벽한 조화', 
                    price: '₩8,000', 
                    color: 'linear-gradient(135deg, #00BCD4 0%, #E91E63 50%, #7B1FA2 100%)',
                    rating: 4.8,
                    reviews: 2134,
                    badge: 'TRADITIONAL'
                }
            ]
        };
        
        return products[category] || [];
    }

    showCategoryProducts(category) {
        console.log('카테고리 상품 표시:', category);
        
        const categoryNames = {
            snacks: '과자/스낵',
            fashion: '의류',
            beauty: '화장품', 
            food: '식품'
        };
        
        const categoryName = categoryNames[category] || category;
        this.showCategoryModal(category, categoryName);
    }

    showCategoryModal(category, categoryName) {
        console.log('카테고리 모달 표시:', categoryName);
        
        const lang = this.translations[this.currentLanguage];
        
        const existingModal = document.getElementById('categoryModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'categoryModal';
        modal.className = 'category-modal';
        
        const categoryProducts = this.getCategoryProducts(category);
        const categoryIcons = {
            snacks: 'cookie-bite',
            fashion: 'tshirt',
            beauty: 'spa',
            food: 'utensils'
        };
        
        modal.innerHTML = `
            <div class="category-modal-content category-${category}">
                <div class="category-modal-header">
                    <h3>
                        <i class="fas fa-${categoryIcons[category] || 'list'}"></i>
                        ${categoryName}
                    </h3>
                    <button class="close-category-modal" onclick="app.closeCategoryModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="category-modal-body">
                    <div class="category-description">
                        <h4>${categoryName} 카테고리</h4>
                        <p>${lang.categoryExplore || '이 카테고리의 인기 상품들을 확인해보세요.'}</p>
                    </div>
                    
                    ${categoryProducts.length > 0 ? `
                        <div class="category-products-list">
                            ${categoryProducts.map((product, index) => `
                                <div class="category-product-item" onclick="app.showProductFromCategory('${product.name}')" style="animation-delay: ${index * 0.1}s">
                                    ${product.badge ? `<div class="category-product-badge">${product.badge}</div>` : ''}
                                    <div class="category-product-icon" style="background: ${product.color}">
                                        ${product.name.charAt(0)}
                                    </div>
                                    <div class="category-product-info">
                                        <div class="category-product-name">${product.name}</div>
                                        <div class="category-product-desc">${product.description}</div>
                                        <div class="category-product-price">${product.price}</div>
                                        ${product.rating ? `
                                            <div class="category-product-rating">
                                                <div class="stars">${this.generateStars(product.rating)}</div>
                                                <span>(${product.reviews || 0} 리뷰)</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="category-empty-state">
                            <i class="fas fa-box-open"></i>
                            <h4>상품 준비 중</h4>
                            <p>이 카테고리의 상품들을 준비하고 있습니다.</p>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCategoryModal();
            }
        });
    }

    closeCategoryModal() {
        console.log('카테고리 모달 닫기');
        
        const modal = document.getElementById('categoryModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    showProductFromCategory(productName) {
        console.log('카테고리 상품 표시:', productName);
        
        this.showNotification(`${productName} 상세 정보 로딩 중...`, 'info');
        this.closeCategoryModal();
        
        setTimeout(() => {
            this.showAdvancedLoading();
            setTimeout(() => {
                this.hideLoading();
                this.showResults(this.generateDemoProduct());
            }, 1500);
        }, 300);
    }

    // ===== 찜하기 기능 =====
    
    showFavorites() {
        console.log('찜하기 페이지 표시');
        
        const lang = this.translations[this.currentLanguage];
        
        const existingModal = document.getElementById('favoritesModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'favoritesModal';
        modal.className = 'favorites-section';
        
        modal.innerHTML = `
            <div class="favorites-content">
                <div class="favorites-header">
                    <h3>
                        <i class="fas fa-heart"></i>
                        ${lang.favoritesTitle}
                    </h3>
                    <button class="close-favorites" onclick="app.closeFavorites()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="favorites-body">
                    ${this.favorites.length > 0 ? `
                        <div class="favorites-list">
                            ${this.favorites.map((item, index) => `
                                <div class="favorite-item" style="animation-delay: ${index * 0.1}s" onclick="app.showFavoriteProduct('${item.name}')">
                                    <div class="favorite-icon">
                                        ${item.name.charAt(0)}
                                    </div>
                                    <div class="favorite-info">
                                        <div class="favorite-name">${item.name}</div>
                                        <div class="favorite-date">${this.formatDate(item.timestamp)}</div>
                                    </div>
                                    <button class="remove-favorite" onclick="app.removeFromFavorites('${item.name}', event)" title="${lang.removeFavorite}">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="favorites-empty">
                            <i class="fas fa-heart-broken"></i>
                            <h4>${lang.noFavorites}</h4>
                            <p>${lang.startFavoriting}</p>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeFavorites();
            }
        });
    }

    closeFavorites() {
        console.log('찜하기 페이지 닫기');
        
        const modal = document.getElementById('favoritesModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    showFavoriteProduct(productName) {
        console.log('찜한 상품 표시:', productName);
        
        const favoriteProduct = this.generateDemoProduct();
        favoriteProduct.name = productName;
        
        this.closeFavorites();
        
        setTimeout(() => {
            this.showAdvancedLoading();
            setTimeout(() => {
                this.hideLoading();
                this.showResults(favoriteProduct);
            }, 1500);
        }, 300);
    }

    removeFromFavorites(productName, event) {
        if (event) {
            event.stopPropagation();
        }
        
        this.favorites = this.favorites.filter(item => item.name !== productName);
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        
        this.updateFavoriteCount();
        this.showNotification(`${productName}을(를) 찜 목록에서 제거했습니다.`, 'info');
        
        this.showFavorites();
    }

    addToFavorites(productName) {
        console.log('찜하기 추가:', productName);
        
        const existingIndex = this.favorites.findIndex(item => item.name === productName);
        
        if (existingIndex === -1) {
            const currentProduct = this.getCurrentProduct();
            
            this.favorites.push({
                name: productName,
                timestamp: new Date().toISOString(),
                ...currentProduct
            });
            
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            this.showNotification(`${productName}을(를) 찜 목록에 추가했습니다!`, 'success');
            
            this.showHeartAnimation();
        } else {
            this.showNotification(`${productName}은(는) 이미 찜 목록에 있습니다!`, 'info');
        }
        
        this.updateFavoriteCount();
    }

    getCurrentProduct() {
        return {
            category: "스낵",
            price: "₩2,500",
            rating: 4.6,
            image: "data:image/svg+xml;base64,..."
        };
    }

    updateFavoriteCount() {
        const notificationDot = document.querySelector('.notification-dot');
        if (notificationDot) {
            const count = this.favorites.length;
            if (count > 0) {
                notificationDot.textContent = count > 99 ? '99+' : count;
                notificationDot.classList.remove('hidden');
            } else {
                notificationDot.classList.add('hidden');
            }
        }
    }

    showHeartAnimation() {
        const heart = document.createElement('div');
        heart.innerHTML = '<i class="fas fa-heart"></i>';
        heart.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            font-size: 3rem;
            color: #E91E63;
            z-index: 9999;
            pointer-events: none;
            animation: heartBurst 0.8s ease-out forwards;
        `;
        
        document.body.appendChild(heart);
        
        setTimeout(() => {
            heart.remove();
        }, 800);
    }

    // ===== 다크모드 관련 메서드 =====
    
    setupTheme() {
        console.log('테마 설정:', this.currentTheme);
        this.applyTheme(this.currentTheme);
    }

    toggleTheme() {
        console.log('테마 토글');
        
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        
        localStorage.setItem('theme', this.currentTheme);
        
        const lang = this.translations[this.currentLanguage];
        const themeName = this.currentTheme === 'dark' ? lang.themeDark : lang.themeLight;
        this.showNotification(`${themeName}로 변경되었습니다.`, 'success');
    }

    applyTheme(theme) {
        const body = document.body;
        const appContainer = document.getElementById('appContainer');
        
        if (theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            if (appContainer) {
                appContainer.setAttribute('data-theme', 'dark');
            }
        } else {
            body.removeAttribute('data-theme');
            if (appContainer) {
                appContainer.removeAttribute('data-theme');
            }
        }
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                if (theme === 'dark') {
                    icon.className = 'fas fa-sun';
                    themeToggle.title = '라이트 모드로 전환';
                } else {
                    icon.className = 'fas fa-moon';
                    themeToggle.title = '다크 모드로 전환';
                }
            }
        }
    }

    // ===== 탭 전환 기능 =====
    
    switchTab(tabElement) {
        console.log('탭 전환:', tabElement.getAttribute('data-tab'));
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        tabElement.classList.add('active');
        
        const icon = tabElement.querySelector('.nav-icon');
        if (icon) {
            icon.style.transform = tabElement.classList.contains('camera-nav') ? 'scale(1.15)' : 'scale(1.1)';
            setTimeout(() => {
                icon.style.transform = tabElement.classList.contains('camera-nav') ? 'scale(1.05)' : 'scale(1)';
            }, 200);
        }
        
        const tab = tabElement.getAttribute('data-tab');
        if (tab === 'favorites') {
            this.showFavorites();
        } else if (tab === 'camera') {
            this.startCamera();
        }
    }

    // ===== 유틸리티 메서드들 =====
    
    addClickEffect(element, type = 'default') {
        if (!element) return;
        
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.transform = 'scale(0)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '1000';
        
        if (type === 'capture') {
            ripple.style.background = 'rgba(0, 102, 204, 0.3)';
            ripple.style.width = '120px';
            ripple.style.height = '120px';
        } else {
            ripple.style.background = 'rgba(255, 255, 255, 0.3)';
            ripple.style.width = '40px';
            ripple.style.height = '40px';
        }
        
        const rect = element.getBoundingClientRect();
        ripple.style.left = rect.width / 2 - 20 + 'px';
        ripple.style.top = rect.height / 2 - 20 + 'px';
        
        element.appendChild(ripple);
        
        ripple.animate([
            { transform: 'scale(0)', opacity: 1 },
            { transform: 'scale(2)', opacity: 0 }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => {
            ripple.remove();
        };

        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }

    showNotification(message, type = 'info') {
        console.log('알림 표시:', message, type);
        
        const existing = document.querySelectorAll('.notification');
        existing.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = 'notification';
        
        const bgColor = {
            'success': '#10b981',
            'error': '#FF5722',
            'info': '#0066CC',
            'warning': '#f59e0b'
        };
        
        const iconMap = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'info': 'info-circle',
            'warning': 'exclamation-triangle'
        };
        
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${bgColor[type]};
                color: white;
                padding: 1rem 1.25rem;
                border-radius: 12px;
                z-index: 1001;
                font-size: 0.9rem;
                font-weight: 500;
                max-width: 320px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
                transform: translateX(400px);
                transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                display: flex;
                align-items: center;
                gap: 0.75rem;
            ">
                <i class="fas fa-${iconMap[type]}" style="font-size: 1.1rem;"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.firstElementChild.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            const notifElement = notification.firstElementChild;
            notifElement.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 400);
        }, 3500);
    }

    showErrorMessage(message) {
        console.error('에러 메시지:', message);
        this.showNotification(message, 'error');
    }

    showMiniLoading(text) {
        const existing = document.getElementById('miniLoader');
        if (existing) existing.remove();

        const miniLoader = document.createElement('div');
        miniLoader.id = 'miniLoader';
        miniLoader.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                z-index: 1000;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
            ">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.1rem;"></i>
                ${text}
            </div>
        `;
        document.body.appendChild(miniLoader);
    }

    hideMiniLoading() {
        const miniLoader = document.getElementById('miniLoader');
        if (miniLoader) {
            miniLoader.style.opacity = '0';
            setTimeout(() => miniLoader.remove(), 300);
        }
    }

    showAdvancedLoading() {
        console.log('고급 로딩 표시');
        
        this.isLoading = true;
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
            
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = '0%';
                progressBar.style.transition = 'none';
                
                setTimeout(() => {
                    progressBar.style.transition = 'width 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    progressBar.style.width = '100%';
                }, 100);
            }
        }
    }

    hideLoading() {
        console.log('로딩 숨기기');
        
        this.isLoading = false;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.opacity = '1';
            }, 400);
        }
    }

    updateLoadingText(text) {
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.style.opacity = '0';
            loadingText.style.transform = 'translateY(10px)';
            setTimeout(() => {
                loadingText.textContent = text;
                loadingText.style.opacity = '1';
                loadingText.style.transform = 'translateY(0)';
            }, 200);
        }
    }

    showCaptureFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            opacity: 0;
            pointer-events: none;
            z-index: 9999;
        `;
        
        document.body.appendChild(flash);
        
        flash.animate([
            { opacity: 0 },
            { opacity: 0.9 },
            { opacity: 0 }
        ], {
            duration: 200,
            easing: 'ease-out'
        }).onfinish = () => {
            flash.remove();
        };
    }

    async analyzeImage(imageData) {
        if (this.isLoading) return;
        
        this.showAdvancedLoading();
        
        try {
            const loadingTexts = [
                '상품을 인식하고 있어요...',
                '데이터베이스에서 정보를 찾고 있어요...',
                '리뷰와 평점을 수집하고 있어요...',
                '분석 결과를 준비하고 있어요...'
            ];
            
            for (let i = 0; i < loadingTexts.length; i++) {
                setTimeout(() => {
                    this.updateLoadingText(loadingTexts[i]);
                }, i * 900);
            }
            
            setTimeout(() => {
                this.hideLoading();
                this.showResults(this.generateDemoProduct());
            }, 4000);
            
        } catch (error) {
            console.error('이미지 분석 오류:', error);
            this.hideLoading();
            this.showErrorMessage('이미지 분석 중 오류가 발생했습니다.');
        }
    }

    generateDemoProduct() {
        const demoProducts = [
            {
                name: "허니버터칩",
                nameEn: "Honey Butter Chip",
                image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZkNzAwIiByeD0iMTYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iIGZvbnQtd2VpZ2h0PSJib2xkIj7smojsnpAg7ISc64+EPC90ZXh0Pjwvc3ZnPg==",
                price: "₩2,500",
                rating: 4.6,
                reviews: 1857,
                description: "달콤한 꿀과 고소한 버터맛이 만난 대한민국 대표 스낵! 바삭한 감자칩에 특별한 허니버터 시즈닝을 입혀 중독적인 맛을 자랑합니다.",
                tags: ["스낵", "인기상품", "선물추천", "한국대표", "달콤함"],
                category: "과자/스낵",
                nutrition: { calories: "555kcal/100g", fat: "32g", sodium: "500mg", carbs: "58g" }
            }
        ];

        return demoProducts[0];
    }

    generateProductByBarcode(barcode) {
        const barcodeProducts = {
            '8801043032197': {
                name: "허니버터칩",
                nameEn: "Honey Butter Chip",
                barcode: barcode,
                image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZkNzAwIiByeD0iMTYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iIGZvbnQtd2VpZ2h0PSJib2xkIj7smojsnpAg7ISc64+EPC90ZXh0Pjwvc3ZnPg==",
                price: "₩2,500",
                rating: 4.6,
                reviews: 1857,
                description: "달콤한 꿀과 고소한 버터맛이 만난 대한민국 대표 스낵!",
                tags: ["스낵", "인기상품", "선물추천"],
                category: "과자/스낵",
                nutrition: { calories: "555kcal/100g", fat: "32g", sodium: "500mg", carbs: "58g" }
            }
        };
        
        return barcodeProducts[barcode] || {
            ...this.generateDemoProduct(),
            barcode: barcode
        };
    }

    showResults(product) {
        console.log('결과 표시:', product.name);
        
        const resultContent = document.getElementById('resultContent');
        if (!resultContent) return;
        
        const lang = this.translations[this.currentLanguage];
        
        resultContent.innerHTML = `
            <div class="product-info">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <h3 class="product-name">${product.name}</h3>
                <p style="color: var(--text-secondary); font-size: 1rem; margin-bottom: 1.5rem; font-style: italic;">${product.nameEn || product.name}</p>
                
                <div class="product-rating">
                    <div class="stars">${this.generateStars(product.rating)}</div>
                    <span style="font-weight: 600;">${product.rating} (${product.reviews.toLocaleString()} 리뷰)</span>
                </div>
                
                <div class="product-price">${product.price}</div>
                
                <div class="product-description">
                    <h4 style="margin-bottom: 0.75rem; color: var(--text-primary); font-size: 1.1rem;">${lang.productDesc || '상품 설명'}</h4>
                    <p>${product.description}</p>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin-bottom: 0.75rem; color: var(--text-primary); font-size: 1.1rem;">${lang.nutritionInfo || '영양 정보'}</h4>
                    <div style="background: var(--background-light); padding: 1rem; border-radius: var(--border-radius-sm); font-size: 0.95rem; border: 1px solid var(--border-color);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                            <p><strong>${lang.calories || '칼로리:'}:</strong> ${product.nutrition.calories}</p>
                            <p><strong>${lang.fat || '지방:'}:</strong> ${product.nutrition.fat}</p>
                            <p><strong>${lang.sodium || '나트륨:'}:</strong> ${product.nutrition.sodium}</p>
                            <p><strong>${lang.carbs || '탄수화물:'}:</strong> ${product.nutrition.carbs}</p>
                        </div>
                    </div>
                </div>
                
                <div class="product-tags">
                    ${product.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
                
                <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                    <button class="action-btn primary" onclick="app.addToFavorites('${product.name}')">
                        <i class="fas fa-heart"></i> ${lang.addFavorites || '찜하기'}
                    </button>
                    <button class="action-btn secondary" onclick="app.shareProduct('${product.name}')">
                        <i class="fas fa-share"></i> ${lang.share || '공유하기'}
                    </button>
                </div>
            </div>
        `;
        
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            
            const resultCard = document.querySelector('.result-card');
            if (resultCard) {
                resultCard.style.transform = 'scale(0.9) translateY(40px)';
                resultCard.style.opacity = '0';
                
                setTimeout(() => {
                    resultCard.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    resultCard.style.transform = 'scale(1) translateY(0)';
                    resultCard.style.opacity = '1';
                }, 100);
            }
        }
        
        this.addToHistory(product);
    }

    closeResults() {
        console.log('결과 닫기');
        
        const resultCard = document.querySelector('.result-card');
        if (resultCard) {
            resultCard.style.transition = 'all 0.3s ease-in';
            resultCard.style.transform = 'scale(0.9) translateY(30px)';
            resultCard.style.opacity = '0';
        }
        
        setTimeout(() => {
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.classList.add('hidden');
            }
        }, 300);
    }

    addToHistory(product) {
        const historyItem = {
            ...product,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };
        
        this.scanHistory = this.scanHistory.filter(item => item.name !== product.name);
        this.scanHistory.unshift(historyItem);
        
        if (this.scanHistory.length > 10) {
            this.scanHistory = this.scanHistory.slice(0, 10);
        }
        
        localStorage.setItem('scanHistory', JSON.stringify(this.scanHistory));
        this.loadScanHistory();
    }

    loadScanHistory() {
        console.log('스캔 기록 로드');
        
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        const lang = this.translations[this.currentLanguage];
        
        if (this.scanHistory.length === 0) {
            historyList.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
                    <i class="fas fa-camera" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">${lang.noScans || '아직 스캔 기록이 없습니다.'}</p>
                    <p style="font-size: 0.9rem;">${lang.scanProduct || '상품을 스캔해보세요!'}</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = this.scanHistory.map((item, index) => `
            <div class="history-item fade-in-up" style="animation-delay: ${index * 0.1}s" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}">
                <div class="history-info">
                    <h4>${item.name}</h4>
                    <p>${this.formatDate(item.timestamp)} • ${item.category}</p>
                </div>
                <div style="margin-left: auto; color: var(--primary-color);">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `).join('');
        
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.addClickEffect(e.currentTarget);
                const id = parseInt(e.currentTarget.dataset.id);
                const product = this.scanHistory.find(p => p.id === id);
                if (product) {
                    setTimeout(() => this.showResults(product), 200);
                }
            });
        });
    }

    loadFavorites() {
        console.log('찜 목록 로드');
        this.updateFavoriteCount();
    }

    shareProduct(productName) {
        console.log('상품 공유:', productName);
        
        if (navigator.share) {
            navigator.share({
                title: 'Koko',
                text: `${productName} - Koko에서 발견한 한국 상품!`,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(`${productName} - Koko에서 발견한 한국 상품! ${window.location.href}`).then(() => {
                this.showNotification('상품 정보가 클립보드에 복사되었습니다!', 'success');
            });
        }
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) return '방금 전';
        if (diffHours < 24) return `${diffHours}시간 전`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}일 전`;
        
        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        });
    }

    changeLanguage(language) {
        console.log('언어 변경:', language);
        
        this.currentLanguage = language;
        localStorage.setItem('language', language);
        
        this.updateLanguage();
        this.showNotification(`언어를 ${language}로 변경했습니다.`, 'success');
    }

    updateLanguage() {
        const lang = this.translations[this.currentLanguage];
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput && lang) {
            searchInput.placeholder = lang.searchPlaceholder;
        }
        
        document.querySelectorAll('[data-text-ko]').forEach(element => {
            const key = `data-text-${this.currentLanguage}`;
            if (element.hasAttribute(key)) {
                const text = element.getAttribute(key);
                if (element.tagName === 'INPUT') {
                    element.placeholder = text;
                } else {
                    element.innerHTML = text;
                }
            }
        });

        if (this.recognition) {
            this.recognition.lang = this.getLanguageCode(this.currentLanguage);
        }
    }

    getLanguageCode(lang) {
        const codes = {
            ko: 'ko-KR',
            en: 'en-US',
            zh: 'zh-CN',
            ja: 'ja-JP'
        };
        return codes[lang] || 'ko-KR';
    }

    setupLanguage() {
        console.log('언어 설정');
        
        const browserLang = navigator.language.split('-')[0];
        const supportedLangs = ['ko', 'en', 'zh', 'ja'];
        
        if (supportedLangs.includes(browserLang) && !localStorage.getItem('language')) {
            this.currentLanguage = browserLang;
            const languageSelect = document.getElementById('language');
            if (languageSelect) {
                languageSelect.value = browserLang;
            }
        } else {
            const languageSelect = document.getElementById('language');
            if (languageSelect) {
                languageSelect.value = this.currentLanguage;
            }
        }
        
        this.updateLanguage();
    }

    animateCounters() {
        console.log('카운터 애니메이션');
        
        setTimeout(() => {
            const counters = document.querySelectorAll('.stat-number[data-count]');
            
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-count'));
                let current = 0;
                const increment = target / 60;
                
                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        counter.textContent = Math.ceil(current).toLocaleString();
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target.toLocaleString();
                        if (target === 98) {
                            counter.textContent += '%';
                        }
                    }
                };
                
                updateCounter();
            });
        }, 5000);
    }

    setupVoiceSearch() {
        console.log('음성 검색 설정');
        
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = this.getLanguageCode(this.currentLanguage);

            this.recognition.onstart = () => {
                const voiceButton = document.getElementById('voiceSearch');
                if (voiceButton) {
                    voiceButton.classList.add('recording');
                }
                this.showNotification('음성 인식을 시작합니다...', 'info');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = transcript;
                    this.handleSearch(transcript);
                }
                this.showNotification(`"${transcript}" 검색 중...`, 'success');
            };

            this.recognition.onerror = () => {
                this.showNotification('음성 인식에 실패했습니다.', 'error');
            };

            this.recognition.onend = () => {
                const voiceButton = document.getElementById('voiceSearch');
                if (voiceButton) {
                    voiceButton.classList.remove('recording');
                }
            };
        } else {
            const voiceButton = document.getElementById('voiceSearch');
            if (voiceButton) {
                voiceButton.style.display = 'none';
            }
        }
    }

    toggleVoiceSearch() {
        console.log('음성 검색 토글');
        
        if (this.recognition) {
            const voiceButton = document.getElementById('voiceSearch');
            if (voiceButton && voiceButton.classList.contains('recording')) {
                this.recognition.stop();
            } else {
                this.recognition.start();
            }
        }
    }

    handleSearch(query) {
        console.log('검색 처리:', query);
        
        if (query.length < 2) {
            const suggestions = document.getElementById('searchSuggestions');
            if (suggestions) {
                suggestions.classList.add('hidden');
            }
            return;
        }

        const suggestions = this.generateSearchSuggestions(query);
        this.showSearchSuggestions(suggestions);
    }

    generateSearchSuggestions(query) {
        const commonProducts = [
            { name: '허니버터칩', icon: 'cookie-bite' },
            { name: '신라면', icon: 'utensils' },
            { name: '불닭볶음면', icon: 'fire' },
            { name: '마스크팩', icon: 'spa' },
            { name: '김치', icon: 'leaf' },
            { name: '한복', icon: 'tshirt' }
        ];

        return commonProducts
            .filter(product => product.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 4);
    }

    showSearchSuggestions(suggestions) {
        const container = document.getElementById('searchSuggestions');
        if (!container) return;
        
        if (suggestions.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" data-query="${suggestion.name}">
                <i class="fas fa-${suggestion.icon}"></i>
                <span>${suggestion.name}</span>
            </div>
        `).join('');

        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const query = e.currentTarget.getAttribute('data-query');
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = query;
                }
                this.performSearch(query);
                container.classList.add('hidden');
            });
        });

        container.classList.remove('hidden');
    }

    performSearch(query) {
        console.log('검색 실행:', query);
        
        this.showNotification(`"${query}" 검색 중...`, 'info');
        this.showAdvancedLoading();

        setTimeout(() => {
            this.hideLoading();
            this.showResults(this.generateDemoProduct());
        }, 2000);
    }

    setupTouchEvents() {
        console.log('터치 이벤트 설정');
        
        document.querySelectorAll('.scan-button, .category-card, .history-item').forEach(element => {
            element.addEventListener('touchstart', (e) => {
                element.style.transform = 'scale(0.98)';
            });
            
            element.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 150);
            });
        });
    }
}

// 전역 변수
let app;

// 앱 초기화 - 더 안전한 방식
function initializeKokoApp() {
    console.log('🚀 Koko 앱 초기화 시작');
    
    try {
        // HTML5 QRCode 라이브러리 확인
        if (typeof Html5Qrcode !== 'undefined') {
            console.log('✅ HTML5 QRCode 라이브러리 로드 확인됨');
        } else {
            console.warn('⚠️ HTML5 QRCode 라이브러리 없음 - 기본 기능으로 실행');
        }
        
        // 앱 인스턴스 생성
        app = new KokoApp();
        window.app = app; // 전역 접근을 위해
        
        console.log('✅ Koko 앱 초기화 완료');
        
    } catch (error) {
        console.error('❌ 앱 초기화 실패:', error);
        
        // 폴백: 기본 알림 표시
        setTimeout(() => {
            alert('앱 로딩 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        }, 1000);
    }
}

// DOM 준비 상태 확인 후 초기화
if (document.readyState !== 'loading') {
    console.log('DOM 이미 준비됨 - 즉시 초기화');
    initializeKokoApp();
} else {
    console.log('DOM 로딩 대기 중...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded 이벤트 발생');
        initializeKokoApp();
    });
}
// 추가 안전장치
window.addEventListener('load', () => {
    console.log('Window load 이벤트 발생');
    
    // 앱이 아직 초기화되지 않았다면 재시도
    if (!window.app) {
        console.log('앱이 아직 초기화되지 않음 - 재시도');
        setTimeout(initializeKokoApp, 500);
    }
});

// 에러 핸들링
window.addEventListener('error', (event) => {
    console.error('전역 에러:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('처리되지 않은 Promise 에러:', event.reason);
});

// 페이지 가시성 API - 배터리 절약
document.addEventListener('visibilitychange', () => {
    if (window.app) {
        if (document.hidden) {
            // 페이지가 숨겨졌을 때 카메라 중지
            if (window.app.currentStream) {
                window.app.stopCamera();
            }
            if (window.app.isScanning) {
                window.app.stopBarcodeCamera();
            }
        }
    }
});

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
    if (window.app) {
        window.app.showNotification('인터넷 연결이 복구되었습니다.', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.app) {
        window.app.showNotification('인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.', 'warning');
    }
});

// 서비스 워커 등록 (PWA 지원)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // 서비스 워커 파일이 있다면 등록
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker 등록 성공:', registration.scope);
        } catch (error) {
            console.log('ServiceWorker 등록 실패 (파일 없음):', error.message);
        }
    });
}

// 앱 설치 프롬프트 처리
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA 설치 프롬프트 준비됨');
    e.preventDefault();
    deferredPrompt = e;
    
    // 설치 버튼 표시 로직을 여기에 추가할 수 있음
    if (window.app) {
        window.app.showNotification('이 앱을 홈 화면에 설치할 수 있습니다!', 'info');
    }
});

window.addEventListener('appinstalled', (evt) => {
    console.log('PWA 설치됨');
    if (window.app) {
        window.app.showNotification('앱이 성공적으로 설치되었습니다!', 'success');
    }
});

// 키보드 단축키 지원
document.addEventListener('keydown', (e) => {
    if (!window.app) return;
    
    // Ctrl/Cmd + 키 조합들
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'k': // Ctrl+K: 검색 포커스
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    window.app.showNotification('검색창에 포커스되었습니다.', 'info');
                }
                break;
                
            case 'd': // Ctrl+D: 다크모드 토글
                e.preventDefault();
                window.app.toggleTheme();
                break;
                
            case '1': // Ctrl+1: 홈 탭
                e.preventDefault();
                const homeTab = document.querySelector('[data-tab="home"]');
                if (homeTab) window.app.switchTab(homeTab);
                break;
                
            case '2': // Ctrl+2: 카메라 탭
                e.preventDefault();
                const cameraTab = document.querySelector('[data-tab="camera"]');
                if (cameraTab) window.app.switchTab(cameraTab);
                break;
                
            case '3': // Ctrl+3: 찜하기 탭
                e.preventDefault();
                const favTab = document.querySelector('[data-tab="favorites"]');
                if (favTab) window.app.switchTab(favTab);
                break;
        }
    }
    
    // ESC 키로 모달/오버레이 닫기
    if (e.key === 'Escape') {
        // 결과 모달 닫기
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection && !resultsSection.classList.contains('hidden')) {
            window.app.closeResults();
            return;
        }
        
        // 카테고리 모달 닫기
        const categoryModal = document.getElementById('categoryModal');
        if (categoryModal && categoryModal.classList.contains('show')) {
            window.app.closeCategoryModal();
            return;
        }
        
        // 찜하기 모달 닫기
        const favoritesModal = document.getElementById('favoritesModal');
        if (favoritesModal && favoritesModal.classList.contains('show')) {
            window.app.closeFavorites();
            return;
        }
        
        // 바코드 입력 닫기
        const barcodeSection = document.getElementById('barcodeInputSection');
        if (barcodeSection && !barcodeSection.classList.contains('hidden')) {
            window.app.closeBarcodeInput();
            return;
        }
        
        // 카메라 닫기
        const cameraSection = document.getElementById('cameraSection');
        if (cameraSection && !cameraSection.classList.contains('hidden')) {
            window.app.stopCamera();
            return;
        }
    }
    
    // 스페이스바로 사진 촬영
    if (e.code === 'Space') {
        const cameraSection = document.getElementById('cameraSection');
        if (cameraSection && !cameraSection.classList.contains('hidden')) {
            e.preventDefault();
            window.app.capturePhoto();
        }
    }
});

// 제스처 지원 (터치 디바이스용)
let touchStartX = null;
let touchStartY = null;

document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches.clientY;
    }
});

document.addEventListener('touchend', (e) => {
    if (!window.app || !touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches.clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const minSwipeDistance = 100;
    const maxVerticalDistance = 50;
    
    // 좌우 스와이프 감지
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalDistance) {
        const navItems = document.querySelectorAll('.nav-item[data-tab]');
        const activeIndex = Array.from(navItems).findIndex(item => item.classList.contains('active'));
        
        if (deltaX > 0 && activeIndex > 0) {
            // 오른쪽 스와이프 - 이전 탭
            window.app.switchTab(navItems[activeIndex - 1]);
        } else if (deltaX < 0 && activeIndex < navItems.length - 1) {
            // 왼쪽 스와이프 - 다음 탭
            window.app.switchTab(navItems[activeIndex + 1]);
        }
    }
    
    touchStartX = null;
    touchStartY = null;
});

// 디바이스 방향 변경 감지
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (window.app) {
            // 카메라가 실행 중이면 재시작
            if (window.app.currentStream) {
                console.log('화면 회전 감지 - 카메라 재시작');
                window.app.stopCamera();
                setTimeout(() => {
                    window.app.startCamera();
                }, 500);
            }
        }
    }, 500);
});

// 배터리 API (지원되는 경우)
if ('getBattery' in navigator) {
    navigator.getBattery().then((battery) => {
        const checkBatteryLevel = () => {
            if (battery.level < 0.2 && !battery.charging) {
                if (window.app) {
                    window.app.showNotification('배터리가 부족합니다. 절전 모드를 권장합니다.', 'warning');
                    
                    // 배터리 절약을 위해 카메라 중지
                    if (window.app.currentStream) {
                        window.app.stopCamera();
                    }
                    if (window.app.isScanning) {
                        window.app.stopBarcodeCamera();
                    }
                }
            }
        };
        
        battery.addEventListener('levelchange', checkBatteryLevel);
        battery.addEventListener('chargingchange', checkBatteryLevel);
        
        // 초기 체크
        checkBatteryLevel();
    }).catch((error) => {
        console.log('배터리 API 지원되지 않음:', error.message);
    });
}

// 메모리 사용량 모니터링 (지원되는 경우)
if ('memory' in performance) {
    setInterval(() => {
        const memInfo = performance.memory;
        const usedMemory = memInfo.usedJSHeapSize / 1048576; // MB
        const totalMemory = memInfo.totalJSHeapSize / 1048576; // MB
        
        // 메모리 사용량이 높으면 경고
        if (usedMemory / totalMemory > 0.9) {
            console.warn('높은 메모리 사용량 감지:', usedMemory.toFixed(2), 'MB');
            
            if (window.app) {
                // 메모리 정리를 위해 일부 기능 중지
                if (window.app.currentStream) {
                    window.app.showNotification('메모리 최적화를 위해 카메라를 중지합니다.', 'info');
                    window.app.stopCamera();
                }
            }
        }
    }, 30000); // 30초마다 체크
}

// 네트워크 정보 API (지원되는 경우)
if ('connection' in navigator) {
    const connection = navigator.connection;
    
    const checkConnection = () => {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            if (window.app) {
                window.app.showNotification('느린 네트워크가 감지되었습니다. 일부 기능이 제한될 수 있습니다.', 'warning');
            }
        }
    };
    
    connection.addEventListener('change', checkConnection);
    checkConnection(); // 초기 체크
}

// 앱 성능 모니터링
const performanceObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
        // Long Task 감지 (50ms 이상)
        if (entry.entryType === 'longtask' && entry.duration > 50) {
            console.warn('긴 작업 감지:', entry.duration.toFixed(2), 'ms');
        }
        
        // Layout Shift 감지
        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            if (entry.value > 0.1) {
                console.warn('레이아웃 시프트 감지:', entry.value);
            }
        }
    });
});

// 지원되는 성능 항목들 관찰 시작
try {
    performanceObserver.observe({ entryTypes: ['longtask', 'layout-shift'] });
} catch (error) {
    console.log('Performance Observer 지원되지 않음');
}

// 앱 사용 통계 (로컬 저장)
const trackUsage = (action, data = {}) => {
    try {
        const usage = JSON.parse(localStorage.getItem('appUsage') || '{}');
        const today = new Date().toDateString();
        
        if (!usage[today]) {
            usage[today] = {};
        }
        
        if (!usage[today][action]) {
            usage[today][action] = 0;
        }
        
        usage[today][action]++;
        
        // 최대 30일 데이터만 보관
        const dates = Object.keys(usage);
        if (dates.length > 30) {
            dates.slice(0, -30).forEach(date => {
                delete usage[date];
            });
        }
        
        localStorage.setItem('appUsage', JSON.stringify(usage));
    } catch (error) {
        console.warn('사용 통계 저장 실패:', error.message);
    }
};

// 사용 통계를 위한 전역 함수
window.trackUsage = trackUsage;

// 앱이 로드된 것을 기록
trackUsage('app_load');

// 디버그 모드 활성화 (개발용)
const enableDebugMode = () => {
    console.log('🐛 디버그 모드 활성화');
    
    // 모든 클릭 이벤트 로깅
    document.addEventListener('click', (e) => {
        console.log('클릭:', e.target.tagName, e.target.className, e.target.id);
    });
    
    // 앱 상태 표시용 패널 생성
    const debugPanel = document.createElement('div');
    debugPanel.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        font-size: 12px;
        border-radius: 5px;
        z-index: 10000;
        font-family: monospace;
        max-width: 200px;
    `;
    debugPanel.innerHTML = `
        <div><strong>🐛 Debug Mode</strong></div>
        <div id="debug-info">로딩 중...</div>
    `;
    document.body.appendChild(debugPanel);
    
    // 디버그 정보 업데이트
    setInterval(() => {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo && window.app) {
            debugInfo.innerHTML = `
                <div>테마: ${window.app.currentTheme}</div>
                <div>언어: ${window.app.currentLanguage}</div>
                <div>찜 개수: ${window.app.favorites.length}</div>
                <div>기록 개수: ${window.app.scanHistory.length}</div>
                <div>카메라: ${window.app.currentStream ? 'ON' : 'OFF'}</div>
                <div>스캔: ${window.app.isScanning ? 'ON' : 'OFF'}</div>
                <div>로딩: ${window.app.isLoading ? 'ON' : 'OFF'}</div>
            `;
        }
    }, 1000);
};

// URL 파라미터로 디버그 모드 활성화
if (new URLSearchParams(window.location.search).get('debug') === 'true') {
    enableDebugMode();
}

// 콘솔에서 디버그 모드 활성화할 수 있는 함수 제공
window.enableDebugMode = enableDebugMode;

console.log(`
🎯 Koko 앱 스크립트 완전 로드 완료!

사용 가능한 명령어:
- enableDebugMode(): 디버그 모드 활성화
- app.toggleTheme(): 테마 전환
- app.showNotification(message, type): 알림 표시
- trackUsage(action): 사용 통계 기록

키보드 단축키:
- Ctrl+K: 검색 포커스
- Ctrl+D: 다크모드 토글
- Ctrl+1/2/3: 탭 전환
- ESC: 모달 닫기
- Space: 사진 촬영 (카메라 화면에서)

제스처:
- 좌/우 스와이프: 탭 전환
`);
