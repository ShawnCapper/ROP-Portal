// Theme handling
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Use RAF to ensure DOM is ready
    requestAnimationFrame(() => {
        // Check for saved theme preference or use system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.classList.toggle('dark-mode', savedTheme === 'dark');
        } else {
            // Force a fresh check of system preference
            const prefersDark = darkModeMediaQuery.matches;
            document.body.classList.toggle('dark-mode', prefersDark);
            localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
        }
    });

    // Use both change and addListener for broader browser support
    try {
        darkModeMediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.body.classList.toggle('dark-mode', e.matches);
                localStorage.setItem('theme', e.matches ? 'dark' : 'light');
            }
        });
    } catch (e) {
        // Fallback for older browsers
        darkModeMediaQuery.addListener((e) => {
            if (!localStorage.getItem('theme')) {
                document.body.classList.toggle('dark-mode', e.matches);
                localStorage.setItem('theme', e.matches ? 'dark' : 'light');
            }
        });
    }

    themeToggle.addEventListener('click', () => {
        const isDark = !document.body.classList.contains('dark-mode');
        document.body.classList.toggle('dark-mode', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
});

// Shortlist management
let shortlistedCourses = new Set(JSON.parse(localStorage.getItem('shortlistedCourses') || '[]'));

function updateShortlistCount() {
    document.getElementById('shortlistCount').textContent = shortlistedCourses.size;
}

function toggleShortlist(courseId, button) {
    if (shortlistedCourses.has(courseId)) {
        shortlistedCourses.delete(courseId);
        button.querySelector('.shortlist-icon').textContent = '☆';
        button.closest('.course-card').classList.remove('shortlisted');
    } else {
        shortlistedCourses.add(courseId);
        button.querySelector('.shortlist-icon').textContent = '★';
        button.closest('.course-card').classList.add('shortlisted');
    }

    // Add animation class
    button.classList.add('animate');
    setTimeout(() => button.classList.remove('animate'), 300);

    // Save to localStorage
    localStorage.setItem('shortlistedCourses', JSON.stringify([...shortlistedCourses]));
    updateShortlistCount();
}

// Function to create course card
function createCourseCard(course) {
    const template = document.getElementById('courseCardTemplate');
    const card = template.content.cloneNode(true).querySelector('.course-card');

    const header = card.querySelector('.course-header');
    const title = card.querySelector('.course-title');
    const shortlistButton = card.querySelector('.shortlist-button');

    // Check expiry status
    const expiryStatus = checkExpiryStatus(course.Expires);
    const expiryClass = expiryStatus.isExpired ? 'expired-date' :
        expiryStatus.isExpiringSoon ? 'expiring-soon' : '';

    // Set course title and ID
    title.innerHTML = `${course.Title} <span class="course-id"></span>`;

    // Add dates, terms, and delivery info
    header.innerHTML += `
        <div class="course-dates">Posted: ${course.Posted} | Expires: <span class="${expiryClass}">${course.Expires}</span></div>
        <div class="course-terms">Terms: ${course.Terms.join(', ')}</div>
        <div class="course-delivery">Delivery: ${course['Delivery Method']}</div>
        <div class="course-description">${course.Description.replace(/\\n/g, '<br>')}</div>
    `;

    const details = card.querySelector('.course-details');

    // Create faculty supervisor links
    const supervisorLinks = Object.entries(course['Faculty Supervisor(s)'])
        .map(([_, [name, url]]) => `<a href="${url}" target="_blank">${name}</a>`)
        .join(', ');

    details.innerHTML = `
        <p><strong>Posting ID:</strong> ${course['Course ID']}</p>
        <p><strong>Department:</strong> ${course.Department}${course['DPT Code'] ? ` (${course['DPT Code']})` : ''}</p>
        <p><strong>Openings per Term:</strong> ${course['Openings per Term']}</p>
        <p><strong>Faculty Supervisor${Object.keys(course['Faculty Supervisor(s)']).length > 1 ? 's' : ''}:</strong> ${supervisorLinks}</p>
        <p><strong>Student Roles:</strong> ${course['Student Roles']}</p>
        <p><strong>Academic Outcomes:</strong> ${course['Academic Outcomes']}</p>
        <p><strong>Training & Mentorship:</strong> ${course['Training & Mentorship']}</p>
        <p><strong>Selection Criteria:</strong> ${course['Selection Criteria']}</p>
    `;

    // Add click handler for shortlist button
    const shortlistBtn = card.querySelector('.shortlist-button');
    shortlistBtn.addEventListener('click', () => {
        toggleShortlist(course['Course ID'], shortlistBtn);
    });

    // Initialize shortlist state
    if (shortlistedCourses.has(course['Course ID'])) {
        card.classList.add('shortlisted');
        card.querySelector('.shortlist-icon').textContent = '★';
    }

    // Initialize the details visibility based on current expanded state
    details.style.display = isExpanded ? 'block' : 'none';

    // Add event listeners
    header.addEventListener('click', (e) => {
        if (!e.target.closest('.shortlist-button')) {
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        }
    });

    shortlistButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleShortlist(course['Course ID'], shortlistButton);
    });

    // Stop propagation of clicks on buttons
    const buttonGroup = card.querySelector('.button-group');
    buttonGroup.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Add click handler only to expandable elements
    const expandableElements = card.querySelectorAll('.expandable');
    expandableElements.forEach(element => {
        element.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });
    });

    return card;
}

// Function to check if a date is expired or expiring soon (within 3 days) in Toronto time
function checkExpiryStatus(expiryDateStr) {
    const expiryDate = new Date(expiryDateStr);
    const torontoOptions = { timeZone: 'America/Toronto' };
    const nowToronto = new Date(new Date().toLocaleString('en-US', torontoOptions));

    expiryDate.setHours(0, 0, 0, 0);
    nowToronto.setHours(0, 0, 0, 0);

    const diffTime = expiryDate - nowToronto;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
        isExpired: diffDays < 0,
        isExpiringSoon: diffDays >= 0 && diffDays <= 3
    };
}

// Function to populate filters
function populateFilters(courses) {
    const departments = new Set();
    const terms = new Set();
    const deliveryModes = new Set();

    courses.forEach(course => {
        departments.add(course.Department);
        course.Terms.forEach(term => terms.add(term));
        deliveryModes.add(course['Delivery Method']);
    });

    // Populate department filter
    const departmentFilter = document.getElementById('departmentFilter');
    [...departments].sort().forEach(dept => {
        const option = new Option(dept, dept);
        departmentFilter.add(option);
    });

    // Populate term filter
    const termFilter = document.getElementById('termFilter');
    [...terms].sort().forEach(term => {
        const option = new Option(term, term);
        termFilter.add(option);
    });

    // Populate delivery mode filter
    const deliveryFilter = document.getElementById('deliveryFilter');
    [...deliveryModes].sort().forEach(mode => {
        const option = new Option(mode, mode);
        deliveryFilter.add(option);
    });
}

// Function to filter courses
function filterCourses(courses) {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedDepartment = document.getElementById('departmentFilter').value;
    const selectedTerm = document.getElementById('termFilter').value;
    const selectedDelivery = document.getElementById('deliveryFilter').value;
    const hideExpired = document.getElementById('activeOnly').checked;
    const showShortlistedOnly = document.getElementById('shortlistedOnly').checked;

    return courses.filter(course => {
        const matchesSearch = (
            course['Course ID'].toString().includes(searchTerm) ||
            course.Title.toLowerCase().includes(searchTerm) ||
            course.Description.toLowerCase().includes(searchTerm)
        );

        const matchesDepartment = !selectedDepartment || course.Department === selectedDepartment;
        const matchesTerm = !selectedTerm || course.Terms.includes(selectedTerm);
        const matchesDelivery = !selectedDelivery || course['Delivery Method'] === selectedDelivery;
        const matchesActive = !hideExpired || new Date(course.Expires) > new Date();
        const matchesShortlist = !showShortlistedOnly || shortlistedCourses.has(course['Course ID']);

        return matchesSearch && matchesDepartment && matchesTerm &&
            matchesDelivery && matchesActive && matchesShortlist;
    });
}

// Main function to load and display courses
async function loadCourses() {
    try {
        const response = await fetch('ROP_Courses_2025-26(Feb17).json');
        const courses = await response.json();

        // Populate filters
        populateFilters(courses);

        // Initial display of courses
        displayCourses(courses);

        // Update shortlist count
        updateShortlistCount();

        // Add event listeners for filters
        document.getElementById('searchInput').addEventListener('input', () => displayCourses(courses));
        document.getElementById('departmentFilter').addEventListener('change', () => displayCourses(courses));
        document.getElementById('termFilter').addEventListener('change', () => displayCourses(courses));
        document.getElementById('deliveryFilter').addEventListener('change', () => displayCourses(courses));
        document.getElementById('activeOnly').addEventListener('change', () => displayCourses(courses));
        document.getElementById('shortlistedOnly').addEventListener('change', () => displayCourses(courses));
    } catch (error) {
        console.error('Error loading courses:', error);
        document.getElementById('courseList').innerHTML = 'Error loading courses. Please try again later.';
    }
}

// Function to display filtered courses
function displayCourses(courses) {
    const filteredCourses = filterCourses(courses);
    const courseList = document.getElementById('courseList');
    courseList.innerHTML = '';
    filteredCourses.forEach(course => {
        courseList.appendChild(createCourseCard(course));
    });

    updateCourseCount(filteredCourses.length);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', loadCourses);
document.getElementById('expandAllButton').addEventListener('click', toggleAllCards);

// Post initialization functions
let isExpanded = false;

function toggleAllCards() {
    const button = document.getElementById('expandAllButton');
    const allDetails = document.querySelectorAll('.course-details');
    isExpanded = !isExpanded;

    allDetails.forEach(details => {
        details.style.display = isExpanded ? 'block' : 'none';
    });

    button.textContent = isExpanded ? 'Collapse All' : 'Expand All';
}

function updateCourseCount(count) {
    document.getElementById('courseCount').textContent = count;
}
