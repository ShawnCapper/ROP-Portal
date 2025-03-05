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

    // Set initial state
    card.dataset.showingAi = 'false';

    // Check expiry status
    const expiryStatus = checkExpiryStatus(course.Expires);
    const expiryClass = expiryStatus.isExpired ? 'expired-date' :
        expiryStatus.isExpiringSoon ? 'expiring-soon' : '';

    // Create title section
    const titleHTML = `
        <div class="course-title-row">
            <div class="course-title">${course.Title}</div>
            <div class="button-group">
                <button class="magic-button" aria-label="Magic action">
                    <span class="magic-icon">✨</span>
                </button>
                <button class="shortlist-button" aria-label="Shortlist this course">
                    <span class="shortlist-icon">☆</span>
                </button>
            </div>
        </div>
    `;

    // Set header content
    const termButtons = course.Terms.map(term =>
        `<span class="term-button" data-term="${term}">${term}</span>`
    ).join(' ');

    header.innerHTML = titleHTML + `
    <div class="course-dates">Posted: ${course.Posted} | Expires: <span class="${expiryClass}">${course.Expires}</span></div>
    <div class="course-terms">Terms: ${termButtons}</div>
    <div class="course-delivery">Delivery: <span class="delivery-button" data-delivery="${course['Delivery Method']}">${course['Delivery Method']}</span></div>
    <div class="course-description">${course.Description.replace(/\n/g, '<br>')}</div>
    `;

    // Re-acquire button references after innerHTML update
    const newMagicButton = header.querySelector('.magic-button');
    const newShortlistButton = header.querySelector('.shortlist-button');
    const details = card.querySelector('.course-details');

    // Create faculty supervisor links
    const supervisorLinks = Object.entries(course['Faculty Supervisor(s)'])
        .map(([_, [name, url]]) => `<a href="${url}" target="_blank">${name}</a>`)
        .join(', ');

    // Store both regular and AI content
    const contentVersions = {
        regular: {
            description: course.Description || '',
            studentRoles: course['Student Roles'] || '',
            academicOutcomes: course['Academic Outcomes'] || '',
            trainingMentorship: course['Training & Mentorship'] || '',
            selectionCriteria: course['Selection Criteria'] || ''
        },
        ai: {
            description: course['AI_Description'] || '',
            studentRoles: course['AI_Student Roles'] || '',
            academicOutcomes: course['AI_Academic Outcomes'] || '',
            trainingMentorship: course['AI_Training & Mentorship'] || '',
            selectionCriteria: course['AI_Selection Criteria'] || ''
        }
    };

    function updateContent(showAi) {
        const content = showAi ? contentVersions.ai : contentVersions.regular;

        // Update description in header
        const descriptionDiv = header.querySelector('.course-description');
        if (descriptionDiv) {
            descriptionDiv.innerHTML = content.description.replace(/\n/g, '<br>');
        }

        // Update details section
        details.innerHTML = `
            <p><strong>Posting ID:</strong> ${course['Course ID']}</p>
            <p><strong>Department:</strong> ${course.Department}${course['DPT Code'] ? ` (${course['DPT Code']})` : ''}</p>
            <p><strong>Openings per Term:</strong> ${course['Openings per Term']}</p>
            <p><strong>Faculty Supervisor${Object.keys(course['Faculty Supervisor(s)']).length > 1 ? 's' : ''}:</strong> ${supervisorLinks}</p>
            <p><strong>Student Roles:</strong> ${content.studentRoles}</p>
            <p><strong>Academic Outcomes:</strong> ${content.academicOutcomes}</p>
            <p><strong>Training & Mentorship:</strong> ${content.trainingMentorship}</p>
            <p><strong>Selection Criteria:</strong> ${content.selectionCriteria}</p>
        `;
    }

    // Add magic button click handler
    newMagicButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const showingAi = card.dataset.showingAi === 'true';
        card.dataset.showingAi = (!showingAi).toString();
        updateContent(!showingAi);

        // Add animation class
        newMagicButton.classList.add('animate');
        setTimeout(() => newMagicButton.classList.remove('animate'), 300);
    });

    // Terms button click handler
    header.querySelectorAll('.term-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const term = e.target.dataset.term;
            const termFilter = document.getElementById('termFilter');
            termFilter.value = term;
            termFilter.dispatchEvent(new Event('change'));
        });
    });

    // Delivey button click handler
    header.querySelector('.delivery-button').addEventListener('click', (e) => {
        e.stopPropagation();
        const delivery = e.target.dataset.delivery;
        const deliveryFilter = document.getElementById('deliveryFilter');
        deliveryFilter.value = delivery;
        deliveryFilter.dispatchEvent(new Event('change'));
    });

    // Set initial content
    updateContent(false);

    // Add event listeners
    header.addEventListener('click', (e) => {
        if (!e.target.closest('.shortlist-button') && !e.target.closest('.magic-button')) {
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        }
    });

    newShortlistButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleShortlist(course['Course ID'], newShortlistButton);
    });

    // Initialize shortlist state
    if (shortlistedCourses.has(course['Course ID'])) {
        card.classList.add('shortlisted');
        header.querySelector('.shortlist-icon').textContent = '★';
    }

    // Initialize the details visibility based on current expanded state
    details.style.display = isExpanded ? 'block' : 'none';

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
        const response = await fetch('ROP_Courses_2025-26(Feb19).json');
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
