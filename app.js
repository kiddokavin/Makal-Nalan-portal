// State variables
const BACKEND_URL = window.location.hostname.includes('github.io') ? 'https://makal-nalan-portal.onrender.com' : '';
let currentStep = 1;
const totalSteps = 3;

// DOM Elements
const form = document.getElementById('grievanceForm');
const steps = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3')
];
const indicators = [
    document.getElementById('step1-indicator'),
    document.getElementById('step2-indicator'),
    document.getElementById('step3-indicator')
];
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const successScreen = document.getElementById('successScreen');
const displayTrackingId = document.getElementById('displayTrackingId');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const toast = document.getElementById('toast');

// Theme Initialisation
initTheme();

// Theme Toggle Listener
themeToggleBtn.addEventListener('click', toggleTheme);

// Handle Real-time input validation cleaning
document.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', () => {
        const group = input.closest('.form-group');
        if (group && group.classList.contains('invalid')) {
            group.classList.remove('invalid');
        }
    });
});

/**
 * Validates a single form step
 * @param {number} step 
 * @returns {boolean} isValid
 */
function validateStep(step) {
    let isValid = true;

    if (step === 1) {
        const name = document.getElementById('name');
        const contact = document.getElementById('contact');
        const email = document.getElementById('email');
        const district = document.getElementById('district');
        const address = document.getElementById('address');

        // Name Validation
        if (!name.value.trim()) {
            markInvalid(name);
            isValid = false;
        }

        // Contact Validation (10 digits check)
        const contactPattern = /^[0-9]{10}$/;
        if (!contactPattern.test(contact.value.trim())) {
            markInvalid(contact);
            isValid = false;
        }

        // Optional Email Validation
        if (email.value.trim() && !validateEmail(email.value.trim())) {
            markInvalid(email);
            isValid = false;
        }

        // District Validation
        if (!district.value) {
            markInvalid(district);
            isValid = false;
        }

        // Address Validation
        if (!address.value.trim()) {
            markInvalid(address);
            isValid = false;
        }
    } 
    else if (step === 2) {
        const department = document.getElementById('department');
        const subject = document.getElementById('subject');
        const complaintText = document.getElementById('complaintText');

        // Department Validation
        if (!department.value) {
            markInvalid(department);
            isValid = false;
        }

        // Subject Validation
        if (!subject.value.trim()) {
            markInvalid(subject);
            isValid = false;
        }

        // Complaint Text Validation
        if (!complaintText.value.trim()) {
            markInvalid(complaintText);
            isValid = false;
        }
    }

    return isValid;
}

/**
 * Marks a form group as invalid (displays error label)
 */
function markInvalid(element) {
    const group = element.closest('.form-group');
    if (group) {
        group.classList.add('invalid');
    }
}

/**
 * Basic Email validator
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Step navigation logic
 */
function navigateToStep(targetStep) {
    // Only validate forward movement
    if (targetStep > currentStep) {
        // Must validate the intermediate steps
        for (let i = currentStep; i < targetStep; i++) {
            if (!validateStep(i)) {
                showToast("தயவுசெய்து அனைத்து தேவையான விவரங்களையும் நிரப்பவும். / Please fill in all required fields.", "error");
                return;
            }
        }
    }

    // Update current step
    currentStep = targetStep;

    // Show active step section
    steps.forEach((stepEl, idx) => {
        if (idx + 1 === currentStep) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });

    // Update stepper header indicators
    indicators.forEach((indicator, idx) => {
        const stepNum = idx + 1;
        if (stepNum === currentStep) {
            indicator.className = 'stepper-item active';
        } else if (stepNum < currentStep) {
            indicator.className = 'stepper-item completed';
        } else {
            indicator.className = 'stepper-item';
        }
    });

    // If moving to step 3 (Review Step), populate the summary text details
    if (currentStep === 3) {
        populateReviewSummary();
    }

    // Scroll to form card top for usability on mobile
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Copy user inputs to step 3 Review summary panel
 */
function populateReviewSummary() {
    document.getElementById('review-name').innerText = document.getElementById('name').value;
    document.getElementById('review-contact').innerText = document.getElementById('contact').value;
    document.getElementById('review-email').innerText = document.getElementById('email').value || 'N/A';
    document.getElementById('review-district').innerText = document.getElementById('district').value;
    document.getElementById('review-address').innerText = document.getElementById('address').value;
    document.getElementById('review-department').innerText = document.getElementById('department').value;
    document.getElementById('review-subject').innerText = document.getElementById('subject').value;
    document.getElementById('review-text').innerText = document.getElementById('complaintText').value;
}

/**
 * Handle form submission
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const declaration = document.getElementById('declaration');
    if (!declaration.checked) {
        const decGroup = declaration.closest('.checkbox-container');
        document.getElementById('declaration-error').style.display = 'block';
        showToast("தயவுசெய்து உறுதிமொழி பெட்டியைத் தேர்ந்தெடுக்கவும். / Please accept the declaration.", "error");
        return;
    } else {
        document.getElementById('declaration-error').style.display = 'none';
    }

    // Show spinner & disable button
    submitBtn.disabled = true;
    btnText.innerText = "சமர்ப்பிக்கப்படுகிறது... / Submitting...";
    btnLoader.classList.remove('hidden');

    const formData = {
        name: document.getElementById('name').value.trim(),
        contact: document.getElementById('contact').value.trim(),
        email: document.getElementById('email').value.trim(),
        district: document.getElementById('district').value,
        address: document.getElementById('address').value.trim(),
        department: document.getElementById('department').value,
        subject: document.getElementById('subject').value.trim(),
        complaintText: document.getElementById('complaintText').value.trim()
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/complaints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Render success screen
            form.classList.add('hidden');
            successScreen.classList.remove('hidden');
            displayTrackingId.innerText = data.trackingId;
            showToast("புகார் வெற்றிகரமாகப் பதியப்பட்டது! / Grievance Registered!", "success");
        } else {
            throw new Error(data.error || 'Submission failed.');
        }

    } catch (error) {
        console.error("Submission Error:", error);
        showToast(error.message || "இணைப்பு பிழை! மீண்டும் முயலவும். / Connection error! Try again.", "error");
        
        // Reset button state on failure
        submitBtn.disabled = false;
        btnText.innerText = "புகாரைப் பதிவு செய்க / Submit Complaint";
        btnLoader.classList.add('hidden');
    }
});

/**
 * Reset form fields to support adding a new grievance
 */
function resetForm() {
    form.reset();
    currentStep = 1;
    
    // Reset validations and screens
    document.querySelectorAll('.form-group').forEach(g => g.classList.remove('invalid'));
    document.getElementById('declaration-error').style.display = 'none';
    
    successScreen.classList.add('hidden');
    form.classList.remove('hidden');
    
    // Reset buttons
    submitBtn.disabled = false;
    btnText.innerText = "புகாரைப் பதிவு செய்க / Submit Complaint";
    btnLoader.classList.add('hidden');

    navigateToStep(1);
}

/**
 * Copy unique tracking ID to clipboard
 */
function copyTrackingId() {
    const text = displayTrackingId.innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast("கண்காணிப்பு எண் நகலெடுக்கப்பட்டது! / Tracking ID copied!", "success");
    }).catch(err => {
        console.error("Clipboard write error:", err);
        showToast("நகலெடுக்க இயலவில்லை. / Failed to copy ID.", "error");
    });
}

/**
 * Toast Notification utilities
 */
let toastTimeout;
function showToast(message, type = 'info') {
    clearTimeout(toastTimeout);
    
    toast.innerText = message;
    toast.className = `toast show ${type}`;
    
    toastTimeout = setTimeout(() => {
        toast.className = 'toast hidden';
    }, 4000);
}

/**
 * Theme Manager Utilities
 */
function initTheme() {
    const savedTheme = localStorage.getItem('tvk-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('tvk-theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'light') {
        icon.className = 'fas fa-sun';
        themeToggleBtn.style.color = '#B45309'; // Darker gold for light mode
    } else {
        icon.className = 'fas fa-moon';
        themeToggleBtn.style.color = 'var(--accent)';
    }
}
