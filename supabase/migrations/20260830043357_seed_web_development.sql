/*
# Seed Web Development Career Data

Seeds the database with a complete Web Development career path including:
- Career record
- Roadmap with 8 steps (HTML, CSS, JavaScript, Git & GitHub, React, Backend, Database, Projects)
- Courses for HTML step
- 10 lessons for HTML course
- Notes for each HTML lesson
- An exam for the HTML course
- 10 sample questions with options

This makes the platform immediately usable for demonstration and testing.
All content is data-driven and can be modified through the admin dashboard.
*/

-- Career
INSERT INTO careers (id, name, slug, description, icon, difficulty, estimated_hours, published)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Web Development',
  'web-development',
  'Learn to build modern websites and web applications from scratch. Master HTML, CSS, JavaScript, React, backend technologies, and databases.',
  'Code',
  'Beginner',
  120,
  true
) ON CONFLICT (slug) DO NOTHING;

-- Roadmap
INSERT INTO roadmaps (id, career_id, title, description)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Web Development Roadmap',
  'Complete path to becoming a web developer'
) ON CONFLICT DO NOTHING;

-- Roadmap Steps
INSERT INTO roadmap_steps (id, roadmap_id, title, description, step_order, icon) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'HTML', 'Learn the structure of web pages with HTML5', 0, 'Code'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'CSS', 'Style your web pages with modern CSS3', 1, 'Palette'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'JavaScript', 'Add interactivity with the language of the web', 2, 'Zap'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Git & GitHub', 'Version control and collaboration', 3, 'GitBranch'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'React', 'Build dynamic UIs with React', 4, 'Atom'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Backend', 'Server-side development with Node.js', 5, 'Server'),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'Database', 'Data persistence with SQL and NoSQL', 6, 'Database'),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'Projects', 'Build real-world projects', 7, 'FolderGit2')
ON CONFLICT DO NOTHING;

-- Course for HTML step
INSERT INTO courses (id, career_id, roadmap_step_id, title, slug, description, difficulty, estimated_time, course_order, published)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'HTML Fundamentals',
  'html-fundamentals',
  'Master the foundation of web development with HTML5. Learn structure, tags, forms, tables, and semantic HTML.',
  'Beginner',
  180,
  0,
  true
) ON CONFLICT (career_id, slug) DO NOTHING;

-- Lessons for HTML course
INSERT INTO lessons (id, course_id, title, description, content, lesson_order, estimated_minutes, published) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Introduction to HTML', 'What HTML is and how it structures web content', 'HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page using elements represented by tags. HTML elements tell the browser how to display content.\n\nEvery web page you have ever visited is built with HTML. From simple text pages to complex web applications, HTML provides the foundational structure that all other web technologies build upon.\n\nA basic HTML document consists of:\n- DOCTYPE declaration\n- html root element\n- head section with metadata\n- body section with visible content', 0, 15, true),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'HTML Structure', 'The basic structure of an HTML document', 'Every HTML document follows a standard structure:\n\n```html\n<!DOCTYPE html>\n<html>\n  <head>\n    <title>Page Title</title>\n    <meta charset="UTF-8">\n  </head>\n  <body>\n    <h1>My Heading</h1>\n    <p>My paragraph.</p>\n  </body>\n</html>\n```\n\nThe DOCTYPE declaration tells the browser this is an HTML5 document. The html element is the root. The head contains metadata. The body contains visible content.', 1, 20, true),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'HTML Headings', 'Using h1 to h6 heading tags', 'HTML provides six levels of headings, from h1 (most important) to h6 (least important).\n\nHeadings are important for both users and search engines. They create a hierarchical structure that helps readers understand the content organization.\n\nUse only one h1 per page. Use h2 through h6 to create sub-sections. Don not skip heading levels.', 2, 15, true),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'HTML Paragraphs', 'Creating paragraphs of text', 'The p tag defines a paragraph of text. Browsers automatically add space before and after paragraphs.\n\nYou can use br for line breaks and hr for horizontal rules. The pre tag preserves whitespace and line breaks.', 3, 15, true),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'HTML Links', 'Creating hyperlinks with the anchor tag', 'The a tag creates hyperlinks. The href attribute specifies the destination URL.\n\nKey attributes:\n- href: the URL to link to\n- target: where to open the link (_blank for new tab)\n- rel: relationship (noopener for external links)\n\nExample: <a href="https://example.com" target="_blank" rel="noopener">Visit Example</a>', 4, 20, true),
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000001', 'HTML Images', 'Adding images to web pages', 'The img tag embeds images. It is a self-closing tag. The src attribute specifies the image path. The alt attribute provides alternative text for accessibility.\n\nAlways include alt text for accessibility and SEO. Use width and height attributes to prevent layout shifts.', 5, 15, true),
  ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', 'HTML Lists', 'Creating ordered and unordered lists', 'HTML has three types of lists:\n\n1. Unordered lists (ul) - bullet points\n2. Ordered lists (ol) - numbered items\n3. Description lists (dl) - term/description pairs\n\nList items use the li tag. Lists can be nested.', 6, 15, true),
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000001', 'HTML Tables', 'Displaying tabular data', 'Tables organize data into rows and columns using table, tr (row), th (header cell), and td (data cell) tags.\n\nUse thead, tbody, and tfoot for semantic table structure. Tables should be used for tabular data only, not for layout.', 7, 20, true),
  ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000001', 'HTML Forms', 'Collecting user input with forms', 'Forms collect user input. The form tag wraps input elements. Key form elements include input, textarea, select, and button.\n\nThe input type attribute determines the input style: text, email, password, number, checkbox, radio, submit, etc.\n\nThe name attribute identifies form data. The required attribute makes a field mandatory. The placeholder attribute shows hint text.', 8, 25, true),
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000001', 'Semantic HTML', 'Using meaningful HTML5 elements', 'Semantic HTML elements clearly describe their meaning to both browser and developer. Instead of using div for everything, use:\n\n- header: top section of a page or section\n- nav: navigation links\n- main: main content area\n- article: self-contained content\n- section: thematic grouping\n- aside: side content\n- footer: bottom section\n\nSemantic elements improve accessibility, SEO, and code readability.', 9, 20, true)
ON CONFLICT DO NOTHING;

-- Notes for HTML lessons
INSERT INTO notes (lesson_id, course_id, title, content, note_order, published) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '01 Introduction to HTML', 'HTML stands for HyperText Markup Language. It is the standard markup language for creating web pages. HTML describes the structure of web pages using markup. HTML elements are the building blocks of HTML pages. Elements are represented by tags. Tags such as <h1>, <p>, <img> label pieces of content such as headings, paragraphs, and images.', 0, true),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '02 HTML Structure', 'A complete HTML document starts with <!DOCTYPE html>. The document itself begins with <html> and ends with </html>. The visible part is inside <body>. The metadata goes in <head>.', 1, true),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', '03 HTML Headings', 'HTML headings are defined with h1 to h6 tags. h1 is the most important, h6 is the least. Use headings hierarchically and do not skip levels.', 2, true),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', '04 HTML Paragraphs', 'Paragraphs are defined with the p tag. Browsers add vertical margin automatically. Use br for line breaks and hr for thematic breaks.', 3, true),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', '05 HTML Links', 'Links are created with the a tag. The href attribute specifies the destination. Use target="_blank" to open in a new tab. Always add rel="noopener" for external links.', 4, true),
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000001', '06 HTML Images', 'Images use the img tag with src and alt attributes. The src attribute is required. The alt attribute provides text for screen readers and when the image fails to load.', 5, true),
  ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', '07 HTML Lists', 'Unordered lists use ul with li children. Ordered lists use ol with li children. Lists can be nested to create complex hierarchies.', 6, true),
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000001', '08 HTML Tables', 'Tables use table, tr, th, and td. Use thead and tbody for semantic structure. Tables are for tabular data, not page layout.', 7, true),
  ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000001', '09 HTML Forms', 'Forms collect user input. The input type attribute controls the field type. The name attribute identifies data. The required attribute enforces input. The placeholder shows hint text.', 8, true),
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000001', '10 Semantic HTML', 'Semantic elements include header, nav, main, article, section, aside, and footer. They improve accessibility, SEO, and code clarity compared to generic div elements.', 9, true)
ON CONFLICT DO NOTHING;

-- Exam for HTML course
INSERT INTO exams (id, course_id, career_id, title, description, exam_type, num_questions, time_limit_minutes, passing_score, max_attempts, published)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'HTML Fundamentals Exam',
  'Test your knowledge of HTML structure, tags, forms, tables, and semantic HTML',
  'course',
  10,
  20,
  60,
  3,
  true
) ON CONFLICT DO NOTHING;

-- Questions for the exam
INSERT INTO questions (id, exam_id, course_id, question, question_type, correct_answer, explanation, difficulty, topic, points, approved) VALUES
  ('10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'What does HTML stand for?', 'multiple_choice', 'HyperText Markup Language', 'HTML stands for HyperText Markup Language. It is the standard language for creating web pages.', 'Easy', 'HTML Basics', 1, true),
  ('10000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Which HTML element is used to create a hyperlink?', 'multiple_choice', '<a>', 'The <a> element (anchor) is used to create hyperlinks. The href attribute specifies the destination URL.', 'Easy', 'HTML Links', 1, true),
  ('10000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Which tag is used for the largest heading?', 'multiple_choice', '<h1>', 'h1 is the most important and largest heading. You should use only one h1 per page.', 'Easy', 'HTML Headings', 1, true),
  ('10000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Which attribute on an img tag provides alternative text?', 'multiple_choice', 'alt', 'The alt attribute provides alternative text for screen readers and when images fail to load.', 'Easy', 'HTML Images', 1, true),
  ('10000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Which tag creates an unordered list?', 'multiple_choice', '<ul>', 'The ul tag creates an unordered (bulleted) list. Each item uses the li tag.', 'Easy', 'HTML Lists', 1, true),
  ('10000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Which element represents the main content of a document?', 'multiple_choice', '<main>', 'The main element represents the dominant content of the body. There should be only one main element per page.', 'Medium', 'Semantic HTML', 1, true),
  ('10000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Which input type creates a password field?', 'multiple_choice', 'password', 'Setting input type to password masks the entered characters for security.', 'Easy', 'HTML Forms', 1, true),
  ('10000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Which tag is used for table data cells?', 'multiple_choice', '<td>', 'td stands for table data. It defines a standard data cell in a table. th is for header cells.', 'Easy', 'HTML Tables', 1, true),
  ('10000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'True or False: The DOCTYPE declaration is required in HTML5 documents.', 'true_false', 'True', 'The DOCTYPE declaration tells the browser that the document is an HTML5 document. It must be the first line.', 'Easy', 'HTML Structure', 1, true),
  ('10000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Which attribute makes a form input field mandatory?', 'multiple_choice', 'required', 'The required attribute specifies that an input field must be filled before submitting the form.', 'Easy', 'HTML Forms', 1, true)
ON CONFLICT DO NOTHING;

-- Question options
INSERT INTO question_options (question_id, option_text, is_correct, option_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'HyperText Markup Language', true, 0),
  ('10000000-0000-0000-0000-000000000001', 'High Text Machine Language', false, 1),
  ('10000000-0000-0000-0000-000000000001', 'Hyperlinks Text Mark Language', false, 2),
  ('10000000-0000-0000-0000-000000000001', 'Home Tool Markup Language', false, 3),

  ('10000000-0000-0000-0000-000000000002', '<a>', true, 0),
  ('10000000-0000-0000-0000-000000000002', '<img>', false, 1),
  ('10000000-0000-0000-0000-000000000002', '<p>', false, 2),
  ('10000000-0000-0000-0000-000000000002', '<link>', false, 3),

  ('10000000-0000-0000-0000-000000000003', '<h1>', true, 0),
  ('10000000-0000-0000-0000-000000000003', '<head>', false, 1),
  ('10000000-0000-0000-0000-000000000003', '<h6>', false, 2),
  ('10000000-0000-0000-0000-000000000003', '<heading>', false, 3),

  ('10000000-0000-0000-0000-000000000004', 'alt', true, 0),
  ('10000000-0000-0000-0000-000000000004', 'title', false, 1),
  ('10000000-0000-0000-0000-000000000004', 'src', false, 2),
  ('10000000-0000-0000-0000-000000000004', 'description', false, 3),

  ('10000000-0000-0000-0000-000000000005', '<ul>', true, 0),
  ('10000000-0000-0000-0000-000000000005', '<ol>', false, 1),
  ('10000000-0000-0000-0000-000000000005', '<list>', false, 2),
  ('10000000-0000-0000-0000-000000000005', '<li>', false, 3),

  ('10000000-0000-0000-0000-000000000006', '<main>', true, 0),
  ('10000000-0000-0000-0000-000000000006', '<body>', false, 1),
  ('10000000-0000-0000-0000-000000000006', '<section>', false, 2),
  ('10000000-0000-0000-0000-000000000006', '<content>', false, 3),

  ('10000000-0000-0000-0000-000000000007', 'password', true, 0),
  ('10000000-0000-0000-0000-000000000007', 'hidden', false, 1),
  ('10000000-0000-0000-0000-000000000007', 'secret', false, 2),
  ('10000000-0000-0000-0000-000000000007', 'text', false, 3),

  ('10000000-0000-0000-0000-000000000008', '<td>', true, 0),
  ('10000000-0000-0000-0000-000000000008', '<tr>', false, 1),
  ('10000000-0000-0000-0000-000000000008', '<tc>', false, 2),
  ('10000000-0000-0000-0000-000000000008', '<cell>', false, 3),

  ('10000000-0000-0000-0000-000000000009', 'True', true, 0),
  ('10000000-0000-0000-0000-000000000009', 'False', false, 1),

  ('10000000-0000-0000-0000-000000000010', 'required', true, 0),
  ('10000000-0000-0000-0000-000000000010', 'mandatory', false, 1),
  ('10000000-0000-0000-0000-000000000010', 'must', false, 2),
  ('10000000-0000-0000-0000-000000000010', 'needed', false, 3)
ON CONFLICT DO NOTHING;
