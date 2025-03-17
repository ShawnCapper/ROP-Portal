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
    const termsList = course.Terms.join(', ');

    header.innerHTML = titleHTML + `
    <div class="course-dates">Posted: ${course.Posted} | Expires: <span class="${expiryClass}">${course.Expires}</span></div>
    <div class="course-terms-delivery">
        Terms: ${termsList} | Delivery: ${course['Delivery Method']}
    </div>
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
            descriptionDiv.innerHTML = formatTextWithLists(content.description);
        }

        // Update details section
        details.innerHTML = `
        <p><strong>Posting ID:</strong> ${course['Course ID']}</p>
        <p><strong>Department:</strong> ${course.Department}${course['DPT Code'] ? ` (${course['DPT Code']})` : ''}</p>
        <p><strong>Openings per Term:</strong> ${course['Openings per Term']}</p>
        <p><strong>Faculty Supervisor${Object.keys(course['Faculty Supervisor(s)']).length > 1 ? 's' : ''}:</strong> ${supervisorLinks}</p>
        <p><strong>Student Roles:</strong> ${formatTextWithLists(content.studentRoles)}</p>
        <p><strong>Academic Outcomes:</strong> ${formatTextWithLists(content.academicOutcomes)}</p>
        <p><strong>Training & Mentorship:</strong> ${formatTextWithLists(content.trainingMentorship)}</p>
        <p><strong>Selection Criteria:</strong> ${formatTextWithLists(content.selectionCriteria)}</p>
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
        // Ensure department is never empty in the filter
        if (course.Department) {
            departments.add(course.Department);
        }
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
        const matchesActive = !hideExpired || !checkExpiryStatus(course.Expires).isExpired;
        const matchesShortlist = !showShortlistedOnly || shortlistedCourses.has(course['Course ID']);

        return matchesSearch && matchesDepartment && matchesTerm &&
            matchesDelivery && matchesActive && matchesShortlist;
    });
}

// Main function to load and display courses
async function loadCourses() {
    try {
        const response = await fetch('ROP_Courses_2025-26.json');
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

// Function to format text with proper list handling
function formatTextWithLists(text) {
    if (!text) return '';

    // Split text into lines
    const lines = text.split('\n');
    let inList = false;
    let listType = null; // 'ul' or 'ol'
    let formattedText = '';

    lines.forEach((line, index) => {
        // Check for bullet points (*, -, •)
        const bulletMatch = line.trim().match(/^(\*|-|•|\+)\s+(.+)$/);
        // Check for numbered lists (1., 2., etc.)
        const numberedMatch = line.trim().match(/^(\d+)[.)]\s+(.+)$/);

        if (bulletMatch) {
            // Start a new unordered list if not already in one
            if (!inList || listType !== 'ul') {
                if (inList) formattedText += `</${listType}>`;
                formattedText += '<ul>';
                listType = 'ul';
                inList = true;
            }
            formattedText += `<li>${bulletMatch[2]}</li>`;
        }
        else if (numberedMatch) {
            // Start a new ordered list if not already in one
            if (!inList || listType !== 'ol') {
                if (inList) formattedText += `</${listType}>`;
                formattedText += '<ol>';
                listType = 'ol';
                inList = true;
            }
            formattedText += `<li>${numberedMatch[2]}</li>`;
        }
        else {
            // End current list if we encounter a non-list line
            if (inList) {
                formattedText += `</${listType}>`;
                inList = false;
                listType = null;
            }

            // Only add paragraph if line isn't empty
            if (line.trim()) {
                formattedText += `${line}<br>`;
            } else {
                formattedText += '<br>';
            }
        }
    });

    // Close any open list at the end
    if (inList) {
        formattedText += `</${listType}>`;
    }

    return formattedText;
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
    const countElement = document.getElementById('courseCount');
    countElement.textContent = count;

    // Get the parent element that contains the text
    const countContainer = countElement.parentElement;

    // Replace the text content to handle singular/plural correctly
    countContainer.innerHTML = `Showing <span id="courseCount">${count}</span> ${count === 1 ? 'course' : 'courses'}`;
}

document.addEventListener('DOMContentLoaded', function() {
    const exportButton = document.getElementById('exportShortlistButton');

    if (exportButton) {
        exportButton.addEventListener('click', exportShortlistedCourses);
    }
});

function exportShortlistedCourses() {
    // If no shortlisted courses, show message and return
    if (shortlistedCourses.size === 0) {
        alert('No courses have been shortlisted yet.');
        return;
    }

    // Load all courses to filter the shortlisted ones
    fetch('ROP_Courses_2025-26.json')
        .then(response => response.json())
        .then(courses => {
            // Filter only shortlisted courses
            const shortlistedData = courses.filter(course =>
                shortlistedCourses.has(course['Course ID']));

            if (shortlistedData.length === 0) {
                alert('No shortlisted courses found.');
                return;
            }

            // Get first course to determine all available fields
            const sampleCourse = shortlistedData[0];

            // Get all keys except AI-prefixed ones
            const headers = Object.keys(sampleCourse).filter(key => !key.startsWith('AI_'));

            // Start with headers
            let csvContent = headers.join(',') + '\n';

            // Add each course data
            shortlistedData.forEach(course => {
                const row = headers.map(header => {
                    let value = course[header];

                    // Handle arrays (like Terms or Required Documents)
                    if (Array.isArray(value)) {
                        return `"${value.join(', ').replace(/"/g, '""')}"`;
                    }

                    // Handle objects (like Faculty Supervisor(s))
                    else if (typeof value === 'object' && value !== null) {
                        try {
                            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                        } catch (e) {
                            return '""';
                        }
                    }

                    // Handle strings (escape quotes and wrap in quotes)
                    else if (typeof value === 'string') {
                        return `"${value.replace(/"/g, '""')}"`;
                    }

                    // Handle null/undefined
                    else {
                        return value || '';
                    }
                });

                csvContent += row.join(',') + '\n';
            });

            // Create downloadable link
            const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', 'shortlisted_courses.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(error => {
            console.error('Error exporting shortlisted courses:', error);
            alert('Error exporting shortlisted courses. Please try again.');
        });
}

// Back to top button functionality
document.addEventListener('DOMContentLoaded', function() {
    const backToTopButton = document.getElementById('backToTopBtn');

    // Initially hide the button (redundant but ensures it's hidden)
    backToTopButton.style.display = 'none';

    // Show button when user scrolls down 300px
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    // Smooth scroll to top when button is clicked
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});