/**
 * BRAVO DEER FARM - INTERACTION LOGIC
 * Contains: Sticky Header, Mobile Menu Toggle, Scroll Reveal, Product Selection Autopill, Custom Form Submission Modal
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       1. Sticky Header
       ========================================== */
    const header = document.querySelector('.main-header');
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    // Initial check on load
    handleScroll();


    /* ==========================================
       2. Mobile Navigation Toggle
       ========================================== */
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link, .btn-nav-order');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Toggle body scroll to prevent background scrolling when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close mobile menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }


    /* ==========================================
       3. Scroll Reveal Animation
       ========================================== */
    const revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Stop observing once it has revealed to prevent re-triggering
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15, // Trigger when 15% of the element is visible
            rootMargin: '0px 0px -50px 0px' // Offset trigger point slightly from viewport bottom
        });

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        revealElements.forEach(element => {
            element.classList.add('active');
        });
    }


    /* ==========================================
       4. Product Order Button Scroll & Autoselect
       ========================================== */
    const productOrderBtns = document.querySelectorAll('.btn-product-order');
    const productSelect = document.getElementById('productSelect');
    const orderSection = document.getElementById('order-contact');

    productOrderBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productCode = e.target.getAttribute('data-product');
            
            if (productSelect && productCode) {
                // Set the select element's value
                productSelect.value = productCode;
            }
            
            if (orderSection) {
                // Smooth scroll to the form section
                orderSection.scrollIntoView({ behavior: 'smooth' });
                
                // Add a gentle flash effect to focus the form
                const formContainer = document.getElementById('orderFormContainer');
                if (formContainer) {
                    setTimeout(() => {
                        formContainer.style.transition = 'box-shadow 0.3s ease';
                        formContainer.style.boxShadow = '0 0 25px rgba(192, 154, 81, 0.4)';
                        setTimeout(() => {
                            formContainer.style.boxShadow = '';
                        }, 1000);
                    }, 800);
                }
            }
        });
    });


    /* ==========================================
       5. Contact Form Submission & Success Modal
       ========================================== */
    const orderForm = document.getElementById('orderForm');
    const successModal = document.getElementById('successModal');
    const closeModal = document.getElementById('closeModal');
    
    // Modal fields to fill
    const summaryName = document.getElementById('summaryName');
    const summaryPhone = document.getElementById('summaryPhone');
    const summaryProduct = document.getElementById('summaryProduct');
    const SUBMIT_COOLDOWN_MS = 60 * 1000;
    const LAST_SUBMIT_KEY = 'bravoDeerFarmLastSubmitAt';

    if (orderForm && successModal) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent page reload

            const submitBtn = orderForm.querySelector('.btn-submit-order');
            const originalBtnText = submitBtn ? submitBtn.textContent : '';

            // Get form values
            const nameEl = document.getElementById('clientName');
            const phoneEl = document.getElementById('clientPhone');
            const zipcodeEl = document.getElementById('clientZipcode');
            const addressEl = document.getElementById('clientAddress');
            const detailAddressEl = document.getElementById('clientDetailAddress');
            const messageEl = document.getElementById('clientMessage') || document.getElementById('clientMemo');

            if (!nameEl || !phoneEl) return;

            const name = nameEl.value.trim();
            const phone = phoneEl.value.trim();
            const zipcode = zipcodeEl ? zipcodeEl.value.trim() : '';
            const roadAddress = addressEl ? addressEl.value.trim() : '';
            const detailAddress = detailAddressEl ? detailAddressEl.value.trim() : '';
            const isEnglishForm = document.getElementById('clientMemo');
            const phoneDigits = phone.replace(/\D/g, '');
            const isValidKoreanMobile = /^010\d{8}$/.test(phoneDigits);

            if (!isValidKoreanMobile) {
                alert(isEnglishForm
                    ? 'Please enter a valid Korean mobile number. Example: 010-1234-5678'
                    : '연락처는 010으로 시작하는 휴대폰 번호로 입력해 주세요. 예: 010-1234-5678');
                phoneEl.focus();
                return;
            }

            const lastSubmitAt = Number(localStorage.getItem(LAST_SUBMIT_KEY) || 0);
            const remainingCooldown = SUBMIT_COOLDOWN_MS - (Date.now() - lastSubmitAt);
            if (remainingCooldown > 0) {
                const remainingSeconds = Math.ceil(remainingCooldown / 1000);
                alert(isEnglishForm
                    ? `Your inquiry was already submitted. Please try again in ${remainingSeconds} seconds.`
                    : `이미 문의가 접수되었습니다. ${remainingSeconds}초 후 다시 시도해 주세요.`);
                return;
            }
            
            // 우편번호, 기본주소, 상세주소를 결합하여 최종 전송용 주소 생성
            const address = roadAddress ? `(${zipcode}) ${roadAddress} ${detailAddress}` : '';
            const message = messageEl ? messageEl.value.trim() : '';
            const selectedOptText = productSelect.options[productSelect.selectedIndex].text;
            const productVal = productSelect.value;

            // Map product value to DB constraint ('프리미엄', '데일리', '기타')
            const productMap = {
                'premium': '프리미엄',
                'classic': '데일리',
                'inquiry': '기타'
            };
            const dbProductInterest = productMap[productVal] || '기타';

            // 로딩 상태 표시
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = document.getElementById('clientMemo') ? 'Submitting...' : '제출 중...';
            }

            try {
                // Google Apps Script 웹 앱 URL (배포 후 아래 URL을 교체해 주세요)
                const googleWebAppUrl = 'https://script.google.com/macros/s/AKfycbysqfujLuPHtaunFRPHe0m4mFaZ0eIWOCC3hP-Zeid41Q55g8bFvZHol80R13fuMjJW5g/exec';
                
                if (googleWebAppUrl === 'YOUR_GOOGLE_WEB_APP_URL') {
                    alert(document.getElementById('clientMemo')
                        ? 'Google Web App URL is not configured yet. Please configure it in script.js.'
                        : '구글 웹 앱 URL이 설정되지 않았습니다. script.js 파일에서 URL을 설정해 주세요.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    }
                    return;
                }

                const response = await fetch(googleWebAppUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: JSON.stringify({
                        name: name,
                        contact: phone,
                        product_interest: dbProductInterest,
                        message: message,
                        address: address
                    })
                });

                if (!response.ok) {
                    throw new Error('데이터 전송 실패');
                }

                const result = await response.json();
                if (result.status !== 'success') {
                    throw new Error(result.message || '처리 중 오류가 발생했습니다.');
                }

                // 모달 필드에 데이터 반영
                if (summaryName) summaryName.textContent = name;
                if (summaryPhone) summaryPhone.textContent = phone;
                if (summaryProduct) summaryProduct.textContent = selectedOptText;

                // 성공 모달 표시
                successModal.classList.add('active');
                document.body.style.overflow = 'hidden'; // 배경 스크롤 고정
                localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()));

            } catch (error) {
                console.error(error);
                alert(document.getElementById('clientMemo') 
                    ? 'Failed to submit inquiry. Please try again.' 
                    : '문의 전송에 실패했습니다. 다시 시도해 주세요.');
            } finally {
                // 버튼 복구
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });

        // Close modal event
        const handleCloseModal = () => {
            successModal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scroll
            orderForm.reset(); // Clear form fields
        };

        if (closeModal) {
            closeModal.addEventListener('click', handleCloseModal);
        }

        // Close modal when clicking outside content area
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                handleCloseModal();
            }
        });
    }

    /* ==========================================
       6. Chart Bar Growth Animation
       ========================================== */
    const chartBars = document.querySelectorAll('.chart-bar-wrapper');

    if (chartBars.length > 0 && 'IntersectionObserver' in window) {
        const chartObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const wrapper = entry.target;
                    const bar = wrapper.querySelector('.chart-bar');
                    const targetHeight = wrapper.getAttribute('data-percentage');
                    
                    wrapper.classList.add('active');
                    if (bar && targetHeight) {
                        bar.style.height = `${targetHeight}%`;
                    }
                    observer.unobserve(wrapper);
                }
            });
        }, {
            threshold: 0.2
        });

        chartBars.forEach(bar => {
            chartObserver.observe(bar);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        chartBars.forEach(wrapper => {
            const bar = wrapper.querySelector('.chart-bar');
            const targetHeight = wrapper.getAttribute('data-percentage');
            wrapper.classList.add('active');
            if (bar && targetHeight) {
                bar.style.height = `${targetHeight}%`;
            }
        });
    }

    // FAQ Accordion Interaction
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // 다른 FAQ가 열려있다면 모두 닫기 (아코디언 단일 개폐)
            faqItems.forEach(innerItem => {
                innerItem.classList.remove('active');
                innerItem.querySelector('.faq-answer').style.maxHeight = '0px';
            });

            // 클릭한 항목 열기/닫기
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    /* ==========================================
       7. Daum Postcode API Integration
       ========================================== */
    const isEnglishPage = document.documentElement.lang === 'en' || !!document.getElementById('clientMemo');
    const btnFindZipcode = document.getElementById('btnFindZipcode');
    const clientZipcode = document.getElementById('clientZipcode');
    const clientAddress = document.getElementById('clientAddress');
    const clientDetailAddress = document.getElementById('clientDetailAddress');

    const openPostcode = () => {
        if (typeof daum === 'undefined') {
            alert(isEnglishPage 
                ? 'Address search service is loading. Please try again in a moment.' 
                : '우편번호 서비스가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        new daum.Postcode({
            language: isEnglishPage ? 'eng' : 'ko',
            oncomplete: function(data) {
                if (clientZipcode) clientZipcode.value = data.zonecode;
                if (clientAddress) {
                    clientAddress.value = isEnglishPage ? data.addressEnglish : data.roadAddress;
                }
                if (clientDetailAddress) {
                    clientDetailAddress.focus();
                }
            }
        }).open();
    };

    if (btnFindZipcode) btnFindZipcode.addEventListener('click', openPostcode);
    if (clientZipcode) clientZipcode.addEventListener('click', openPostcode);
    if (clientAddress) clientAddress.addEventListener('click', openPostcode);
});
