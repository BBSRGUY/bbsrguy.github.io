// EmailJS Integration for Contact Form
document.addEventListener('DOMContentLoaded', function() {
    // Initialize EmailJS with your public key
    // Replace 'YOUR_PUBLIC_KEY' with the actual public key from your EmailJS account
    emailjs.init('Tbznz76gO3muTKbU6');
    
    // Get the contact form element
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
      console.log("Contact form found and initialized");
      
      // Add submit event listener to the form
      contactForm.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Form submitted");
        
        // Debug form values
        const nameValue = document.getElementById('name').value;
        const emailValue = document.getElementById('email').value;
        const subjectValue = document.getElementById('subject').value;
        const messageValue = document.getElementById('message').value;
        
        console.log("Form values:", {
          name: nameValue,
          email: emailValue,
          subject: subjectValue,
          message: messageValue
        });
        
        // Show loading state
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        // Create template parameters - using the form directly for better data collection
        const templateParams = {
          name: nameValue,
          email: emailValue,
          subject: subjectValue,
          message: messageValue,
          // Ensure these are included for EmailJS to work correctly
          from_name: nameValue,
          reply_to: emailValue
        };
        
        console.log("Sending with params:", templateParams);
        
        // IMPORTANT: Make sure these IDs match exactly what's in your EmailJS dashboard
        const SERVICE_ID = 'service_vcl997p'; // Verify this matches your dashboard
        const TEMPLATE_ID = 'template_2tf47vl';   // Verify this matches your template name
        
        // Validate form data before sending
        if (!nameValue || !emailValue || !messageValue) {
          console.error("Form validation failed - missing required fields");
          showFormMessage(false, 'Please fill out all required fields.');
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }
        
        // Send the email using EmailJS
        emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
          .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            
            // Show success message
            showFormMessage(true, 'Your message has been sent successfully!');
            
            // Reset form
            contactForm.reset();
          })
          .catch(function(error) {
            console.log('FAILED...', error);
            
            // Show detailed error message
            let errorMsg = 'Failed to send message. ';
            
            if (error.status === 400) {
              errorMsg += 'Please verify your EmailJS service ID and template ID are correct.';
            } else if (error.status === 401 || error.status === 403) {
              errorMsg += 'Authentication error. Please check your public key.';
            } else {
              errorMsg += 'Please try again later.';
            }
            
            showFormMessage(false, errorMsg);
          })
          .finally(function() {
            // Restore button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
          });
      });
    } else {
      console.error("Contact form element not found");
    }
    
    // Function to show success/error messages
    function showFormMessage(isSuccess, message) {
      // Find contact form again in case we're in a different scope
      const contactForm = document.getElementById('contact-form');
      if (!contactForm) return;
      
      // Find or create message element
      let messageElement = document.getElementById('form-message');
      
      if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'form-message';
        contactForm.appendChild(messageElement);
      }
      
      // Style the message
      messageElement.className = isSuccess ? 'form-message success' : 'form-message error';
      messageElement.textContent = message;
      
      // Style based on success/error
      messageElement.style.padding = '10px 15px';
      messageElement.style.marginTop = '15px';
      messageElement.style.borderRadius = '5px';
      messageElement.style.color = '#fff';
      messageElement.style.backgroundColor = isSuccess ? '#4CAF50' : '#F44336';
      messageElement.style.opacity = '1';
      messageElement.style.transition = 'opacity 0.3s ease';
      
      // Hide message after 5 seconds
      setTimeout(function() {
        messageElement.style.opacity = '0';
      }, 5000);
    }
  });