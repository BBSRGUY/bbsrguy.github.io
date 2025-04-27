document.addEventListener('DOMContentLoaded', function () {
    handlePreloader();
    initThreeJsBackground();
    initSmoothScrolling();
    initMobileMenu();
    initArchitectureSection();
    initDemoSection();
    initContactForm();
    initParallaxEffects();
    initScrollAnimations();
    initTypingEffects();
    initAudioFeedback();
    initStatsCounter();
    initScrollIndicator();
  });
  
  /* Preloader */
  function handlePreloader() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
      setTimeout(() => {
        preloader.style.opacity = '0';
        preloader.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 500);
      }, 1000);
    }
  }
  
  /* Mobile Menu */
  function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', function () {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
        if (this.classList.contains('active')) {
          this.querySelector('.bar:nth-child(1)').style.transform = 'translateY(8px) rotate(45deg)';
          this.querySelector('.bar:nth-child(2)').style.opacity = '0';
          this.querySelector('.bar:nth-child(3)').style.transform = 'translateY(-8px) rotate(-45deg)';
        } else {
          this.querySelector('.bar:nth-child(1)').style.transform = 'none';
          this.querySelector('.bar:nth-child(2)').style.opacity = '1';
          this.querySelector('.bar:nth-child(3)').style.transform = 'none';
        }
      });
    }
  }
  
  /* Stats Counter Animation */
  function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    let animated = false;
    function animateStats() {
      if (animated) return;
      statNumbers.forEach(stat => {
        const rect = stat.getBoundingClientRect();
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          const targetCount = parseInt(stat.getAttribute('data-count'), 10);
          const duration = 2000;
          const startTime = Date.now();
          const startValue = parseInt(stat.textContent, 10) || 0;
          function updateCount() {
            const currentTime = Date.now();
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentCount = Math.floor(startValue + (targetCount - startValue) * easeProgress);
            stat.textContent = currentCount;
            if (progress < 1) requestAnimationFrame(updateCount);
          }
          updateCount();
          animated = true;
        }
      });
    }
    window.addEventListener('scroll', animateStats);
    setTimeout(animateStats, 1000);
  }
  
  /* Three.js Background Animation */
  function initThreeJsBackground() {
    const canvas = document.getElementById('background-canvas');
    if (!canvas || typeof THREE === 'undefined') {
      console.warn('Three.js canvas element not found or THREE is undefined');
      return;
    }
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 0, 5);
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 1500;
      const posArray = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 15;
      }
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const particlesMaterial1 = new THREE.PointsMaterial({
        size: 0.03,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const particlesMaterial2 = new THREE.PointsMaterial({
        size: 0.02,
        color: 0xcccccc,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      const particlesMesh1 = new THREE.Points(particlesGeometry, particlesMaterial1);
      const particlesMesh2 = new THREE.Points(particlesGeometry.clone(), particlesMaterial2);
      scene.add(particlesMesh1);
      scene.add(particlesMesh2);
      // Create grid lines for futuristic effect
      const gridGeometry = new THREE.BufferGeometry();
      const gridVertices = [];
      const gridSize = 5;
      const gridDivisions = 10;
      const step = gridSize / gridDivisions;
      for (let i = -gridSize / 2; i <= gridSize / 2; i += step) {
        gridVertices.push(-gridSize / 2, i, 0);
        gridVertices.push(gridSize / 2, i, 0);
        gridVertices.push(i, -gridSize / 2, 0);
        gridVertices.push(i, gridSize / 2, 0);
      }
      gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
      const gridMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.05
      });
      const gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
      scene.add(gridLines);
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      const clock = new THREE.Clock();
      const animate = () => {
        const elapsedTime = clock.getElapsedTime();
        particlesMesh1.rotation.x = elapsedTime * 0.05;
        particlesMesh1.rotation.y = elapsedTime * 0.03;
        particlesMesh2.rotation.x = -elapsedTime * 0.03;
        particlesMesh2.rotation.y = -elapsedTime * 0.02;
        gridLines.rotation.x = elapsedTime * 0.01;
        gridLines.rotation.y = elapsedTime * 0.02;
        if (window.mouseX !== undefined && window.mouseY !== undefined) {
          particlesMesh1.rotation.x += window.mouseY * 0.0001;
          particlesMesh1.rotation.y += window.mouseX * 0.0001;
          particlesMesh2.rotation.x -= window.mouseY * 0.0001;
          particlesMesh2.rotation.y -= window.mouseX * 0.0001;
        }
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
      animate();
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
      window.addEventListener('mousemove', (event) => {
        window.mouseX = event.clientX - window.innerWidth / 2;
        window.mouseY = event.clientY - window.innerHeight / 2;
      });
    } catch (error) {
      console.error('Error initializing Three.js:', error);
    }
  }
  
  /* Smooth Scrolling for Navigation and CTA Buttons */
  function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (!targetSection) {
          console.warn(`Target section ${targetId} not found`);
          return;
        }
        // Close mobile menu if open
        const navLinksContainer = document.querySelector('.nav-links');
        const menuToggle = document.querySelector('.menu-toggle');
        if (navLinksContainer && navLinksContainer.classList.contains('active')) {
          navLinksContainer.classList.remove('active');
          menuToggle.classList.remove('active');
        }
        window.scrollTo({
          top: targetSection.offsetTop - 80,
          behavior: 'smooth'
        });
      });
    });
    // CTA buttons
    const tryOdenBtn = document.querySelector('.cta-primary');
    const learnMoreBtn = document.querySelector('.cta-secondary');
    if (tryOdenBtn) {
      tryOdenBtn.addEventListener('click', () => {
        const demoSection = document.querySelector('#demo');
        if (demoSection) {
          demoSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
    if (learnMoreBtn) {
      learnMoreBtn.addEventListener('click', () => {
        const aboutSection = document.querySelector('#about');
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }
  
  /* Scroll Indicator */
  function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
      scrollIndicator.addEventListener('click', () => {
        const nextSection = document.querySelector('#about');
        if (nextSection) {
          nextSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }
  
  /* Architecture Section Interaction */
  function initArchitectureSection() {
    const layers = document.querySelectorAll('.layer');
    const detailPanels = document.querySelectorAll('.detail-panel');
    if (!layers.length || !detailPanels.length) {
      console.warn('Architecture layers or detail panels not found');
      return;
    }
    layers.forEach(layer => {
      layer.addEventListener('click', function () {
        const layerName = this.getAttribute('data-layer');
        if (!layerName) return;
        const targetPanel = document.getElementById(`detail-${layerName.replace(/\s+/g, '-')}`);
        if (!targetPanel) return;
        detailPanels.forEach(panel => {
          if (panel.classList.contains('active')) {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(10px)';
            setTimeout(() => {
              panel.classList.remove('active');
              panel.style.opacity = '1';
              panel.style.transform = 'translateY(0)';
            }, 300);
          }
        });
        setTimeout(() => {
          targetPanel.classList.add('active');
          targetPanel.style.opacity = '0';
          targetPanel.style.transform = 'translateY(10px)';
          setTimeout(() => {
            targetPanel.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            targetPanel.style.opacity = '1';
            targetPanel.style.transform = 'translateY(0)';
          }, 50);
        }, 300);
      });
    });
    if (layers.length > 0 && detailPanels.length > 0) {
      setTimeout(() => {
        layers[0].click();
      }, 500);
    }
  }
  
  /* Demo Section Functionality */
  function initDemoSection() {
    // Demo section initialization (language toggle, task selection, input typing effects, etc.)
    // The code below is adapted from your original implementation and enhanced as needed.
    const languageSwitch = document.getElementById('language-switch');
    const englishLabel = document.getElementById('english-label');
    const odiaLabel = document.getElementById('odia-label');
    const inputLanguage = document.getElementById('input-language');
    const outputLanguage = document.getElementById('output-language');
    const demoInput = document.getElementById('demo-input');
    const demoOutput = document.getElementById('demo-output');
    const outputText = document.querySelector('.output-text');
    const submitBtn = document.getElementById('submit-btn');
    const loadingAnimation = document.querySelector('.loading-animation');
    const taskBtns = document.querySelectorAll('.task-btn');
    const promptPills = document.querySelectorAll('.prompt-pill');
    const clearBtn = document.querySelector('.clear-btn');
    const copyBtn = document.querySelector('.copy-btn');
  
    if (!languageSwitch || !demoInput || !demoOutput || !submitBtn) return;
  
    languageSwitch.addEventListener('change', function () {
      // Animation and language label changes on toggle
      if (this.checked) {
        if (englishLabel) englishLabel.style.opacity = '0';
        if (odiaLabel) odiaLabel.style.opacity = '1';
        if (inputLanguage) animateTextChange(inputLanguage, 'ଓଡ଼ିଆ');
        if (outputLanguage) animateTextChange(outputLanguage, 'English');
        setTimeout(() => {
          demoInput.setAttribute('placeholder', 'ଏଠାରେ ଆପଣଙ୍କର ଇନପୁଟ୍ ଟାଇପ୍ କରନ୍ତୁ...');
        }, 150);
      } else {
        if (englishLabel) englishLabel.style.opacity = '1';
        if (odiaLabel) odiaLabel.style.opacity = '0.5';
        if (inputLanguage) animateTextChange(inputLanguage, 'English');
        if (outputLanguage) animateTextChange(outputLanguage, 'ଓଡ଼ିଆ');
        setTimeout(() => {
          demoInput.setAttribute('placeholder', 'Type your input here...');
        }, 150);
      }
      demoInput.value = '';
      outputText.textContent = '';
    });
  
    function animateTextChange(element, newText) {
      if (!element) return;
      element.style.opacity = '0';
      setTimeout(() => {
        element.textContent = newText;
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '1';
      }, 300);
    }
  
    if (taskBtns) {
      taskBtns.forEach(btn => {
        btn.addEventListener('click', function () {
          taskBtns.forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          const task = this.getAttribute('data-task');
          if (task) updatePlaceholder(task);
        });
      });
    }
  
    function updatePlaceholder(task) {
      let newPlaceholder = '';
      const isOdia = languageSwitch && languageSwitch.checked;
      if (isOdia) {
        switch (task) {
          case 'translation':
            newPlaceholder = 'ଅନୁବାଦ ପାଇଁ ଓଡ଼ିଆ ପାଠ୍ୟ ଲେଖନ୍ତୁ...';
            break;
          case 'conversation':
            newPlaceholder = 'ଏକ ବାର୍ତ୍ତାଳାପ ଆରମ୍ଭ କରନ୍ତୁ...';
            break;
          case 'creative':
            newPlaceholder = 'ସୃଜନଶୀଳ ଲେଖା ପାଇଁ ନିର୍ଦ୍ଦେଶ ଦିଅନ୍ତୁ...';
            break;
          case 'coding':
            newPlaceholder = 'କୋଡିଂ ନିର୍ଦ୍ଦେଶ ଲେଖନ୍ତୁ...';
            break;
          default:
            newPlaceholder = 'ଏଠାରେ ଆପଣଙ୍କର ଇନପୁଟ୍ ଟାଇପ୍ କରନ୍ତୁ...';
        }
      } else {
        switch (task) {
          case 'translation':
            newPlaceholder = 'Enter English text for translation...';
            break;
          case 'conversation':
            newPlaceholder = 'Start a conversation...';
            break;
          case 'creative':
            newPlaceholder = 'Enter a creative writing prompt...';
            break;
          case 'coding':
            newPlaceholder = 'Describe the code you need...';
            break;
          default:
            newPlaceholder = 'Type your input here...';
        }
      }
      demoInput.style.opacity = '0.7';
      setTimeout(() => {
        demoInput.setAttribute('placeholder', newPlaceholder);
        demoInput.style.opacity = '1';
      }, 150);
    }
  
    if (promptPills) {
      promptPills.forEach(pill => {
        pill.addEventListener('click', function () {
          const promptText = this.getAttribute('data-prompt');
          if (!promptText) return;
          demoInput.value = '';
          let i = 0;
          const typingSpeed = 15;
          demoInput.focus();
          const typingEffect = setInterval(() => {
            if (i < promptText.length) {
              demoInput.value += promptText.charAt(i);
              i++;
            } else {
              clearInterval(typingEffect);
            }
          }, typingSpeed);
        });
      });
    }
  
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        const inputText = demoInput.value.trim();
        if (inputText === '') return;
        // Show loading animation
        outputText.textContent = '';
        loadingAnimation.style.display = 'flex';
        loadingAnimation.style.opacity = '1';
        setTimeout(() => {
          loadingAnimation.style.opacity = '0';
          loadingAnimation.style.display = 'none';
          generateResponse(inputText);
        }, 1500);
      });
    }
  
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        demoInput.value = '';
        demoInput.focus();
      });
    }
  
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        const textToCopy = outputText.textContent;
        if (textToCopy) {
          navigator.clipboard.writeText(textToCopy);
        }
      });
    }
  
    function generateResponse(input) {
      if (!outputText) return;
      const isOdia = languageSwitch && languageSwitch.checked;
      const activeTask = document.querySelector('.task-btn.active');
      if (!activeTask) return;
      const taskType = activeTask.getAttribute('data-task');
      let response = '';
      // Simulated responses – replace with your backend integration as needed.
      if (isOdia) {
        switch (taskType) {
          case 'translation':
            response = input.includes('ମୋ ସହର') ?
              "Write a small paragraph about my city." :
              "The translated text will appear here.";
            break;
          case 'conversation':
            response = "I understand your message in Odia. How can I help further?";
            break;
          case 'creative':
            response = "Based on your creative prompt, here is a story...";
            break;
          case 'coding':
            response = "// Code generated based on your request in Odia\nfunction greet() { console.log('ନମସ୍କାର, ବିଶ୍ୱ!'); }";
            break;
          default:
            response = "How can I assist you further?";
        }
      } else {
        switch (taskType) {
          case 'translation':
            response = input.includes('morning sun') ?
              "ସକାଳର ସୂର୍ଯ୍ୟ ନଦୀରେ ଝଲମଲ କରେ।" :
              "Translated text will appear here.";
            break;
          case 'conversation':
            response = "I understand your message. How can I help you?";
            break;
          case 'creative':
            response = "Here is a creative story based on your prompt...";
            break;
          case 'coding':
            response = input.includes('prime numbers') ?
              "// Function to find prime numbers\nfunction isPrime(num) { if(num<2)return false; for(let i=2;i<=Math.sqrt(num);i++){ if(num%i===0)return false; } return true; }" :
              "// Code generated based on your request\nfunction greet() { console.log('Hello, world!'); }";
            break;
          default:
            response = "How can I help you further?";
        }
      }
      // Display response with a typing effect
      let i = 0;
      const typingSpeed = 20;
      outputText.textContent = '';
      const cursor = document.createElement('span');
      cursor.textContent = '|';
      cursor.style.animation = 'blink 1s step-end infinite';
      outputText.appendChild(cursor);
      const typingEffect = setInterval(() => {
        if (i < response.length) {
          if (outputText.contains(cursor)) outputText.removeChild(cursor);
          outputText.textContent += response.charAt(i);
          outputText.appendChild(cursor);
          i++;
        } else {
          clearInterval(typingEffect);
          setTimeout(() => {
            if (outputText.contains(cursor)) outputText.removeChild(cursor);
          }, 3000);
        }
      }, typingSpeed);
    }
  
    const initialTaskBtn = document.querySelector('.task-btn.active');
    if (initialTaskBtn) {
      const initialTask = initialTaskBtn.getAttribute('data-task');
      if (initialTask) updatePlaceholder(initialTask);
    }
  }
  
  /* Contact Form Submission */
  function initContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;
    const formFields = contactForm.querySelectorAll('input, textarea');
    formFields.forEach(field => {
      field.addEventListener('focus', function () {
        if (this.parentElement) {
          this.parentElement.style.transform = 'translateY(-5px)';
          const label = this.parentElement.querySelector('label');
          if (label) {
            label.style.color = 'var(--primary-color)';
            label.style.opacity = '1';
          }
        }
      });
      field.addEventListener('blur', function () {
        if (this.parentElement && !this.value) {
          this.parentElement.style.transform = 'none';
          const label = this.parentElement.querySelector('label');
          if (label) {
            label.style.color = '';
            label.style.opacity = '0.8';
          }
        }
      });
    });
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      let valid = true;
      formFields.forEach(field => {
        if (field.required && !field.value.trim()) {
          valid = false;
          field.style.borderColor = 'rgba(255, 100, 100, 0.5)';
          field.style.backgroundColor = 'rgba(255, 0, 0, 0.05)';
          setTimeout(() => {
            field.style.borderColor = '';
            field.style.backgroundColor = '';
          }, 2000);
        }
        if (field.type === 'email' && field.value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(field.value.trim())) {
            valid = false;
            field.style.borderColor = 'rgba(255, 100, 100, 0.5)';
            field.style.backgroundColor = 'rgba(255, 0, 0, 0.05)';
            let errorMsg = field.parentElement.querySelector('.error-msg');
            if (!errorMsg) {
              errorMsg = document.createElement('div');
              errorMsg.className = 'error-msg';
              errorMsg.style.color = 'rgba(255, 100, 100, 0.8)';
              errorMsg.style.fontSize = '0.8rem';
              errorMsg.style.marginTop = '0.5rem';
              field.parentElement.appendChild(errorMsg);
            }
            errorMsg.textContent = 'Please enter a valid email address';
            setTimeout(() => {
              field.style.borderColor = '';
              field.style.backgroundColor = '';
              if (errorMsg.parentElement) errorMsg.parentElement.removeChild(errorMsg);
            }, 3000);
          }
        }
      });
      if (!valid) return;
      const submitButton = this.querySelector('.submit-btn');
      if (!submitButton) return;
      const originalText = submitButton.textContent;
      formFields.forEach(field => {
        field.disabled = true;
        field.style.opacity = '0.7';
      });
      submitButton.textContent = 'Sending...';
      setTimeout(() => {
        submitButton.style.backgroundColor = '#4CAF50';
        submitButton.textContent = 'Message Sent!';
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          input.style.opacity = '0';
          setTimeout(() => {
            input.value = '';
            input.style.opacity = '1';
            input.disabled = false;
          }, 500);
        });
        setTimeout(() => {
          submitButton.style.backgroundColor = '';
          submitButton.textContent = originalText;
        }, 3000);
      }, 1500);
    });
  }
  
  /* Parallax Effects */
  function initParallaxEffects() {
    window.addEventListener('scroll', function () {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const heroContent = document.querySelector('.hero-content');
      const modelShowcase = document.querySelector('.model-showcase');
      if (heroContent && modelShowcase) {
        heroContent.style.transform = `translateY(${scrollPosition * 0.2}px)`;
        modelShowcase.style.transform = `translateY(${scrollPosition * 0.1}px)`;
      }
      const sectionHeaders = document.querySelectorAll('.section-header');
      sectionHeaders.forEach(header => {
        const headerPosition = header.getBoundingClientRect().top + scrollPosition;
        const distanceFromViewport = headerPosition - scrollPosition;
        if (distanceFromViewport < windowHeight && distanceFromViewport > 0) {
          const parallaxValue = (windowHeight - distanceFromViewport) * 0.05;
          header.style.transform = `translateY(${-parallaxValue}px)`;
        }
      });
      const statCards = document.querySelectorAll('.stat-card');
      statCards.forEach(card => {
        const cardPosition = card.getBoundingClientRect().top + scrollPosition;
        const distanceFromViewport = cardPosition - scrollPosition;
        if (distanceFromViewport < windowHeight && distanceFromViewport > 0) {
          const parallaxValue = (windowHeight - distanceFromViewport) * 0.02;
          card.style.transform = `translateY(${-parallaxValue}px)`;
        }
      });
    });
    document.addEventListener('mousemove', function (e) {
      const mouseX = e.clientX / window.innerWidth - 0.5;
      const mouseY = e.clientY / window.innerHeight - 0.5;
      const modelCore = document.querySelector('.model-core');
      if (modelCore) {
        modelCore.style.transform = `translate(${mouseX * 20}px, ${mouseY * 20}px)`;
      }
      const orbits = document.querySelectorAll('.orbit');
      orbits.forEach((orbit, index) => {
        const factor = (index + 1) * 5;
        orbit.style.transform = `rotateX(${80 - index * 20}deg) rotateY(${10 + index * 25}deg) translate(${mouseX * factor}px, ${mouseY * factor}px)`;
      });
      const featureCards = document.querySelectorAll('.feature-card');
      featureCards.forEach(card => {
        const factor = 5;
        card.style.transform = `translate(${mouseX * factor}px, ${mouseY * factor}px)`;
      });
    });
  }
  
  /* Scroll-based Animations */
  function initScrollAnimations() {
    function isInViewport(element) {
      const rect = element.getBoundingClientRect();
      return (rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 && rect.bottom >= 0);
    }
    const animateElements = [
      { selector: '.feature-card', staggerDelay: 100 },
      { selector: '.stat-card', staggerDelay: 150 },
      { selector: '.layer', staggerDelay: 100 },
      { selector: '.use-case-card', staggerDelay: 150 },
      { selector: '.glass-card', staggerDelay: 0 }
    ];
    const style = document.createElement('style');
    style.textContent = `
      .animate-in { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s ease; }
      .animate-in.visible { opacity: 1; transform: translateY(0); }
    `;
    document.head.appendChild(style);
    animateElements.forEach(({ selector }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => element.classList.add('animate-in'));
    });
    function handleScrollAnimations() {
      animateElements.forEach(({ selector, staggerDelay }) => {
        const elements = document.querySelectorAll(selector + '.animate-in:not(.visible)');
        elements.forEach((element, index) => {
          if (isInViewport(element)) {
            setTimeout(() => {
              element.classList.add('visible');
            }, index * staggerDelay);
          }
        });
      });
    }
    handleScrollAnimations();
    window.addEventListener('scroll', handleScrollAnimations);
  }
  
  /* Typing Effects */
  function initTypingEffects() {
    const heroDescription = document.querySelector('.hero-description');
    if (heroDescription) {
      const originalText = heroDescription.textContent;
      heroDescription.textContent = '';
      setTimeout(() => {
        let i = 0;
        const typingSpeed = 30;
        const cursor = document.createElement('span');
        cursor.textContent = '|';
        cursor.style.animation = 'blink 1s step-end infinite';
        heroDescription.appendChild(cursor);
        const typingEffect = setInterval(() => {
          if (i < originalText.length) {
            heroDescription.insertBefore(document.createTextNode(originalText.charAt(i)), cursor);
            i++;
          } else {
            clearInterval(typingEffect);
            setTimeout(() => {
              if (heroDescription.contains(cursor)) heroDescription.removeChild(cursor);
            }, 2000);
          }
        }, typingSpeed);
      }, 1000);
    }
    const mainTitle = document.querySelector('.main-title');
    if (mainTitle) {
      const glitchLayer1 = document.createElement('div');
      glitchLayer1.className = 'glitch-layer layer1';
      glitchLayer1.textContent = mainTitle.textContent;
      const glitchLayer2 = document.createElement('div');
      glitchLayer2.className = 'glitch-layer layer2';
      glitchLayer2.textContent = mainTitle.textContent;
      const glitchStyle = document.createElement('style');
      glitchStyle.textContent = `
        .main-title { position: relative; }
        .glitch-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to right, #fff, #888); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .layer1 { animation: glitch-1 3s infinite linear alternate-reverse; clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%); }
        .layer2 { animation: glitch-2 2.7s infinite linear alternate-reverse; clip-path: polygon(0 80%, 100% 80%, 100% 100%, 0 100%); }
        @keyframes glitch-1 { 0%, 100% { transform: translate(0); } 20% { transform: translate(-2px, 1px); } 40% { transform: translate(2px, -1px); } 60% { transform: translate(-1px, -1px); } 80% { transform: translate(1px, 1px); } }
        @keyframes glitch-2 { 0%, 100% { transform: translate(0); } 25% { transform: translate(1px, -1px); } 50% { transform: translate(-1px, 1px); } 75% { transform: translate(1px, 1px); } }
      `;
      document.head.appendChild(glitchStyle);
      setTimeout(() => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        if (mainTitle.parentNode) {
          mainTitle.parentNode.insertBefore(wrapper, mainTitle);
          wrapper.appendChild(mainTitle);
          wrapper.appendChild(glitchLayer1);
          wrapper.appendChild(glitchLayer2);
        }
      }, 2000);
    }
  }
  
  /* Audio Feedback (if needed) */
  function initAudioFeedback() {
    // Production-ready implementation should load and play short feedback sounds on interaction.
    // For brevity, this function is a placeholder for your audio feedback integration.
  }
  
  