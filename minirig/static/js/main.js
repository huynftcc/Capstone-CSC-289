// Main JavaScript file for MiniRig website

document.addEventListener('DOMContentLoaded', function() {
    // Image slider functionality (basic implementation)
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    
    // If there are multiple slides, set up automatic rotation
    if (slides.length > 1) {
        setInterval(function() {
            // Hide current slide
            slides[currentSlide].style.opacity = '0';
            
            // Move to next slide
            currentSlide = (currentSlide + 1) % slides.length;
            
            // Show new slide
            slides[currentSlide].style.opacity = '1';
        }, 5000); // Change slide every 5 seconds
    }
    
    // Responsive navigation for mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav ul');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
    
    console.log('Main JS loaded');
});