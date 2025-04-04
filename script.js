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

        // Update theme icon
        const themeIcon = themeToggle.querySelector('.material-symbols-rounded');
        themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
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
        button.querySelector('.shortlist-icon').textContent = 'favorite_border';
        button.closest('.course-card').classList.remove('shortlisted');
    } else {
        shortlistedCourses.add(courseId);
        button.querySelector('.shortlist-icon').textContent = 'favorite';
        button.closest('.course-card').classList.add('shortlisted');
    }

    // Add animation class
    button.classList.add('animate');
    setTimeout(() => button.classList.remove('animate'), 300);

    // Save to localStorage
    localStorage.setItem('shortlistedCourses', JSON.stringify([...shortlistedCourses]));
}

// Function to create course card
let expandedCardIds = new Set();
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
                <span class="material-symbols-rounded">auto_awesome</span>
            </button>
            <button class="shortlist-button" aria-label="Shortlist this course">
                <span class="material-symbols-rounded shortlist-icon">favorite_border</span>
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
    details.dataset.courseId = course['Posting ID'];

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
        <p><strong>Posting ID:</strong> ${course['Posting ID']}</p>
        <p><strong>Department:</strong> ${course.Department}${course['DPT Code'] ? ` (${course['DPT Code']})` : ''}</p>
        <p><strong>Openings per Term:</strong> ${course['Openings per Term']}</p>
        <p><strong>Faculty Supervisor${Object.keys(course['Faculty Supervisor(s)']).length > 1 ? 's' : ''}:</strong> ${supervisorLinks}</p>

        <h4>Student roles</h4>
        <div>${formatTextWithLists(content.studentRoles)}</div>

        <h4>Academic outcomes</h4>
        <div>${formatTextWithLists(content.academicOutcomes)}</div>

        <h4>Training and mentorship</h4>
        <div>${formatTextWithLists(content.trainingMentorship)}</div>

        ${formatAssessmentMatrix(course["Assessment Matrix"])}

        <h4>Selection criteria</h4>
        <div>${formatTextWithLists(content.selectionCriteria)}</div>
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
            const courseId = course['Posting ID'];
            const expanded = details.style.display === 'none';
            details.style.display = expanded ? 'block' : 'none';
            card.dataset.expanded = expanded.toString();

            // Track expanded state by posting ID
            if (expanded) {
                expandedCardIds.add(courseId);
            } else {
                expandedCardIds.delete(courseId);
            }
        }
    });

    newShortlistButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleShortlist(course['Posting ID'], newShortlistButton);
    });

    // Initialize shortlist state
    if (shortlistedCourses.has(course['Posting ID'])) {
        card.classList.add('shortlisted');
        header.querySelector('.shortlist-icon').textContent = 'favorite';
    }

    // Initialize the details visibility based on current expanded state
    const wasManuallyExpanded = expandedCardIds.has(course['Posting ID']);
    details.style.display = (isExpanded || wasManuallyExpanded) ? 'block' : 'none';
    card.dataset.expanded = (isExpanded || wasManuallyExpanded).toString();

    return card;
}

// Function to format assessment matrix data
function formatAssessmentMatrix(assessmentMatrix) {
    if (!assessmentMatrix || assessmentMatrix.length === 0) {
        return '';
    }

    let html = '<h4>Course assessment</h4>';

    assessmentMatrix.forEach(session => {
        html += `<div class="assessment-section">
            <div class="assessment-header">
                <h5>${session.session}</h5>
                <button class="expand-table-button" aria-label="Expand assessment table">
                    <span class="material-symbols-rounded">fullscreen</span>
                </button>
            </div>`;

        if (session.assessment_matrix && session.assessment_matrix.length > 0) {
            html += '<div class="table-responsive">';
            html += '<table style="width:100%; border-collapse: collapse; margin-bottom: 15px;">';
            html += '<tr><th style="text-align:left; padding: 5px; border-bottom: 1px solid #ddd;">Learning Activity</th>' +
                '<th style="text-align:left; padding: 5px; border-bottom: 1px solid #ddd;">Due Date</th>' +
                '<th style="text-align:right; padding: 5px; border-bottom: 1px solid #ddd;">Weight</th></tr>';

            session.assessment_matrix.forEach((item, index) => {
                const escapedDescription = item.description
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');

                // Add row-even or row-odd class based on index
                const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';

                html += `<tr class="${rowClass}">
                    <td style="padding: 5px; border-bottom: 1px solid #eee;">
                        ${item.learning_activity}
                        <span class="info-icon" data-description="${escapedDescription}">
                            <span class="material-symbols-rounded">info</span>
                        </span>
                    </td>
                    <td style="padding: 5px; border-bottom: 1px solid #eee;">${item.due_date}</td>
                    <td style="text-align:right; padding: 5px; border-bottom: 1px solid #eee;">${item.weight}%</td>
                </tr>`;
            });

            html += '</table>';
            html += '</div>';
        } else {
            html += '<p>No assessment details available for this session.</p>';
        }

        html += '</div>'; // Close assessment-section
    });

    return html;
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
            course['Posting ID'].toString().includes(searchTerm) ||
            course.Title.toLowerCase().includes(searchTerm) ||
            course.Description.toLowerCase().includes(searchTerm)
        );

        const matchesDepartment = !selectedDepartment || course.Department === selectedDepartment;
        const matchesTerm = !selectedTerm || course.Terms.includes(selectedTerm);
        const matchesDelivery = !selectedDelivery || course['Delivery Method'] === selectedDelivery;
        const matchesActive = !hideExpired || !checkExpiryStatus(course.Expires).isExpired;
        const matchesShortlist = !showShortlistedOnly || shortlistedCourses.has(course['Posting ID']);

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
    let formattedText = '';
    let inList = false;
    let listType = null; // 'ul' or 'ol'
    let currentNumber = null;
    let inSubList = false;
    let currentListItems = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check for bullet points (*, -, •)
        const bulletMatch = line.match(/^([*\-•+])\s+(.+)$/);
        // Check for numbered lists (1., 2., etc.)
        const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)$/);

        if (numberedMatch) {
            const number = numberedMatch[1];
            const content = numberedMatch[2];

            // If we're in a list and encounter a new number, flush the current list
            if (inList && listType === 'ol' && number !== currentNumber) {
                formattedText += buildOrderedList(currentNumber, currentListItems);
                currentListItems = [];
            }

            // Start a new ordered list if not already in one
            if (!inList || listType !== 'ol') {
                if (inList) formattedText += `</${listType}>`;
                inList = true;
                listType = 'ol';
            }

            currentNumber = number;
            currentListItems.push({
                type: 'main',
                content: content,
                subItems: []
            });
            inSubList = false;
        }
        else if (bulletMatch) {
            const content = bulletMatch[2];

            // If we're in an ordered list, treat this as a sub-bullet
            if (inList && listType === 'ol') {
                inSubList = true;

                // Add to the last main list item
                if (currentListItems.length > 0) {
                    currentListItems[currentListItems.length - 1].subItems.push(content);
                }
            } else {
                // Start a new unordered list if not already in one
                if (!inList || listType !== 'ul') {
                    if (inList) formattedText += `</${listType}>`;
                    formattedText += '<ul>';
                    listType = 'ul';
                    inList = true;
                }
                formattedText += `<li>${content}</li>`;
            }
        }
        else {
            // End current list if we encounter a non-list line
            if (inList) {
                if (listType === 'ol') {
                    formattedText += buildOrderedList(currentNumber, currentListItems);
                    currentListItems = [];
                } else {
                    formattedText += `</${listType}>`;
                }
                inList = false;
                listType = null;
            }

            // Only add paragraph if line isn't empty
            if (line) {
                formattedText += `${line}<br>`;
            } else {
                formattedText += '<br>';
            }
        }
    }

    // Close any open list at the end
    if (inList) {
        if (listType === 'ol') {
            formattedText += buildOrderedList(currentNumber, currentListItems);
        } else {
            formattedText += `</${listType}>`;
        }
    }

    return formattedText;
}

// Helper function to build an ordered list with possible sub-bullets
function buildOrderedList(startNumber, items) {
    if (items.length === 0) return '';

    // Use the start attribute to begin with the correct number
    let html = `<ol start="${startNumber}">`;
    items.forEach(item => {
        html += `<li>${item.content}`;

        // Add sub-bullets if any
        if (item.subItems.length > 0) {
            html += '<ul>';
            item.subItems.forEach(subItem => {
                html += `<li>${subItem}</li>`;
            });
            html += '</ul>';
        }

        html += '</li>';
    });
    html += '</ol>';

    return html;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadCourses();

    document.getElementById('clearFiltersButton').addEventListener('click', clearAllFilters);
    document.getElementById('expandAllButton').addEventListener('click', toggleAllCards);
});

// Post initialization functions
let isExpanded = false;

function toggleAllCards() {
    const button = document.getElementById('expandAllButton');
    const allDetails = document.querySelectorAll('.course-details');
    const allCards = document.querySelectorAll('.course-card');
    isExpanded = !isExpanded;

    allDetails.forEach((details, index) => {
        details.style.display = isExpanded ? 'block' : 'none';
        const card = allCards[index];
        card.dataset.expanded = isExpanded.toString();

        // If expanding all, add all posting IDs to expanded set
        // If collapsing all, clear the set
        const courseId = card.querySelector('.course-details')?.dataset.courseId;
        if (courseId) {
            if (isExpanded) {
                expandedCardIds.add(courseId);
            } else {
                expandedCardIds.delete(courseId);
            }
        }
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

document.addEventListener('DOMContentLoaded', function() {
    // Features section toggle
    const featuresHeader = document.querySelector('.features-header');
    const featuresToggle = document.querySelector('.features-toggle');
    const featuresList = document.getElementById('features-list');

    if (featuresHeader && featuresToggle && featuresList) {
        featuresHeader.addEventListener('click', function() {
            const isExpanded = featuresToggle.getAttribute('aria-expanded') === 'true';
            featuresToggle.setAttribute('aria-expanded', !isExpanded);

            if (isExpanded) {
                featuresList.classList.add('collapsed');
                featuresList.style.maxHeight = '0';
            } else {
                featuresList.classList.remove('collapsed');
                featuresList.style.maxHeight = featuresList.scrollHeight + 'px';
            }
        });

        // Initialize to collapsed state
        featuresList.classList.add('collapsed');
        featuresList.style.maxHeight = '0';
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
                shortlistedCourses.has(course['Posting ID']));

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

// Function to clear all filters
function clearAllFilters() {
    // Reset search input
    document.getElementById('searchInput').value = '';

    // Reset dropdowns
    document.getElementById('departmentFilter').value = '';
    document.getElementById('termFilter').value = '';
    document.getElementById('deliveryFilter').value = '';

    // Uncheck checkboxes
    document.getElementById('activeOnly').checked = false;
    document.getElementById('shortlistedOnly').checked = false;

    // Re-display courses with cleared filters
    // This assumes courses is available in this scope
    // If not, you may need to modify this to work with your data flow
    fetch('ROP_Courses_2025-26.json')
        .then(response => response.json())
        .then(courses => displayCourses(courses))
        .catch(error => console.error('Error loading courses:', error));
}

// Table expand functionality
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('tableModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalTableContainer = document.getElementById('modalTableContainer');
    const closeModal = document.getElementById('closeModal');

    // Close modal when clicking the close button
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    // Handle escape key to close modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    // Check if table is scrollable when modal is shown
    function checkTableScroll() {
        if (!modalTableContainer) return;

        const isScrollable = modalTableContainer.scrollWidth > modalTableContainer.clientWidth;
        modalTableContainer.classList.toggle('scrollable', isScrollable);
    }

    // Add resize observer to check scrollability when table size changes
    if (modalTableContainer && window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(checkTableScroll);
        resizeObserver.observe(modalTableContainer);
    }

    // Check scrollability when modal content changes
    const observer = new MutationObserver(checkTableScroll);
    if (modalTableContainer) {
        observer.observe(modalTableContainer, { childList: true });
    }

    // Delegate event listener for expand buttons
    document.body.addEventListener('click', function(e) {
        if (e.target.closest('.expand-table-button')) {
            e.preventDefault();
            e.stopPropagation();

            // Find the assessment section this button belongs to
            const assessmentSection = e.target.closest('.assessment-section');
            if (!assessmentSection) return;

            // Get the table and session title
            const table = assessmentSection.querySelector('table');
            const title = assessmentSection.querySelector('h5').textContent;

            if (table) {
                // Update modal content
                modalTitle.textContent = `Assessment Matrix: ${title}`;
                modalTableContainer.innerHTML = '';

                // Clone the table and add it to the modal
                const tableCopy = table.cloneNode(true);

                // Add alternating row colors to the table
                const rows = tableCopy.querySelectorAll('tbody tr');
                rows.forEach((row, index) => {
                    // Clear any existing row classes
                    row.classList.remove('row-even', 'row-odd');

                    // Add appropriate class based on index
                    if (index % 2 === 0) {
                        row.classList.add('row-even');
                    } else {
                        row.classList.add('row-odd');
                    }
                });

                modalTableContainer.appendChild(tableCopy);

                // Show the modal
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal

                // Check scrollability after modal is shown
                setTimeout(checkTableScroll, 100);
            }
        }
    });
});

// Function to set up ultrawide layout for screens 1600px or wider
let ultrawideActive = false;
function setupUltrawideLayout() {
    if (window.innerWidth < 1600 || ultrawideActive) return;

    // Create the containers
    const leftPanel = document.createElement('div');
    leftPanel.className = 'ultrawide-left-panel';

    const rightPanel = document.createElement('div');
    rightPanel.className = 'ultrawide-right-panel';

    // Add containers to body
    document.body.classList.add('ultrawide');
    document.body.appendChild(leftPanel);
    document.body.appendChild(rightPanel);

    // Move elements to left panel
    leftPanel.appendChild(document.querySelector('.header-container'));
    leftPanel.appendChild(document.querySelector('.info-section'));
    leftPanel.appendChild(document.querySelector('.filters'));
    leftPanel.appendChild(document.querySelector('.controls-container'));

    // Move course list to right panel
    rightPanel.appendChild(document.getElementById('courseList'));

    // Update back to top button to scroll right panel
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        backToTopBtn.onclick = function() {
            rightPanel.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };
    }

    ultrawideActive = true;
}

function revertUltrawideLayout() {
    if (window.innerWidth >= 1600 || !ultrawideActive) return;

    const leftPanel = document.querySelector('.ultrawide-left-panel');
    const rightPanel = document.querySelector('.ultrawide-right-panel');

    if (!leftPanel || !rightPanel) return;

    // Get the main container to move elements back
    const mainContainer = document.body;

    // Move header back to original position (top of body)
    const header = leftPanel.querySelector('.header-container');
    if (header) mainContainer.insertBefore(header, mainContainer.firstChild);

    // Move other elements back
    const infoSection = leftPanel.querySelector('.info-section');
    const filters = leftPanel.querySelector('.filters');
    const controls = leftPanel.querySelector('.controls-container');
    const courseList = rightPanel.querySelector('#courseList');

    if (header && infoSection) mainContainer.insertBefore(infoSection, header.nextSibling);
    if (infoSection && filters) mainContainer.insertBefore(filters, infoSection.nextSibling);
    if (filters && controls) mainContainer.insertBefore(controls, filters.nextSibling);
    if (controls && courseList) mainContainer.insertBefore(courseList, controls.nextSibling);

    // Restore back to top button functionality
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        backToTopBtn.onclick = function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };
    }

    // Remove panels and ultrawide class
    if (leftPanel) leftPanel.remove();
    if (rightPanel) rightPanel.remove();
    document.body.classList.remove('ultrawide');

    ultrawideActive = false;
}

function handleResize() {
    if (window.innerWidth >= 1600) {
        setupUltrawideLayout();
    } else {
        revertUltrawideLayout();
    }
}

// Add CSS for ultrawide layout
const ultrawideStyles = document.createElement('style');
ultrawideStyles.textContent = `
  /* Ultrawide layout (1600px+) */
  body.ultrawide {
    margin: 0;
    padding: 0;
    overflow: hidden;
    height: 100vh;
    display: flex;
  }

  .ultrawide-left-panel {
    width: 380px;
    height: 100vh;
    overflow-y: auto;
    padding: 20px;
    box-sizing: border-box;
    background-color: #f4f4f4;
    border-right: 1px solid #ddd;
    flex-shrink: 0;
  }

  .dark-mode .ultrawide-left-panel {
    background-color: #1c1c1e;
    border-right-color: #444;
  }

  .ultrawide-right-panel {
    flex: 1;
    height: 100vh;
    overflow-y: auto;
    padding: 20px;
    box-sizing: border-box;
  }

  /* Adjustments for left panel elements */
  body.ultrawide .header-container {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    width: auto;
    padding: 0 0 15px 0;
    margin-bottom: 15px;
    border-bottom: 1px solid #ddd;
  }

  body.ultrawide .dark-mode .header-container {
    border-bottom-color: #444;
  }

  body.ultrawide .info-section {
    margin: 0 0 20px 0;
    padding: 0;
    background-color: transparent;
    box-shadow: none;
    max-width: 100%;
  }

  body.ultrawide .filters {
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    margin: 0 0 20px 0;
    max-width: 100%;
  }

  body.ultrawide .filter-group {
    width: 100%;
    margin-bottom: 10px;
  }

  body.ultrawide .filter-group select {
    width: 100%;
  }

  body.ultrawide .controls-container {
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    margin: 0 0 20px 0;
    max-width: 100%;
  }
`;

document.head.appendChild(ultrawideStyles);

// Run once when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set initial layout
    setTimeout(() => {
        handleResize();

        // Add resize listener
        window.addEventListener('resize', handleResize);
    }, 100);
});
