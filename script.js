// ===== PARTICLE BACKGROUND =====
        (function() {
            const canvas = document.getElementById('particleCanvas');
            const ctx = canvas.getContext('2d');
            let particles = [];
            let mouse = { x: null, y: null };

            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }

            window.addEventListener('resize', resize);
            resize();

            document.addEventListener('mousemove', e => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            });

            class Particle {
                constructor() {
                    this.reset();
                }

                reset() {
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height;
                    this.size = Math.random() * 2 + 0.5;
                    this.speedX = (Math.random() - 0.5) * 0.4;
                    this.speedY = (Math.random() - 0.5) * 0.4;
                    this.opacity = Math.random() * 0.5 + 0.1;
                }

                update() {
                    this.x += this.speedX;
                    this.y += this.speedY;

                    if (mouse.x != null) {
                        const dx = mouse.x - this.x;
                        const dy = mouse.y - this.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 120) {
                            this.x -= dx * 0.008;
                            this.y -= dy * 0.008;
                        }
                    }

                    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                        this.reset();
                    }
                }

                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(247, 147, 26, ${this.opacity})`;
                    ctx.fill();
                }
            }

            const count = Math.min(80, Math.floor(window.innerWidth / 15));
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }

            function connectParticles() {
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 150) {
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(247, 147, 26, ${0.06 * (1 - dist / 150)})`;
                            ctx.lineWidth = 0.5;
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                        }
                    }
                }
            }

            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(p => { p.update(); p.draw(); });
                connectParticles();
                requestAnimationFrame(animate);
            }

            animate();
        })();

        // ===== NAVBAR SCROLL =====
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });

        // ===== MOBILE MENU =====
        const mobileToggle = document.getElementById('mobileToggle');
        const navLinks = document.getElementById('navLinks');
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('open'));
        });

        // ===== SCROLL REVEAL =====
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.reveal, .timeline-item').forEach(el => observer.observe(el));

        // ===== FAQ ACCORDION =====
        document.querySelectorAll('.faq-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.parentElement;
                const wasActive = item.classList.contains('active');
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                if (!wasActive) item.classList.add('active');
            });
        });

        // ===== PRICE DATA =====
        let priceHistory = [];

        async function fetchPrice() {
            try {
                const [priceRes, tickerRes] = await Promise.all([
                    fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
                    fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT')
                ]);
                const priceData = await priceRes.json();
                const tickerData = await tickerRes.json();

                const price = parseFloat(priceData.price);
                const change = parseFloat(tickerData.priceChangePercent);
                const marketCap = price * 19700000; // ~aprox. coins in circulation

                document.getElementById('btcPrice').textContent = price.toLocaleString('en-US', {
                    style: 'currency', currency: 'USD', maximumFractionDigits: 0
                });

                const changeEl = document.getElementById('btcChange');
                changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                changeEl.className = `ticker-change ${change >= 0 ? 'up' : 'down'}`;

                document.getElementById('statMarketCap').textContent = `$${(marketCap / 1e12).toFixed(2)}T`;

                priceHistory.push(price);
                if (priceHistory.length > 30) priceHistory.shift();
                drawSparkline();

            } catch (e) {
                document.getElementById('btcPrice').textContent = 'Erro';
                console.error(e);
            }
        }

        function drawSparkline() {
            const canvas = document.getElementById('sparkline');
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;

            canvas.width = canvas.offsetWidth * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            ctx.scale(dpr, dpr);

            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            const data = priceHistory;
            if (data.length < 2) return;

            const min = Math.min(...data);
            const max = Math.max(...data);
            const range = max - min || 1;

            ctx.clearRect(0, 0, w, h);

            // Gradient fill
            const gradient = ctx.createLinearGradient(0, 0, 0, h);
            gradient.addColorStop(0, 'rgba(247, 147, 26, 0.3)');
            gradient.addColorStop(1, 'rgba(247, 147, 26, 0)');

            ctx.beginPath();
            data.forEach((val, i) => {
                const x = (i / (data.length - 1)) * w;
                const y = h - ((val - min) / range) * (h - 4) - 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });

            // Fill area
            const lastX = w;
            const firstX = 0;
            ctx.lineTo(lastX, h);
            ctx.lineTo(firstX, h);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            // Line
            ctx.beginPath();
            data.forEach((val, i) => {
                const x = (i / (data.length - 1)) * w;
                const y = h - ((val - min) / range) * (h - 4) - 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = '#f7931a';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        fetchPrice();
        setInterval(fetchPrice, 10000);