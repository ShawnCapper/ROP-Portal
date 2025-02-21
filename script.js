// Function to create course card
function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';

    const header = document.createElement('div');
    header.className = 'course-header';

    // Create the header content
    header.innerHTML = `
        <div class="course-title">${course['Course ID']} - ${course.Title}</div>
        <div class="course-dates">Posted: ${course.Posted} | Expires: ${course.Expires}</div>
        <div class="course-terms">Terms: ${course.Terms.join(', ')}</div>
        <div class="course-delivery">Delivery: ${course['Delivery Method']}</div>
    `;

    const details = document.createElement('div');
    details.className = 'course-details';

    // Create faculty supervisor links
    const supervisorLinks = Object.values(course['Faculty Supervisor(s)'])
        .map(([name, url]) => `<a href="${url}" target="_blank">${name}</a>`)
        .join(', ');

    // Create required documents list
    const documentsHtml = `
            <div class="required-documents">
                <h4>Required Documents:</h4>
                <ul>
                    ${course['Required Documents'].map(doc => `<li>${doc}</li>`).join('')}
                </ul>
            </div>
        `;

    details.innerHTML = `
            <p><strong>Department:</strong> ${course.Department}</p>
            <p><strong>DPT Code:</strong> ${course['DPT Code']}</p>
            <p><strong>Openings per Term:</strong> ${course['Openings per Term']}</p>
            <p><strong>Faculty Supervisor${Object.keys(course['Faculty Supervisor(s)']).length > 1 ? 's' : ''}:</strong> ${supervisorLinks}</p>
            <p><strong>Description:</strong> ${course.Description}</p>
            <p><strong>Student Roles:</strong> ${course['Student Roles']}</p>
            <p><strong>Academic Outcomes:</strong> ${course['Academic Outcomes']}</p>
            <p><strong>Training & Mentorship:</strong> ${course['Training & Mentorship']}</p>
            <p><strong>Selection Criteria:</strong> ${course['Selection Criteria']}</p>
            ${documentsHtml}
        `;


    card.appendChild(header);
    card.appendChild(details);

    // Add click event to toggle details
    header.addEventListener('click', () => {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
    });

    return card;
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
    departments.forEach(dept => {
        const option = new Option(dept, dept);
        departmentFilter.add(option);
    });

    // Populate term filter
    const termFilter = document.getElementById('termFilter');
    terms.forEach(term => {
        const option = new Option(term, term);
        termFilter.add(option);
    });

    // Populate delivery mode filter
    const deliveryFilter = document.getElementById('deliveryFilter');
    deliveryModes.forEach(mode => {
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

    return courses.filter(course => {
        const matchesSearch = (
            course['Course ID'].toString().includes(searchTerm) ||
            course.Title.toLowerCase().includes(searchTerm) ||
            course.Description.toLowerCase().includes(searchTerm)
        );

        const matchesDepartment = !selectedDepartment || course.Department === selectedDepartment;
        const matchesTerm = !selectedTerm || course.Terms.includes(selectedTerm);
        const matchesDelivery = !selectedDelivery || course['Delivery Method'] === selectedDelivery;

        const isActive = !hideExpired || new Date(course.Expires) > new Date();

        return matchesSearch && matchesDepartment && matchesTerm && matchesDelivery && isActive;
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

        // Add event listeners for filters
        document.getElementById('searchInput').addEventListener('input', () => displayCourses(courses));
        document.getElementById('departmentFilter').addEventListener('change', () => displayCourses(courses));
        document.getElementById('termFilter').addEventListener('change', () => displayCourses(courses));
        document.getElementById('deliveryFilter').addEventListener('change', () => displayCourses(courses));
        document.getElementById('activeOnly').addEventListener('change', () => displayCourses(courses));
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
}

// Initialize the page
document.addEventListener('DOMContentLoaded', loadCourses);