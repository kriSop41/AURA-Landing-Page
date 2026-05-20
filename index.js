// Helper for random colors
const randomColors = (count) => {
    return new Array(count)
        .fill(0)
        .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
};

// --- UPI Donation Setup ---
const UPI_DONATION_SETTINGS = {
    payeeAddress: "suyashu@fam",
    payeeName: "Suyash Vishwakarma",
    transactionNote: "Support AURA",
    currency: "INR"
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Donate Modal + UPI ---
    const donateModal = document.getElementById('donate-modal');
    const openDonateModalBtn = document.getElementById('open-donate-modal');
    const donateActionBtn = document.getElementById('donate-action-btn');
    const donateQrImage = document.getElementById('donate-qr-image');
    const downloadQrBtn = document.getElementById('download-qr-btn');
    const apkGuideModal = document.getElementById('apk-guide-modal');
    const openApkGuideModalBtn = document.getElementById('open-apk-guide-modal');
    const apkCloseTargets = document.querySelectorAll('[data-apk-close]');
    const upiIdText = document.getElementById('upi-id-text');
    const copyUpiIdBtn = document.getElementById('copy-upi-id-btn');
    const donateCloseTargets = document.querySelectorAll('[data-donate-close]');
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const networkInfo = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const hasDataSaver = Boolean(networkInfo && networkInfo.saveData);
    const deviceMemory = Number(navigator.deviceMemory || 0);
    const logicalCores = Number(navigator.hardwareConcurrency || 0);
    const isLikelyMobile = isTouchDevice;
    const isVeryLowResourceDevice =
        (deviceMemory > 0 && deviceMemory <= 2) ||
        (logicalCores > 0 && logicalCores <= 2);
    const isLowResourceMobile =
        isLikelyMobile &&
        ((deviceMemory > 0 && deviceMemory <= 4) ||
            (logicalCores > 0 && logicalCores <= 4));
    const shouldUseLiteMode =
        hasDataSaver ||
        isVeryLowResourceDevice;
    const isLowEndDevice =
        shouldUseLiteMode ||
        isLowResourceMobile;

    // Respect OS accessibility preference without forcing full lite mode on desktop.
    if (prefersReducedMotion) {
        document.body.classList.add('reduced-motion-mode');
    }

    if (shouldUseLiteMode) {
        document.body.classList.add('lite-mode');
    }

    const buildUpiUri = () => {
        const upiPayload = {
            pa: UPI_DONATION_SETTINGS.payeeAddress,
            pn: UPI_DONATION_SETTINGS.payeeName,
            tn: UPI_DONATION_SETTINGS.transactionNote,
            cu: UPI_DONATION_SETTINGS.currency
        };

        const upiParams = new URLSearchParams(upiPayload);
        return `upi://pay?${upiParams.toString()}`;
    };

    const upiUri = buildUpiUri();
    const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=520x520&margin=24&data=${encodeURIComponent(upiUri)}`;

    if (donateQrImage) {
        donateQrImage.src = upiQrUrl;
    }

    if (downloadQrBtn) {
        downloadQrBtn.href = upiQrUrl;
    }

    if (upiIdText) {
        upiIdText.textContent = UPI_DONATION_SETTINGS.payeeAddress;
    }

    const syncBodyModalState = () => {
        const hasOpenModal =
            (donateModal && donateModal.classList.contains('is-open')) ||
            (apkGuideModal && apkGuideModal.classList.contains('is-open'));
        document.body.classList.toggle('modal-open', Boolean(hasOpenModal));
    };

    const openDonateModal = () => {
        if (!donateModal) return;
        donateModal.classList.add('is-open');
        donateModal.setAttribute('aria-hidden', 'false');
        syncBodyModalState();
    };

    const closeDonateModal = () => {
        if (!donateModal) return;
        donateModal.classList.remove('is-open');
        donateModal.setAttribute('aria-hidden', 'true');
        syncBodyModalState();
    };

    const openApkGuideModal = () => {
        if (!apkGuideModal) return;
        apkGuideModal.classList.add('is-open');
        apkGuideModal.setAttribute('aria-hidden', 'false');
        syncBodyModalState();
    };

    const closeApkGuideModal = () => {
        if (!apkGuideModal) return;
        apkGuideModal.classList.remove('is-open');
        apkGuideModal.setAttribute('aria-hidden', 'true');
        syncBodyModalState();
    };

    const launchDonationCheckout = () => {
        if (!UPI_DONATION_SETTINGS.payeeAddress) {
            alert('UPI ID is missing. Please update it in index.js.');
            return;
        }

        window.location.href = upiUri;

        if (!isTouchDevice) {
            alert('If no app opens on desktop, scan the QR code with your phone UPI app.');
            return;
        }

        setTimeout(() => {
            alert('If this payment is blocked by UPI risk policy, choose Pay via Mobile Number in your UPI app or use the QR option in this popup.');
        }, 1100);
    };

    if (openDonateModalBtn) {
        openDonateModalBtn.addEventListener('click', openDonateModal);
    }

    if (donateActionBtn) {
        donateActionBtn.addEventListener('click', launchDonationCheckout);
    }

    if (openApkGuideModalBtn) {
        openApkGuideModalBtn.addEventListener('click', (event) => {
            event.preventDefault();
            openApkGuideModal();
        });
    }

    if (copyUpiIdBtn) {
        copyUpiIdBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(UPI_DONATION_SETTINGS.payeeAddress);
                copyUpiIdBtn.textContent = 'UPI ID Copied';
                setTimeout(() => {
                    copyUpiIdBtn.textContent = 'Copy UPI ID';
                }, 1400);
            } catch (error) {
                alert('Could not copy UPI ID automatically. Please copy: ' + UPI_DONATION_SETTINGS.payeeAddress);
            }
        });
    }

    donateCloseTargets.forEach((target) => {
        target.addEventListener('click', closeDonateModal);
    });

    apkCloseTargets.forEach((target) => {
        target.addEventListener('click', closeApkGuideModal);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && donateModal && donateModal.classList.contains('is-open')) {
            closeDonateModal();
        }
        if (event.key === 'Escape' && apkGuideModal && apkGuideModal.classList.contains('is-open')) {
            closeApkGuideModal();
        }
    });

    // --- Tubes Background Initialization ---
    const canvas = document.getElementById('tubes-canvas');
    let tubesApp = null;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isPhoneViewport = window.matchMedia('(max-width: 900px)').matches;
    const shouldUseMobileBackground = (isCoarsePointer && isPhoneViewport) || isLowEndDevice;
    const shouldEnableTubes = canvas && !shouldUseMobileBackground && !isLowEndDevice;

    if (shouldEnableTubes) {
        let isMounted = true;

        import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js')
            .then((module) => {
                if (!isMounted || !canvas) return;

                const TubesCursor = module.default;
                tubesApp = TubesCursor(canvas, {
                    sleepRadiusX: 220,
                    sleepRadiusY: 110,
                    tubes: {
                        count: 14,
                        minRadius: 0.003,
                        maxRadius: 0.022,
                        minTubularSegments: 48,
                        maxTubularSegments: 96,
                        lerp: 0.42,
                        noise: 0.04,
                        colors: ["#f967fb", "#53bc28", "#6958d5"],
                        lights: {
                            intensity: 200,
                            colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]
                        }
                    }
                });

                if (tubesApp?.three?.camera) {
                    tubesApp.three.camera.position.z = 6.4;
                    tubesApp.three.camera.updateProjectionMatrix();
                    tubesApp.three.updateWorldSize?.();
                }

                document.body.classList.add('tubes-ready');
            })
            .catch((err) => {
                console.error('Failed to load tubes cursor:', err);
            });

        // Randomize colors on click
        document.addEventListener('click', (e) => {
            if (!tubesApp || prefersReducedMotion) return;
            // Don't randomize if clicking on interactive elements
            if (e.target.closest('a') || e.target.closest('button') || e.target.closest('.choice-card')) return;

            tubesApp.tubes.setColors(randomColors(3));
            tubesApp.tubes.setLightsColors(randomColors(4));
        });

        window.addEventListener('beforeunload', () => {
            isMounted = false;
        });
    }

    // --- Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.reveal');

    if (shouldUseLiteMode) {
        revealElements.forEach((el) => el.classList.add('active'));
    } else {
        const revealOnScroll = () => {
            revealElements.forEach((el, index) => {
                const rect = el.getBoundingClientRect();
                const viewHeight = window.innerHeight;
                if (rect.top < viewHeight * 0.85) {
                    // Add a small stagger delay if it's a feature item
                    if (el.classList.contains('feature-item')) {
                        el.style.transitionDelay = `${index * 0.1}s`;
                    }
                    el.classList.add('active');
                }
            });
        };

        window.addEventListener('scroll', revealOnScroll, { passive: true });
        revealOnScroll(); // Initial check
    }

    // --- 3D card tilt (desktop / fine pointer only) ---
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (hasFinePointer && !prefersReducedMotion && !isLowEndDevice) {
        const tiltElements = document.querySelectorAll('.choice-card, .feature-item');

        tiltElements.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const intensity = card.classList.contains('choice-card') ? 14 : 20;
                const lift = card.classList.contains('choice-card') ? 12 : 8;
                const scale = card.classList.contains('choice-card') ? 1.025 : 1.015;

                const rotateX = -((y - centerY) / intensity);
                const rotateY = (x - centerX) / intensity;
                const glareX = `${(x / rect.width) * 100}%`;
                const glareY = `${(y / rect.height) * 100}%`;

                card.style.setProperty('--glare-x', glareX);
                card.style.setProperty('--glare-y', glareY);
                card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-${lift}px) scale(${scale})`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.removeProperty('--glare-x');
                card.style.removeProperty('--glare-y');
            });
        });
    }

    // --- Custom Cursor (desktop / fine pointer only) ---
    if (hasFinePointer && !isLowEndDevice) {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);

        document.addEventListener('mousemove', (e) => {
            // Normal cursor follow
            requestAnimationFrame(() => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            });
        });

        // Cursor interaction
        const interactiveElements = document.querySelectorAll('a, button, .choice-card, .feature-item');
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('hover');
            });
        });
    }

    // --- 3D Mockup Scroll Animation ---
    const monitorMockup = document.getElementById('monitor-mockup');
    const phoneMockup = document.getElementById('phone-mockup');

    if (!isLowEndDevice && !prefersReducedMotion) {
        let ticking = false;
        const onScrollParallax = () => {
            if (ticking || !monitorMockup || !phoneMockup) return;
            ticking = true;
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                // Calculate tilt based on scroll
                const monitorRotY = 15 - scrollY * 0.02;
                const monitorRotX = 5 - scrollY * 0.01;
                const monitorTransY = scrollY * 0.05;
                monitorMockup.style.transform = `translate(-50%, calc(-50% + ${monitorTransY}px)) rotateY(${monitorRotY}deg) rotateX(${monitorRotX}deg)`;

                // Phone parallax
                const phoneRotY = -20 + scrollY * 0.03;
                const phoneRotX = 10 - scrollY * 0.02;
                const phoneTransY = scrollY * 0.1;
                phoneMockup.style.transform = `translate(0, calc(-50% + ${phoneTransY}px)) rotateY(${phoneRotY}deg) rotateX(${phoneRotX}deg) translateZ(100px)`;
                ticking = false;
            });
        };

        window.addEventListener('scroll', onScrollParallax, { passive: true });
        onScrollParallax();
    }
});
