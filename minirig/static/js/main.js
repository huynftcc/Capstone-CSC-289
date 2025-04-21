// Main JavaScript file for MiniRig website

document.addEventListener('DOMContentLoaded', function() {
    // Image slider functionality
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    
    // Function to show a specific slide
    function showSlide(index) {
        // Remove active class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current slide and dot
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        
        // Update current slide index
        currentSlide = index;
    }
    
    // Set up automatic rotation
    let slideInterval = setInterval(function() {
        let nextSlide = (currentSlide + 1) % slides.length;
        showSlide(nextSlide);
    }, 5000); // Change slide every 5 seconds
    
    // Set up click events for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            // Clear the automatic rotation
            clearInterval(slideInterval);
            
            // Show the clicked slide
            showSlide(index);
            
            // Reset the automatic rotation
            slideInterval = setInterval(function() {
                let nextSlide = (currentSlide + 1) % slides.length;
                showSlide(nextSlide);
            }, 5000);
        });
    });
    
    console.log('Image slider initialized with ' + slides.length + ' slides');
});