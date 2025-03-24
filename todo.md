# Basic Functionality

---

- [x] List all courses in a card style
- [x] Before a card is expanded display the course title at the top of the card; one a line separated by a '|' the posted date and expires date; on another line separated by the '|' symbol the terms running and openings per term; and on a third line the delivery method; below that, the description of the course
- [x] Expand the card to show the faculty supervisor(s), student roles, academic outcomes, training and mentorship, and selection criteria
- [x] Courses should be filterable by Department (with an alias for the department code), terms the course runs (ensure that this works for courses with multiple terms), courses that haven't expired, and delivery mode
- [x] Courses should be searchable by ID, title, and description

# Additional Functionality

---

- [x] Update to handle \n being displayed as a newline
- [x] Include the number of days remaining for course expiry - change the text to red if the due date to apply is within 3 days
- [x] Expand all button
- [x] Limit the allowed card size to a natural size
- [x] Star - add to shortlist (saved in browser)
- [x] Export shortlist into a CSV/excel file
- [x] Toggle between AI generated summary and full description
- [x] Show number of results
- [x] Dark mode and light mode (default to system preference)
- [ ] Required documents at bottom
- [x] Compact theme
- [x] New UI design language \[implemented Material Design 3\] 
- [x] Disclaimer: course information is for reference only and is not updated live thus may be out of date (view on clnx.utoronto.ca)
- [ ] Make site ADA and ODA compliant; AI generated summaries may contain inacuracies
- [ ] Gradient sparkle on course border when hovering the 'magic' button
- [x] Search box and dark mode switch should be visible while scrolling
- [ ] Wave the magic wand to AI summarize all cards
- [ ] Dyslexic friendly fonts
- [ ] Tags for courses based on their descriptions
- [x] Jump to top button
- [ ] Snap scrolling to cards
- [x] Button to clear all filters
- [x] Site explanation
- [x] Course assessment information
- [x] More consistent icons

# Costly Options

---

- [ ] AI to take in a resume and list a number of courses the student may be suitable for
- [ ] AI language translation

# Bugs, Not Features

---
olZa         
- [x] Update to say showing 1 course instead of courses
- [x] The card specific button group is lowered when the title spans multiple lines.
- [x] Limit size of cards to a natural size
- [x] Fix size of header to same width of cards 
- [x] Empty string displaying in the department filters
- [x] Hide expired posts filter hiding courses on day that application is due
- [x] Search box and dark mode switch are stacked on top of eachother when on small screens
- [x] Course title is centred on small screens when the title only spans one line 
- [x] Handle number lists separated with nested bullet point lists
- [x] Handle bullet points and numbered lists in the description
- [x] In Firefox and Chrome, when browser 'website appearance' setting is set to dark more and portal theme is set to light mode, text in the filter dropdowns is not visible 
- [x] Divider between the course expanded and collapsed state sections overlaps with exterior border
- [x] Clearing all filters collapses manually expanded cards