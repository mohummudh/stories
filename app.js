// Story analytics
function getStoryViews() {
    return JSON.parse(localStorage.getItem('storyViews')) || {};
}

function saveStoryViews(views) {
    localStorage.setItem('storyViews', JSON.stringify(views));
}

function incrementStoryView(storyId) {
    const views = getStoryViews();
    views[storyId] = (views[storyId] || 0) + 1;
    saveStoryViews(views);
}

function getStoryViewCount(storyId) {
    const views = getStoryViews();
    return views[storyId] || 0;
}

// URL routing for public profiles
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        profile: params.get('profile'),
        story: params.get('story')
    };
}

function generateUserSlug(user) {
    return user.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
}

function getUserBySlug(slug) {
    return users.find(user => generateUserSlug(user) === slug);
}

function createShareableLink() {
    if (!currentUser) return '';
    const userSlug = generateUserSlug(currentUser);
    return `${window.location.origin}${window.location.pathname}?profile=${userSlug}`;
}

// User Authentication System
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let users = JSON.parse(localStorage.getItem('users')) || [];

// User management functions
function createUser(email, password, name) {
    const userId = Date.now().toString();
    const user = {
        id: userId,
        email: email.toLowerCase(),
        password: password, // In production, this would be hashed
        name: name,
        createdAt: Date.now(),
        bio: ''
    };
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    return user;
}

function authenticateUser(email, password) {
    const user = users.find(u => u.email === email.toLowerCase() && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        return true;
    }
    return false;
}

function signOut() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    displayAuthPage();
}

// Initialize or load existing notes from localStorage
let pages = JSON.parse(localStorage.getItem('pages')) || [];

// Initialize dark mode from localStorage
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Apply dark mode on load
if (isDarkMode) {
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
}

// Toggle dark mode function
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode.toString());
    
    // Update toggle button icon
    const toggleButton = document.querySelector('.dark-mode-toggle');
    if (toggleButton) {
        toggleButton.textContent = isDarkMode ? '○' : '●';
    }
}

// Create dark mode toggle button
function createDarkModeToggle() {
    const toggleButton = document.createElement('button');
    toggleButton.className = 'dark-mode-toggle';
    toggleButton.textContent = isDarkMode ? '○' : '●';
    toggleButton.title = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';
    toggleButton.addEventListener('click', toggleDarkMode);
    document.body.appendChild(toggleButton);
    return toggleButton;
}

// Migrate existing pages to include timestamps
pages = pages.map(page => {
    if (!page.createdAt) {
        page.createdAt = page.id; // Use the ID as creation timestamp
        page.modifiedAt = page.id;
    }
    return page;
});

// Save notes to localStorage
function savePages() {
    localStorage.setItem('pages', JSON.stringify(pages));
}

// Format date for display
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

// Count words in text
function countWords(text) {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

// Estimate reading time (average 200 words per minute)
function getReadingTime(wordCount) {
    if (wordCount === 0) return '';
    const minutes = Math.ceil(wordCount / 200);
    return minutes === 1 ? ' • 1 min read' : ` • ${minutes} min read`;
}

// Delete a page by its ID and return to main page
function deletePage(id) {
    const userPages = getUserPages();
    // Find the index of the page we want to delete
    const pageIndex = userPages.findIndex(page => page.id === id);
    
    // Remove the page if found
    if (pageIndex !== -1) {
        userPages.splice(pageIndex, 1);
        saveUserPages(userPages);
        displayMainPage();
    }
}

// User-specific page management
function getUserPages() {
    if (!currentUser) return [];
    const userPages = localStorage.getItem(`pages_${currentUser.id}`);
    return userPages ? JSON.parse(userPages) : [];
}

function saveUserPages(userPages) {
    if (!currentUser) return;
    localStorage.setItem(`pages_${currentUser.id}`, JSON.stringify(userPages));
}

// Authentication interface
function displayAuthPage() {
    document.body.innerHTML = '';
    document.body.classList.add('auth-active');
    
    // Create dark mode toggle
    createDarkModeToggle();
    
    const authContainer = document.createElement('div');
    authContainer.className = 'auth-container';
    document.body.appendChild(authContainer);
    
    // App title
    const appTitle = document.createElement('h1');
    appTitle.className = 'app-title';
    appTitle.textContent = 'Stories';
    authContainer.appendChild(appTitle);
    
    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.className = 'auth-subtitle';
    subtitle.textContent = 'Share authentic stories from your life';
    authContainer.appendChild(subtitle);
    
    // Auth form container
    const formContainer = document.createElement('div');
    formContainer.className = 'auth-form-container';
    authContainer.appendChild(formContainer);
    
    // Toggle between sign in and sign up
    let isSignUp = false;
    
    function createAuthForm() {
        formContainer.innerHTML = '';
        
        const form = document.createElement('div');
        form.className = 'auth-form';
        
        // Name field (only for sign up)
        if (isSignUp) {
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.placeholder = 'Your name';
            nameInput.className = 'auth-input';
            nameInput.id = 'name';
            form.appendChild(nameInput);
        }
        
        // Email field
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.placeholder = 'Email';
        emailInput.className = 'auth-input';
        emailInput.id = 'email';
        form.appendChild(emailInput);
        
        // Password field
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.placeholder = 'Password';
        passwordInput.className = 'auth-input';
        passwordInput.id = 'password';
        form.appendChild(passwordInput);
        
        // Submit button
        const submitButton = document.createElement('button');
        submitButton.className = 'auth-button';
        submitButton.textContent = isSignUp ? 'Create Account' : 'Sign In';
        form.appendChild(submitButton);
        
        // Toggle link
        const toggleLink = document.createElement('button');
        toggleLink.className = 'auth-toggle';
        toggleLink.textContent = isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account';
        form.appendChild(toggleLink);
        
        // Error message container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'auth-error';
        form.appendChild(errorContainer);
        
        formContainer.appendChild(form);
        
        // Event handlers
        submitButton.addEventListener('click', handleSubmit);
        toggleLink.addEventListener('click', () => {
            isSignUp = !isSignUp;
            createAuthForm();
            // Focus first input
            setTimeout(() => {
                const firstInput = form.querySelector('.auth-input');
                if (firstInput) firstInput.focus();
            }, 0);
        });
        
        // Handle enter key
        form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        });
        
        // Focus first input
        setTimeout(() => {
            const firstInput = form.querySelector('.auth-input');
            if (firstInput) firstInput.focus();
        }, 0);
    }
    
    function handleSubmit() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const name = isSignUp ? document.getElementById('name')?.value.trim() : '';
        const errorContainer = document.querySelector('.auth-error');
        
        // Clear previous errors
        errorContainer.textContent = '';
        
        // Validation
        if (!email || !password) {
            errorContainer.textContent = 'Please fill in all fields';
            return;
        }
        
        if (isSignUp && !name) {
            errorContainer.textContent = 'Please enter your name';
            return;
        }
        
        if (isSignUp) {
            // Check if user already exists
            if (users.find(u => u.email === email.toLowerCase())) {
                errorContainer.textContent = 'An account with this email already exists';
                return;
            }
            
            // Create new user
            const user = createUser(email, password, name);
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            displayMainPage();
        } else {
            // Sign in
            if (authenticateUser(email, password)) {
                displayMainPage();
            } else {
                errorContainer.textContent = 'Invalid email or password';
            }
        }
    }
    
    createAuthForm();
}

// Create user menu
function createUserMenu(isWritingMode = false) {
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    
    const menuToggle = document.createElement('button');
    menuToggle.className = 'user-menu-toggle';
    
    // Always append the toggle button first to ensure proper positioning
    userMenu.appendChild(menuToggle);
    
    if (isWritingMode) {
        // In writing mode, show back arrow and clicking goes back to main page
        menuToggle.textContent = '←';
        menuToggle.addEventListener('click', () => {
            displayMainPage();
        });
    } else {
        // In main page, show user name and clicking toggles the inline buttons
        menuToggle.textContent = currentUser.name;
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'user-menu-buttons';
        
        const browseButton = document.createElement('button');
        browseButton.className = 'user-menu-button';
        browseButton.textContent = 'Browse';
        browseButton.addEventListener('click', () => {
            displayReadingPage();
            userMenu.classList.remove('active');
        });
        
        const profileButton = document.createElement('button');
        profileButton.className = 'user-menu-button';
        profileButton.textContent = 'Profile';
        profileButton.addEventListener('click', () => {
            displayProfilePage();
            userMenu.classList.remove('active');
        });
        
        const publishedButton = document.createElement('button');
        publishedButton.className = 'user-menu-button';
        publishedButton.textContent = 'Published';
        publishedButton.title = 'View public profile';
        publishedButton.addEventListener('click', () => {
            const publishedStories = getPublishedStories().filter(story => story.authorId === currentUser.id);
            if (publishedStories.length > 0) {
                const userSlug = generateUserSlug(currentUser);
                displayPublicProfile(userSlug);
            } else {
                showProfileFeedback('No published stories yet. Publish some stories to create your public profile.');
            }
            userMenu.classList.remove('active');
        });
        
        const signOutButton = document.createElement('button');
        signOutButton.className = 'user-menu-button';
        signOutButton.textContent = 'Sign Out';
        signOutButton.addEventListener('click', () => {
            signOut();
        });
        
        buttonsContainer.appendChild(browseButton);
        buttonsContainer.appendChild(profileButton);
        buttonsContainer.appendChild(publishedButton);
        buttonsContainer.appendChild(signOutButton);
        // Append buttons container after the toggle button
        userMenu.appendChild(buttonsContainer);
        
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('active');
        });
        
        // Close buttons when clicking outside
        document.addEventListener('click', () => {
            userMenu.classList.remove('active');
        });
    }
    
    document.body.appendChild(userMenu);
    
    return userMenu;
}

// Display the main page where users can create new notes
function displayMainPage() {
    // First, remove any existing click listener before clearing the page
    document.body.removeEventListener('click', createTitleInput);
    
    document.body.innerHTML = '';
    document.body.classList.remove('auth-active');
    
    // Create dark mode toggle
    createDarkModeToggle();
    
    // Create user menu
    createUserMenu();
    
    // Load user-specific pages
    const userPages = getUserPages();
    
    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';
    document.body.appendChild(mainContainer);
    
    // Then add the new click listener
    mainContainer.addEventListener('click', createTitleInput);

    // Sort pages by most recently modified
    const sortedPages = userPages.sort((a, b) => {
        const aTime = a.modifiedAt || a.createdAt || a.id;
        const bTime = b.modifiedAt || b.createdAt || b.id;
        return bTime - aTime;
    });

    // Show hint if no pages exist
    if (sortedPages.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'empty-hint';
        hint.innerHTML = 'Click anywhere to start writing<br><span style="font-size: 11px; opacity: 0.6;">Press / to search • 1-9 for quick access • ⌘D for dark mode • ⌘F for focus mode • Escape to return • ⌘⌫ to delete</span>';
        mainContainer.appendChild(hint);
    }

    // Display existing titles
    sortedPages.forEach((page, index) => {
        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-container';
        
        // Create title content wrapper
        const titleContent = document.createElement('div');
        titleContent.className = 'title-content';
        
        const titleElement = document.createElement('div');
        titleElement.textContent = page.title;
        titleElement.className = 'page-title';
        titleElement.style.cursor = 'pointer';
        titleElement.style.marginBottom = '15px';
        
        // Add published indicator
        if (isStoryPublished(page.id)) {
            const publishedIndicator = document.createElement('span');
            publishedIndicator.className = 'published-indicator';
            publishedIndicator.textContent = ' ✓';
            publishedIndicator.title = 'Published story';
            titleElement.appendChild(publishedIndicator);
        }
        
        // Add subtle number indicator for quick access
        if (index < 9) {
            const numberHint = document.createElement('span');
            numberHint.className = 'number-hint';
            numberHint.textContent = `${index + 1}`;
            titleContent.appendChild(numberHint);
        }
        
        const dateElement = document.createElement('span');
        dateElement.className = 'page-date';
        let dateText = formatDate(page.modifiedAt || page.createdAt || page.id);
        
        // Add view count for published stories
        if (isStoryPublished(page.id)) {
            const publishedStories = getPublishedStories();
            const publishedStory = publishedStories.find(s => s.pageId === page.id && s.authorId === currentUser.id);
            if (publishedStory) {
                const viewCount = getStoryViewCount(publishedStory.id);
                dateText += ` • ${viewCount} view${viewCount !== 1 ? 's' : ''}`;
            }
        }
        
        dateElement.textContent = dateText;
        
        titleContent.appendChild(titleElement);
        titleContent.appendChild(dateElement);
        
        // Create action buttons container
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        
        // Create publish/unpublish button
        const publishButton = document.createElement('span');
        publishButton.className = 'publish-button';
        const isPublished = isStoryPublished(page.id);
        publishButton.textContent = isPublished ? '◉' : '○';
        publishButton.title = isPublished ? 'Unpublish story' : 'Publish story';
        
        // Create delete button
        const deleteButton = document.createElement('span');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = '×';
        deleteButton.title = 'Delete note';
        
        titleElement.addEventListener('click', (e) => {
            e.stopPropagation();
            openPage(page.id);
        });
        
        publishButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasPublished = isStoryPublished(page.id);
            
            if (wasPublished) {
                if (confirm('Are you sure you want to unpublish this story? It will no longer be visible to readers.')) {
                    unpublishStory(page.id);
                } else {
                    return;
                }
            } else {
                if (page.content.trim() === '') {
                    alert('Cannot publish an empty story. Please add some content first.');
                    return;
                }
                
                const wordCount = countWords(page.content);
                if (wordCount < 10) {
                    const proceed = confirm('This story is quite short (less than 10 words). Are you sure you want to publish it?');
                    if (!proceed) return;
                }
                
                publishStory(page.id);
            }
            
            // Update button appearance and published indicator
            const nowPublished = isStoryPublished(page.id);
            publishButton.textContent = nowPublished ? '◉' : '○';
            publishButton.title = nowPublished ? 'Unpublish story' : 'Publish story';
            
            // Update published indicator in title
            const existingIndicator = titleElement.querySelector('.published-indicator');
            if (nowPublished && !existingIndicator) {
                const publishedIndicator = document.createElement('span');
                publishedIndicator.className = 'published-indicator';
                publishedIndicator.textContent = ' ✓';
                publishedIndicator.title = 'Published story';
                titleElement.appendChild(publishedIndicator);
            } else if (!nowPublished && existingIndicator) {
                existingIndicator.remove();
            }
            
            // Show brief feedback
            const feedback = document.createElement('div');
            feedback.textContent = nowPublished ? 'Story published!' : 'Story unpublished';
            feedback.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: ${nowPublished ? '#4CAF50' : '#FF9800'};
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                z-index: 1000;
                font-size: 14px;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(feedback);
            
            // Animate feedback
            setTimeout(() => feedback.style.opacity = '1', 10);
            setTimeout(() => {
                feedback.style.opacity = '0';
                setTimeout(() => document.body.removeChild(feedback), 300);
            }, 2000);
        });
        
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePage(page.id);
        });
        
        actionButtons.appendChild(publishButton);
        actionButtons.appendChild(deleteButton);
        
        titleContainer.appendChild(titleContent);
        titleContainer.appendChild(actionButtons);
        mainContainer.appendChild(titleContainer);
    });
}

// Create a new title input when the page is clicked
function createTitleInput(event) {
    if (event.target !== event.currentTarget) return;

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    
    event.currentTarget.appendChild(titleInput);
    titleInput.focus();

    titleInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && titleInput.value.trim() !== '') {
            const newPage = {
                id: Date.now(),
                title: titleInput.value.trim(),
                content: '',
                createdAt: Date.now(),
                modifiedAt: Date.now()
            };
            const userPages = getUserPages();
            userPages.push(newPage);
            saveUserPages(userPages);
            openPage(newPage.id);
        }
    });

    event.currentTarget.removeEventListener('click', createTitleInput);
}

// Simple search functionality
function displaySearchResults(query) {
    document.body.innerHTML = '';
    
    // Create dark mode toggle
    createDarkModeToggle();
    
    // Create user menu
    createUserMenu();
    
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';
    document.body.appendChild(mainContainer);
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.value = query;
    searchInput.placeholder = 'Search notes...';
    searchInput.className = 'search-input';
    
    searchContainer.appendChild(searchInput);
    mainContainer.appendChild(searchContainer);
    
    // Get user pages for search
    const userPages = getUserPages();
    
    // Show hint if no query
    if (query.trim() === '') {
        const hint = document.createElement('div');
        hint.className = 'search-hint';
        hint.innerHTML = 'Start typing to search through your notes<br><span style="font-size: 12px; opacity: 0.6;">Press Escape to return</span>';
        mainContainer.appendChild(hint);
    } else {
        const results = userPages.filter(page => 
            page.title.toLowerCase().includes(query.toLowerCase()) ||
            page.content.toLowerCase().includes(query.toLowerCase())
        );
        
        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'search-hint';
            noResults.textContent = 'No notes found';
            mainContainer.appendChild(noResults);
        } else {
            results.forEach(page => {
                const titleContainer = document.createElement('div');
                titleContainer.className = 'title-container search-result';
                
                // Create title content wrapper
                const titleContent = document.createElement('div');
                titleContent.className = 'title-content';
                
                const titleElement = document.createElement('div');
                titleElement.textContent = page.title;
                titleElement.className = 'page-title';
                titleElement.style.cursor = 'pointer';
                
                const dateElement = document.createElement('span');
                dateElement.className = 'page-date';
                dateElement.textContent = formatDate(page.modifiedAt || page.createdAt || page.id);
                
                titleContent.appendChild(titleElement);
                titleContent.appendChild(dateElement);
                
                // Create delete button
                const deleteButton = document.createElement('span');
                deleteButton.className = 'delete-button';
                deleteButton.textContent = '×';
                deleteButton.title = 'Delete note';
                
                titleElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openPage(page.id);
                });
                
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deletePage(page.id);
                });
                
                titleContainer.appendChild(titleContent);
                titleContainer.appendChild(deleteButton);
                mainContainer.appendChild(titleContainer);
            });
        }
    }
    
    searchInput.focus();
    
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
            displayMainPage();
        } else {
            displaySearchResults(e.target.value);
        }
    });
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            displayMainPage();
        }
    });
}



// Open a specific note for editing
function openPage(id) {
    document.body.innerHTML = '';

    // Create dark mode toggle
    createDarkModeToggle();
    
    // Create user menu for writing mode
    createUserMenu(true);

    const userPages = getUserPages();
    const page = userPages.find(p => p.id === id);
    if (!page) {
        displayMainPage();
        return;
    }

    // Create writing container
    const writingContainer = document.createElement('div');
    writingContainer.className = 'writing-container';
    document.body.appendChild(writingContainer);

    // Create title
    const titleElement = document.createElement('div');
    titleElement.textContent = page.title;
    titleElement.classList.add('title');

    // Add double-click handler
    titleElement.addEventListener('dblclick', () => {
        const titleInput = document.createElement('input');
        titleInput.value = page.title;
        titleInput.classList.add('title-edit');
        
        // Replace title with input
        titleElement.replaceWith(titleInput);
        titleInput.focus();
        
        // Handle save on Enter
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const newTitle = titleInput.value.trim();
                if (newTitle) {
                    page.title = newTitle;
                    page.modifiedAt = Date.now();
                    saveUserPages(userPages);
                    titleElement.textContent = newTitle;
                }
                titleInput.replaceWith(titleElement);
            } else if (e.key === 'Escape') {
                titleInput.replaceWith(titleElement);
            }
        });
        
        // Save on blur
        titleInput.addEventListener('blur', () => {
            const newTitle = titleInput.value.trim();
            if (newTitle) {
                page.title = newTitle;
                page.modifiedAt = Date.now();
                saveUserPages(userPages);
                titleElement.textContent = newTitle;
            }
            titleInput.replaceWith(titleElement);
        });
    });

    writingContainer.appendChild(titleElement);
    
    // Create content area
    const textarea = document.createElement('textarea');
    textarea.value = page.content;
    textarea.placeholder = 'Start writing...';
    
    // Auto-resize textarea to fit content
    function autoResize() {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(textarea.scrollHeight, window.innerHeight * 0.6) + 'px';
    }
    
    // Initial resize
    setTimeout(autoResize, 0);
    
    // Create word count display  
    const wordCount = document.createElement('div');
    wordCount.className = 'word-count';
    const words = countWords(page.content);
    wordCount.textContent = `${words} words${getReadingTime(words)}`;
    
    textarea.addEventListener('input', () => {
        page.content = textarea.value;
        page.modifiedAt = Date.now();
        const words = countWords(textarea.value);
        wordCount.textContent = `${words} words${getReadingTime(words)}`;
        autoResize();
        saveUserPages(userPages);
    });
    
    // Better text editing experience
    textarea.addEventListener('keydown', (e) => {
        // Smart quotes and dashes
        if (e.key === '"' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            const cursorPos = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, cursorPos);
            const textAfter = textarea.value.substring(textarea.selectionEnd);
            
            // Determine if we need opening or closing quote
            const lastQuote = textBefore.lastIndexOf('"');
            const lastClosingQuote = textBefore.lastIndexOf('"');
            
            let quoteToInsert = '"'; // opening quote
            if (lastQuote > lastClosingQuote) {
                quoteToInsert = '"'; // closing quote
            }
            
            textarea.value = textBefore + quoteToInsert + textAfter;
            textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
        }
        
        // Em dash with double hyphen
        if (e.key === '-' && textarea.value[textarea.selectionStart - 1] === '-') {
            e.preventDefault();
            const cursorPos = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, cursorPos - 1);
            const textAfter = textarea.value.substring(cursorPos);
            
            textarea.value = textBefore + '—' + textAfter;
            textarea.selectionStart = textarea.selectionEnd = cursorPos;
        }
        
        // Auto-indent on new line for lists and paragraphs
        if (e.key === 'Enter') {
            const cursorPos = textarea.selectionStart;
            const textBeforeCursor = textarea.value.substring(0, cursorPos);
            const lines = textBeforeCursor.split('\n');
            const currentLine = lines[lines.length - 1];
            
            // Handle bullet points and numbered lists
            const bulletMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/);
            const indentMatch = currentLine.match(/^(\s+)/);
            
            if (bulletMatch) {
                e.preventDefault();
                const indent = bulletMatch[1];
                const bullet = bulletMatch[2];
                let newBullet = bullet;
                
                // Auto-increment numbers
                if (/^\d+\./.test(bullet)) {
                    const num = parseInt(bullet) + 1;
                    newBullet = `${num}.`;
                }
                
                const insertion = `\n${indent}${newBullet} `;
                textarea.value = textarea.value.substring(0, cursorPos) + 
                               insertion + 
                               textarea.value.substring(cursorPos);
                textarea.selectionStart = textarea.selectionEnd = cursorPos + insertion.length;
            } else if (indentMatch) {
                // Preserve indentation
                setTimeout(() => {
                    const newCursorPos = textarea.selectionStart;
                    const indent = indentMatch[1];
                    textarea.value = textarea.value.substring(0, newCursorPos) + 
                                   indent + 
                                   textarea.value.substring(newCursorPos);
                    textarea.selectionStart = textarea.selectionEnd = newCursorPos + indent.length;
                }, 0);
            }
        }
        
        // Better tab handling for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            if (start === end) {
                // Simple tab insertion
                textarea.value = textarea.value.substring(0, start) + 
                               '    ' + 
                               textarea.value.substring(start);
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            } else {
                // Indent/unindent selected lines
                const textBefore = textarea.value.substring(0, start);
                const selectedText = textarea.value.substring(start, end);
                const textAfter = textarea.value.substring(end);
                
                if (e.shiftKey) {
                    // Unindent
                    const unindented = selectedText.replace(/^    /gm, '');
                    textarea.value = textBefore + unindented + textAfter;
                    textarea.selectionStart = start;
                    textarea.selectionEnd = start + unindented.length;
                } else {
                    // Indent
                    const indented = selectedText.replace(/^/gm, '    ');
                    textarea.value = textBefore + indented + textAfter;
                    textarea.selectionStart = start;
                    textarea.selectionEnd = start + indented.length;
                }
            }
        }
    });

    // Add keyboard event listener for the entire page
    document.addEventListener('keydown', function pageHandler(e) {
        // Check for Command+Delete (Mac) or Control+Delete (Windows)
        if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
            // Prevent the default browser behavior
            e.preventDefault();
            
            // Remove the event listeners before deleting
            document.removeEventListener('keydown', pageHandler);
            window.removeEventListener('resize', autoResize);
            
            // Delete the page and return to main page
            deletePage(id);
        } else if (e.key === 'Escape') {
            // Remove the event listeners before going back
            document.removeEventListener('keydown', pageHandler);
            window.removeEventListener('resize', autoResize);
            displayMainPage();
        }
    });

    writingContainer.appendChild(textarea);
    writingContainer.appendChild(wordCount);
    
    // Handle window resize
    window.addEventListener('resize', autoResize);
    
    // Focus mode - dim UI when actively writing
    let focusTimer;
    textarea.addEventListener('focus', () => {
        focusTimer = setTimeout(() => {
            writingContainer.classList.add('focused');
        }, 2000); // Wait 2 seconds of continuous focus
    });
    
    textarea.addEventListener('blur', () => {
        clearTimeout(focusTimer);
        writingContainer.classList.remove('focused');
    });
    
    // Remove focus mode on any interaction
    textarea.addEventListener('keydown', () => {
        clearTimeout(focusTimer);
        focusTimer = setTimeout(() => {
            writingContainer.classList.add('focused');
        }, 3000); // Reset timer on keystroke
    });
    
    textarea.focus();
}

// Publishing System
function getPublishedStories() {
    const published = localStorage.getItem('publishedStories');
    return published ? JSON.parse(published) : [];
}

function savePublishedStories(stories) {
    localStorage.setItem('publishedStories', JSON.stringify(stories));
}

function publishStory(pageId) {
    if (!currentUser) return false;
    
    const userPages = getUserPages();
    const page = userPages.find(p => p.id === pageId);
    if (!page || !page.content.trim()) return false;
    
    const publishedStories = getPublishedStories();
    
    // Check if already published
    const existingIndex = publishedStories.findIndex(story => 
        story.pageId === pageId && story.authorId === currentUser.id
    );
    
    const publishedStory = {
        id: existingIndex >= 0 ? publishedStories[existingIndex].id : Date.now().toString(),
        pageId: pageId,
        title: page.title,
        content: page.content,
        authorId: currentUser.id,
        authorName: currentUser.name,
        publishedAt: Date.now(),
        lastUpdated: Date.now()
    };
    
    if (existingIndex >= 0) {
        publishedStories[existingIndex] = publishedStory;
    } else {
        publishedStories.push(publishedStory);
    }
    
    savePublishedStories(publishedStories);
    
    // Mark page as published
    page.isPublished = true;
    page.publishedAt = publishedStory.publishedAt;
    saveUserPages(userPages);
    
    return true;
}

function unpublishStory(pageId) {
    if (!currentUser) return false;
    
    const publishedStories = getPublishedStories();
    const filteredStories = publishedStories.filter(story => 
        !(story.pageId === pageId && story.authorId === currentUser.id)
    );
    
    savePublishedStories(filteredStories);
    
    // Mark page as unpublished
    const userPages = getUserPages();
    const page = userPages.find(p => p.id === pageId);
    if (page) {
        page.isPublished = false;
        delete page.publishedAt;
        saveUserPages(userPages);
    }
    
    return true;
}

function isStoryPublished(pageId) {
    if (!currentUser) return false;
    const publishedStories = getPublishedStories();
    return publishedStories.some(story => 
        story.pageId === pageId && story.authorId === currentUser.id
    );
}

// Reading Experience
function displayReadingPage() {
    document.body.innerHTML = '';
    document.body.classList.remove('auth-active');
    
    // Create dark mode toggle
    createDarkModeToggle();
    
    // Create user menu
    createUserMenu();
    
    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';
    document.body.appendChild(mainContainer);
    
    // Page title
    const pageTitle = document.createElement('h1');
    pageTitle.className = 'title';
    pageTitle.textContent = 'Stories';
    pageTitle.style.cursor = 'pointer';
    pageTitle.addEventListener('click', () => displayMainPage());
    mainContainer.appendChild(pageTitle);
    
    // Back to my stories link
    const backLink = document.createElement('div');
    backLink.className = 'page-title';
    backLink.textContent = '← Back to My Stories';
    backLink.style.marginBottom = '20px';
    backLink.addEventListener('click', () => displayMainPage());
    mainContainer.appendChild(backLink);
    
    const publishedStories = getPublishedStories();
    
    if (publishedStories.length === 0) {
        const emptyHint = document.createElement('div');
        emptyHint.className = 'empty-hint';
        emptyHint.innerHTML = `
            <div>No published stories yet.</div>
            <div>Be the first to share your story with the world.</div>
        `;
        mainContainer.appendChild(emptyHint);
        return;
    }
    
    // Add sort options if there are stories
    const sortContainer = document.createElement('div');
    sortContainer.style.marginBottom = '30px';
    sortContainer.style.fontSize = '14px';
    sortContainer.style.opacity = '0.7';
    
    const sortLabel = document.createElement('span');
    sortLabel.textContent = 'Sort by: ';
    sortContainer.appendChild(sortLabel);
    
    const sortByDate = document.createElement('span');
    sortByDate.textContent = 'Most Recent';
    sortByDate.style.cursor = 'pointer';
    sortByDate.style.textDecoration = 'underline';
    sortByDate.style.marginRight = '16px';
    
    const sortByAuthor = document.createElement('span');
    sortByAuthor.textContent = 'Author';
    sortByAuthor.style.cursor = 'pointer';
    sortByAuthor.style.opacity = '0.5';
    
    let sortMode = 'date'; // 'date' or 'author'
    
    sortByDate.addEventListener('click', () => {
        if (sortMode !== 'date') {
            sortMode = 'date';
            sortByDate.style.textDecoration = 'underline';
            sortByDate.style.opacity = '1';
            sortByAuthor.style.textDecoration = 'none';
            sortByAuthor.style.opacity = '0.5';
            displayReadingPage(); // Refresh with new sort
        }
    });
    
    sortByAuthor.addEventListener('click', () => {
        if (sortMode !== 'author') {
            sortMode = 'author';
            sortByAuthor.style.textDecoration = 'underline';
            sortByAuthor.style.opacity = '1';
            sortByDate.style.textDecoration = 'none';
            sortByDate.style.opacity = '0.5';
            displayReadingPage(); // Refresh with new sort
        }
    });
    
    sortContainer.appendChild(sortByDate);
    sortContainer.appendChild(sortByAuthor);
    mainContainer.appendChild(sortContainer);
    
    // Sort stories based on current mode
    const sortedStories = sortMode === 'date' 
        ? publishedStories.sort((a, b) => b.publishedAt - a.publishedAt)
        : publishedStories.sort((a, b) => a.authorName.localeCompare(b.authorName));
    
    sortedStories.forEach(story => {
        const storyElement = document.createElement('div');
        storyElement.className = 'title-container';
        storyElement.style.marginBottom = '16px';
        storyElement.style.cursor = 'pointer';
        
        const titleContent = document.createElement('div');
        titleContent.className = 'title-content';
        
        const titleElement = document.createElement('div');
        titleElement.className = 'page-title';
        titleElement.textContent = story.title;
        
        const authorDate = document.createElement('span');
        authorDate.className = 'page-date';
        const wordCount = countWords(story.content);
        const readingTime = getReadingTime(wordCount);
        authorDate.textContent = `by ${story.authorName} • ${formatDate(story.publishedAt)}${readingTime}`;
        
        titleContent.appendChild(titleElement);
        titleContent.appendChild(authorDate);
        storyElement.appendChild(titleContent);
        
        storyElement.addEventListener('click', () => {
            displayPublishedStory(story.id);
        });
        
        mainContainer.appendChild(storyElement);
    });
}

function displayPublishedStory(storyId) {
    const publishedStories = getPublishedStories();
    const story = publishedStories.find(s => s.id === storyId);
    
    if (!story) {
        displayReadingPage();
        return;
    }
    
    // Increment view count
    incrementStoryView(storyId);
    
    document.body.innerHTML = '';
    
    // Create dark mode toggle
    createDarkModeToggle();
    
    // Create simple back button
    const backButton = document.createElement('button');
    backButton.className = 'user-menu-toggle';
    backButton.textContent = '←';
    backButton.style.position = 'fixed';
    backButton.style.top = '20px';
    backButton.style.left = '20px';
    backButton.style.zIndex = '1000';
    backButton.addEventListener('click', () => displayReadingPage());
    document.body.appendChild(backButton);
    
    // Create reading container
    const readingContainer = document.createElement('div');
    readingContainer.className = 'writing-container';
    document.body.appendChild(readingContainer);
    
    // Story title
    const titleElement = document.createElement('h1');
    titleElement.className = 'title';
    titleElement.textContent = story.title;
    titleElement.style.cursor = 'default';
    readingContainer.appendChild(titleElement);
    
    // Author and date
    const metaInfo = document.createElement('div');
    metaInfo.style.fontSize = '14px';
    metaInfo.style.color = '#999';
    metaInfo.style.marginBottom = '40px';
    metaInfo.style.opacity = '0.8';
    metaInfo.textContent = `by ${story.authorName} • ${formatDate(story.publishedAt)}`;
    readingContainer.appendChild(metaInfo);
    
    // Story content
    const contentElement = document.createElement('div');
    contentElement.style.fontSize = '16px';
    contentElement.style.lineHeight = '1.75';
    contentElement.style.whiteSpace = 'pre-wrap';
    contentElement.style.color = 'inherit';
    contentElement.style.maxWidth = '480px';
    contentElement.textContent = story.content;
    readingContainer.appendChild(contentElement);
    
    // Add reading progress indicator
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 2px;
        background: #007acc;
        z-index: 1000;
        transition: width 0.1s ease;
        width: 0%;
    `;
    document.body.appendChild(progressBar);
    
    // Update progress on scroll
    function updateProgress() {
        const scrolled = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    }
    
    window.addEventListener('scroll', updateProgress);
    updateProgress(); // Initial call
}

// User Profile System
function displayProfilePage() {
    document.body.innerHTML = '';
    document.body.classList.remove('auth-active');
    
    // Create dark mode toggle
    createDarkModeToggle();
    
    // Create user menu
    createUserMenu();
    
    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';
    document.body.appendChild(mainContainer);
    
    // Page title
    const pageTitle = document.createElement('h1');
    pageTitle.className = 'title';
    pageTitle.textContent = 'Profile';
    pageTitle.style.cursor = 'pointer';
    pageTitle.addEventListener('click', () => displayMainPage());
    mainContainer.appendChild(pageTitle);
    
    // Back to stories link
    const backLink = document.createElement('div');
    backLink.className = 'page-title';
    backLink.textContent = '← Back to Stories';
    backLink.style.marginBottom = '40px';
    backLink.addEventListener('click', () => displayMainPage());
    mainContainer.appendChild(backLink);
    
    // Profile container
    const profileContainer = document.createElement('div');
    profileContainer.className = 'profile-container';
    mainContainer.appendChild(profileContainer);
    
    // User info section
    const userInfoSection = document.createElement('div');
    userInfoSection.className = 'profile-section';
    
    const userInfoTitle = document.createElement('h3');
    userInfoTitle.className = 'profile-section-title';
    userInfoTitle.textContent = 'Account Information';
    userInfoSection.appendChild(userInfoTitle);
    
    // Name field
    const nameField = createProfileField('Name', currentUser.name, 'name', (value) => {
        currentUser.name = value;
        updateUser(currentUser);
        // Update the user menu display
        const userMenuToggle = document.querySelector('.user-menu-toggle');
        if (userMenuToggle && userMenuToggle.textContent !== '←') {
            userMenuToggle.textContent = currentUser.name;
        }
    });
    userInfoSection.appendChild(nameField);
    
    // Email field (read-only)
    const emailField = createProfileField('Email', currentUser.email, 'email', null, true);
    userInfoSection.appendChild(emailField);
    
    // Member since field (read-only)
    const memberSince = formatDate(currentUser.createdAt);
    const memberField = createProfileField('Member since', memberSince, 'member', null, true);
    userInfoSection.appendChild(memberField);
    
    profileContainer.appendChild(userInfoSection);
    
    // Bio section
    const bioSection = document.createElement('div');
    bioSection.className = 'profile-section';
    
    const bioTitle = document.createElement('h3');
    bioTitle.className = 'profile-section-title';
    bioTitle.textContent = 'About';
    bioSection.appendChild(bioTitle);
    
    const bioField = createProfileTextArea('Tell readers about yourself...', currentUser.bio || '', (value) => {
        currentUser.bio = value;
        updateUser(currentUser);
    });
    bioSection.appendChild(bioField);
    
    profileContainer.appendChild(bioSection);
    
    // Statistics section
    const statsSection = document.createElement('div');
    statsSection.className = 'profile-section';
    
    const statsTitle = document.createElement('h3');
    statsTitle.className = 'profile-section-title';
    statsTitle.textContent = 'Statistics';
    statsSection.appendChild(statsTitle);
    
    const userPages = getUserPages();
    const publishedStories = getPublishedStories().filter(story => story.authorId === currentUser.id);
    
    // Calculate total views
    let totalViews = 0;
    publishedStories.forEach(story => {
        totalViews += getStoryViewCount(story.id);
    });
    
    // Calculate total words
    let totalWords = 0;
    userPages.forEach(page => {
        totalWords += countWords(page.content);
    });
    
    const stats = [
        { label: 'Stories written', value: userPages.length },
        { label: 'Stories published', value: publishedStories.length },
        { label: 'Total views', value: totalViews },
        { label: 'Total words', value: totalWords.toLocaleString() }
    ];
    
    stats.forEach(stat => {
        const statElement = document.createElement('div');
        statElement.className = 'profile-stat';
        
        const statValue = document.createElement('div');
        statValue.className = 'profile-stat-value';
        statValue.textContent = stat.value;
        
        const statLabel = document.createElement('div');
        statLabel.className = 'profile-stat-label';
        statLabel.textContent = stat.label;
        
        statElement.appendChild(statValue);
        statElement.appendChild(statLabel);
        statsSection.appendChild(statElement);
    });
    
    profileContainer.appendChild(statsSection);
    
    // Account Actions section
    const actionsSection = document.createElement('div');
    actionsSection.className = 'profile-section';
    
    const actionsTitle = document.createElement('h3');
    actionsTitle.className = 'profile-section-title';
    actionsTitle.textContent = 'Account Actions';
    actionsSection.appendChild(actionsTitle);
    
    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    `;
    
    // Change Password button
    const changePasswordButton = document.createElement('button');
    changePasswordButton.className = 'profile-action-button';
    changePasswordButton.textContent = 'Change Password';
    changePasswordButton.addEventListener('click', showChangePasswordDialog);
    actionsContainer.appendChild(changePasswordButton);
    
    // Export Data button
    const exportDataButton = document.createElement('button');
    exportDataButton.className = 'profile-action-button';
    exportDataButton.textContent = 'Export Data';
    exportDataButton.addEventListener('click', exportUserData);
    actionsContainer.appendChild(exportDataButton);
    
    // Delete Account button
    const deleteAccountButton = document.createElement('button');
    deleteAccountButton.className = 'profile-action-button danger';
    deleteAccountButton.textContent = 'Delete Account';
    deleteAccountButton.addEventListener('click', showDeleteAccountDialog);
    actionsContainer.appendChild(deleteAccountButton);
    
    actionsSection.appendChild(actionsContainer);
    profileContainer.appendChild(actionsSection);
}

function createProfileField(label, value, fieldId, onSave, readOnly = false) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'profile-field';
    
    const fieldLabel = document.createElement('label');
    fieldLabel.className = 'profile-field-label';
    fieldLabel.textContent = label;
    fieldLabel.setAttribute('for', fieldId);
    
    const fieldInput = document.createElement('input');
    fieldInput.type = 'text';
    fieldInput.value = value;
    fieldInput.id = fieldId;
    fieldInput.className = 'profile-field-input';
    fieldInput.readOnly = readOnly;
    
    if (!readOnly && onSave) {
        let originalValue = value;
        
        fieldInput.addEventListener('blur', () => {
            const newValue = fieldInput.value.trim();
            if (newValue !== originalValue && newValue !== '') {
                onSave(newValue);
                originalValue = newValue;
                showProfileFeedback('Updated successfully');
            } else if (newValue === '') {
                fieldInput.value = originalValue;
            }
        });
        
        fieldInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                fieldInput.blur();
            } else if (e.key === 'Escape') {
                fieldInput.value = originalValue;
                fieldInput.blur();
            }
        });
    }
    
    fieldContainer.appendChild(fieldLabel);
    fieldContainer.appendChild(fieldInput);
    
    return fieldContainer;
}

function createProfileTextArea(placeholder, value, onSave) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'profile-field';
    
    const textarea = document.createElement('textarea');
    textarea.placeholder = placeholder;
    textarea.value = value;
    textarea.className = 'profile-textarea';
    
    let originalValue = value;
    
    textarea.addEventListener('blur', () => {
        const newValue = textarea.value.trim();
        if (newValue !== originalValue) {
            onSave(newValue);
            originalValue = newValue;
            showProfileFeedback('Bio updated');
        }
    });
    
    // Auto-resize
    function autoResize() {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(textarea.scrollHeight, 80) + 'px';
    }
    
    textarea.addEventListener('input', autoResize);
    setTimeout(autoResize, 0);
    
    fieldContainer.appendChild(textarea);
    return fieldContainer;
}

function updateUser(user) {
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        users[userIndex] = { ...user };
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
}

function showProfileFeedback(message) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        z-index: 1000;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => feedback.style.opacity = '1', 10);
    setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(feedback)) {
                document.body.removeChild(feedback);
            }
        }, 300);
    }, 2000);
}

function showChangePasswordDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'profile-dialog-overlay';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'profile-dialog';
    
    const dialogTitle = document.createElement('h3');
    dialogTitle.textContent = 'Change Password';
    dialogTitle.style.marginBottom = '20px';
    
    const currentPasswordInput = document.createElement('input');
    currentPasswordInput.type = 'password';
    currentPasswordInput.placeholder = 'Current password';
    currentPasswordInput.className = 'profile-dialog-input';
    
    const newPasswordInput = document.createElement('input');
    newPasswordInput.type = 'password';
    newPasswordInput.placeholder = 'New password';
    newPasswordInput.className = 'profile-dialog-input';
    
    const confirmPasswordInput = document.createElement('input');
    confirmPasswordInput.type = 'password';
    confirmPasswordInput.placeholder = 'Confirm new password';
    confirmPasswordInput.className = 'profile-dialog-input';
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'profile-dialog-error';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'profile-dialog-buttons';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'profile-dialog-button secondary';
    cancelButton.addEventListener('click', () => document.body.removeChild(dialog));
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Change Password';
    saveButton.className = 'profile-dialog-button primary';
    saveButton.addEventListener('click', () => {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        errorMessage.textContent = '';
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            errorMessage.textContent = 'Please fill in all fields';
            return;
        }
        
        if (currentUser.password !== currentPassword) {
            errorMessage.textContent = 'Current password is incorrect';
            return;
        }
        
        if (newPassword.length < 6) {
            errorMessage.textContent = 'New password must be at least 6 characters';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            errorMessage.textContent = 'New passwords do not match';
            return;
        }
        
        currentUser.password = newPassword;
        updateUser(currentUser);
        document.body.removeChild(dialog);
        showProfileFeedback('Password changed successfully');
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(saveButton);
    
    dialogContent.appendChild(dialogTitle);
    dialogContent.appendChild(currentPasswordInput);
    dialogContent.appendChild(newPasswordInput);
    dialogContent.appendChild(confirmPasswordInput);
    dialogContent.appendChild(errorMessage);
    dialogContent.appendChild(buttonContainer);
    
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);
    
    // Close on outside click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            document.body.removeChild(dialog);
        }
    });
    
    currentPasswordInput.focus();
}

function exportUserData() {
    const userData = {
        user: {
            name: currentUser.name,
            email: currentUser.email,
            bio: currentUser.bio,
            createdAt: currentUser.createdAt
        },
        stories: getUserPages(),
        publishedStories: getPublishedStories().filter(story => story.authorId === currentUser.id)
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `stories-export-${currentUser.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showProfileFeedback('Data exported successfully');
}

function showDeleteAccountDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'profile-dialog-overlay';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'profile-dialog';
    
    const dialogTitle = document.createElement('h3');
    dialogTitle.textContent = 'Delete Account';
    dialogTitle.style.marginBottom = '20px';
    dialogTitle.style.color = '#d32f2f';
    
    const warningText = document.createElement('p');
    warningText.innerHTML = `
        <strong>This action cannot be undone.</strong><br><br>
        Deleting your account will permanently remove:
        <br>• All your stories and drafts
        <br>• Your published stories from public view
        <br>• Your account information and profile
        <br><br>
        Type "<strong>DELETE</strong>" to confirm:
    `;
    warningText.style.lineHeight = '1.6';
    warningText.style.marginBottom = '20px';
    
    const confirmInput = document.createElement('input');
    confirmInput.type = 'text';
    confirmInput.placeholder = 'Type DELETE to confirm';
    confirmInput.className = 'profile-dialog-input';
    
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Enter your password';
    passwordInput.className = 'profile-dialog-input';
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'profile-dialog-error';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'profile-dialog-buttons';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'profile-dialog-button secondary';
    cancelButton.addEventListener('click', () => document.body.removeChild(dialog));
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Account';
    deleteButton.className = 'profile-dialog-button danger';
    deleteButton.addEventListener('click', () => {
        const confirmText = confirmInput.value;
        const password = passwordInput.value;
        
        errorMessage.textContent = '';
        
        if (confirmText !== 'DELETE') {
            errorMessage.textContent = 'Please type DELETE to confirm';
            return;
        }
        
        if (password !== currentUser.password) {
            errorMessage.textContent = 'Password is incorrect';
            return;
        }
        
        // Delete user data
        deleteUserAccount();
        document.body.removeChild(dialog);
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(deleteButton);
    
    dialogContent.appendChild(dialogTitle);
    dialogContent.appendChild(warningText);
    dialogContent.appendChild(confirmInput);
    dialogContent.appendChild(passwordInput);
    dialogContent.appendChild(errorMessage);
    dialogContent.appendChild(buttonContainer);
    
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);
    
    // Close on outside click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            document.body.removeChild(dialog);
        }
    });
}

function deleteUserAccount() {
    // Remove user from users array
    users = users.filter(u => u.id !== currentUser.id);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Remove user's pages
    localStorage.removeItem(`pages_${currentUser.id}`);
    
    // Remove user's published stories
    const publishedStories = getPublishedStories();
    const filteredStories = publishedStories.filter(story => story.authorId !== currentUser.id);
    savePublishedStories(filteredStories);
    
    // Clear current user and redirect to auth
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    // Show confirmation and redirect
    const feedback = document.createElement('div');
    feedback.textContent = 'Account deleted successfully';
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #d32f2f;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        z-index: 1000;
        font-size: 14px;
        opacity: 1;
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        displayAuthPage();
    }, 2000);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = getUrlParams();
    
    // Handle public profile URLs
    if (urlParams.profile) {
        if (urlParams.story) {
            displayPublicStory(urlParams.profile, urlParams.story);
        } else {
            displayPublicProfile(urlParams.profile);
        }
        return;
    }
    
    // Normal app flow
    if (currentUser) {
        displayMainPage();
    } else {
        displayAuthPage();
    }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    const urlParams = getUrlParams();
    
    if (urlParams.profile) {
        if (urlParams.story) {
            displayPublicStory(urlParams.profile, urlParams.story);
        } else {
            displayPublicProfile(urlParams.profile);
        }
    } else {
        if (currentUser) {
            displayMainPage();
        } else {
            displayAuthPage();
        }
    }
});

// Focus mode functionality
let focusMode = false;

function toggleFocusMode() {
    focusMode = !focusMode;
    const userMenu = document.querySelector('.user-menu');
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    
    if (focusMode) {
        if (userMenu) userMenu.style.opacity = '0.1';
        if (darkModeToggle) darkModeToggle.style.opacity = '0.1';
    } else {
        if (userMenu) userMenu.style.opacity = '';
        if (darkModeToggle) darkModeToggle.style.opacity = '';
    }
}

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Dark mode toggle with Cmd/Ctrl + D
    if ((e.metaKey || e.ctrlKey) && e.key === 'd' && !e.shiftKey) {
        e.preventDefault();
        toggleDarkMode();
        return;
    }
    
    // Focus mode toggle with Cmd/Ctrl + F
    if ((e.metaKey || e.ctrlKey) && e.key === 'f' && document.querySelector('textarea')) {
        e.preventDefault();
        toggleFocusMode();
        return;
    }
    
    // Only handle global shortcuts on main page (not when in a note)
    if (document.querySelector('textarea')) return;
    
    if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        displaySearchResults('');
    }
    
    // Quick navigation with numbers
    if (e.key >= '1' && e.key <= '9' && !e.metaKey && !e.ctrlKey) {
        const index = parseInt(e.key) - 1;
        const userPages = getUserPages();
        const sortedPages = userPages.sort((a, b) => {
            const aTime = a.modifiedAt || a.createdAt || a.id;
            const bTime = b.modifiedAt || b.createdAt || b.id;
            return bTime - aTime;
        });
        
        if (sortedPages[index]) {
            openPage(sortedPages[index].id);
        }
    }
});

// Handle profile URL routing
const urlParams = getUrlParams();
if (urlParams.profile) {
    const user = getUserBySlug(urlParams.profile);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        displayProfilePage();
    } else {
        displayReadingPage();
    }
} else {
    document.addEventListener('DOMContentLoaded', () => {
        if (currentUser) {
            displayMainPage();
        } else {
            displayAuthPage();
        }
    });
}

// Public Profile Display
function displayPublicProfile(userSlug) {
    const user = getUserBySlug(userSlug);
    if (!user) {
        displayNotFoundPage();
        return;
    }
    
    document.body.innerHTML = '';
    document.body.classList.remove('auth-active');
    
    // Create dark mode toggle
    createDarkModeToggle();
    
    // Create share button for public profile (positioned next to dark mode toggle)
    const shareButton = document.createElement('button');
    shareButton.className = 'share-story-button';
    shareButton.textContent = '↗';
    shareButton.title = 'Copy profile link';
    
    const profileUrl = `${window.location.origin}${window.location.pathname}?profile=${userSlug}`;
    
    shareButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(profileUrl);
            shareButton.textContent = '✓';
            setTimeout(() => {
                shareButton.textContent = '↗';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const tempInput = document.createElement('input');
            tempInput.value = profileUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            tempInput.setSelectionRange(0, 99999);
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            shareButton.textContent = '✓';
            setTimeout(() => {
                shareButton.textContent = '↗';
            }, 2000);
        }
    });
    
    document.body.appendChild(shareButton);
    
    // Create back/home button
    const homeButton = document.createElement('button');
    homeButton.className = 'user-menu-toggle';
    homeButton.textContent = '←';
    homeButton.style.position = 'fixed';
    homeButton.style.top = '20px';
    homeButton.style.left = '20px';
    homeButton.style.zIndex = '1000';
    homeButton.title = 'Back to Stories';
    homeButton.addEventListener('click', () => {
        // Clear URL params and go back to main view
        window.history.pushState({}, '', window.location.pathname);
        if (currentUser) {
            displayMainPage();
        } else {
            displayAuthPage();
        }
    });
    document.body.appendChild(homeButton);
    
    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';
    document.body.appendChild(mainContainer);
    
    // User profile header
    const profileHeader = document.createElement('div');
    profileHeader.className = 'public-profile-header';
    
    // User name as main title
    const userName = document.createElement('h1');
    userName.className = 'title';
    userName.textContent = user.name;
    userName.style.cursor = 'default';
    profileHeader.appendChild(userName);
    
    // User bio if exists
    if (user.bio && user.bio.trim()) {
        const userBio = document.createElement('div');
        userBio.style.cssText = `
            font-size: 16px;
            line-height: 1.6;
            color: #666;
            margin-top: 16px;
            max-width: 480px;
            white-space: pre-wrap;
        `;
        if (document.body.classList.contains('dark-mode')) {
            userBio.style.color = '#999';
        }
        userBio.textContent = user.bio;
        profileHeader.appendChild(userBio);
    }
    
    // Member since info  
    const memberInfo = document.createElement('div');
    memberInfo.style.cssText = `
        font-size: 12px;
        color: #999;
        margin-top: 12px;
        opacity: 0.8;
    `;
    if (document.body.classList.contains('dark-mode')) {
        memberInfo.style.color = '#666';
    }
    memberInfo.textContent = `Writing since ${formatDate(user.createdAt)}`;
    profileHeader.appendChild(memberInfo);
    
    mainContainer.appendChild(profileHeader);
    
    // Get published stories for this user
    const publishedStories = getPublishedStories().filter(story => story.authorId === user.id);
    
    if (publishedStories.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-hint';
        emptyState.innerHTML = `
            <div>${user.name} hasn't published any stories yet.</div>
            <div style="margin-top: 12px; font-size: 12px; opacity: 0.6;">Check back later for new stories.</div>
        `;
        mainContainer.appendChild(emptyState);
        return;
    }
    
    // Stories header
    const storiesHeader = document.createElement('div');
    storiesHeader.style.cssText = `
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 30px;
    `;
    
    const storiesTitle = document.createElement('h2');
    storiesTitle.style.cssText = `
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0;
    `;
    if (document.body.classList.contains('dark-mode')) {
        storiesTitle.style.color = '#e0e0e0';
    }
    storiesTitle.textContent = `Stories (${publishedStories.length})`;
    
    const totalWords = publishedStories.reduce((total, story) => total + countWords(story.content), 0);
    const statsText = document.createElement('div');
    statsText.style.cssText = `
        font-size: 12px;
        color: #666;
        opacity: 0.8;
    `;
    if (document.body.classList.contains('dark-mode')) {
        statsText.style.color = '#999';
    }
    statsText.textContent = `${totalWords.toLocaleString()} words total`;
    
    storiesHeader.appendChild(storiesTitle);
    storiesHeader.appendChild(statsText);
    mainContainer.appendChild(storiesHeader);
    
    // Sort stories by most recent
    const sortedStories = publishedStories.sort((a, b) => b.publishedAt - a.publishedAt);
    
    // Display stories
    sortedStories.forEach(story => {
        const storyElement = document.createElement('div');
        storyElement.className = 'title-container public-story-item';
        
        const titleContent = document.createElement('div');
        titleContent.className = 'title-content';
        
        const titleElement = document.createElement('div');
        titleElement.className = 'page-title';
        titleElement.textContent = story.title;
        titleElement.style.marginBottom = '8px';
        
        const metaInfo = document.createElement('div');
        metaInfo.className = 'page-date';
        const wordCount = countWords(story.content);
        const readingTime = getReadingTime(wordCount);
        const viewCount = getStoryViewCount(story.id);
        metaInfo.textContent = `${formatDate(story.publishedAt)}${readingTime} • ${viewCount} view${viewCount !== 1 ? 's' : ''}`;
        
        // Story preview (first 100 characters)
        const preview = document.createElement('div');
        preview.className = 'public-story-preview';
        const previewText = story.content.trim().slice(0, 100);
        preview.textContent = previewText + (story.content.trim().length > 100 ? '...' : '');
        
        titleContent.appendChild(titleElement);
        titleContent.appendChild(metaInfo);
        titleContent.appendChild(preview);
        storyElement.appendChild(titleContent);
        
        storyElement.addEventListener('click', () => {
            displayPublicStory(userSlug, story.id);
        });
        
        mainContainer.appendChild(storyElement);
    });
}

function displayPublicStory(userSlug, storyId) {
    // TODO: delete when deleted in writing
    // URL when "Published" is clicked
    // right align the metadata for each story tile
    const user = getUserBySlug(userSlug);
    if (!user) {
        displayNotFoundPage();
        return;
    }
    
    const publishedStories = getPublishedStories();
    const story = publishedStories.find(s => s.id === storyId && s.authorId === user.id);
    
    if (!story) {
        displayPublicProfile(userSlug);
        return;
    }
    
    // Increment view count
    incrementStoryView(storyId);
    
    // Update URL without page reload
    window.history.pushState({}, '', `?profile=${userSlug}&story=${storyId}`);
    
    document.body.innerHTML = '';
    
    // Create dark mode toggle
    createDarkModeToggle();
    
    // Create back button
    const backButton = document.createElement('button');
    backButton.className = 'user-menu-toggle';
    backButton.textContent = '←';
    backButton.style.position = 'fixed';
    backButton.style.top = '20px';
    backButton.style.left = '20px';
    backButton.style.zIndex = '1000';
    backButton.title = `Back to ${user.name}'s stories`;
    backButton.addEventListener('click', () => {
        window.history.pushState({}, '', `?profile=${userSlug}`);
        displayPublicProfile(userSlug);
    });
    document.body.appendChild(backButton);
    
    // Create reading container
    const readingContainer = document.createElement('div');
    readingContainer.className = 'writing-container';
    document.body.appendChild(readingContainer);
    
    // Story title
    const titleElement = document.createElement('h1');
    titleElement.className = 'title';
    titleElement.textContent = story.title;
    titleElement.style.cursor = 'default';
    readingContainer.appendChild(titleElement);
    
    // Author and date info
    const metaInfo = document.createElement('div');
    metaInfo.style.cssText = `
        font-size: 14px;
        color: #999;
        margin-bottom: 40px;
        opacity: 0.8;
    `;
    
    const authorLink = document.createElement('span');
    authorLink.style.cssText = `
        cursor: pointer;
        text-decoration: underline;
        color: inherit;
    `;
    authorLink.textContent = story.authorName;
    authorLink.addEventListener('click', () => {
        window.history.pushState({}, '', `?profile=${userSlug}`);
        displayPublicProfile(userSlug);
    });
    
    const dateText = document.createElement('span');
    dateText.textContent = ` • ${formatDate(story.publishedAt)}`;
    
    metaInfo.appendChild(document.createTextNode('by '));
    metaInfo.appendChild(authorLink);
    metaInfo.appendChild(dateText);
    readingContainer.appendChild(metaInfo);
    
    // Story content
    const contentElement = document.createElement('div');
    contentElement.style.cssText = `
        font-size: 16px;
        line-height: 1.75;
        white-space: pre-wrap;
        color: inherit;
        max-width: 480px;
        margin-bottom: 40px;
    `;
    contentElement.textContent = story.content;
    readingContainer.appendChild(contentElement);
    
    // Create simple share button (positioned next to dark mode toggle)
    const shareButton = document.createElement('button');
    shareButton.className = 'share-story-button';
    shareButton.textContent = '↗';
    shareButton.title = 'Copy story link';
    
    const storyUrl = `${window.location.origin}${window.location.pathname}?profile=${userSlug}&story=${storyId}`;
    
    shareButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(storyUrl);
            shareButton.textContent = '✓';
            setTimeout(() => {
                shareButton.textContent = '↗';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const tempInput = document.createElement('input');
            tempInput.value = storyUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            tempInput.setSelectionRange(0, 99999);
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            shareButton.textContent = '✓';
            setTimeout(() => {
                shareButton.textContent = '↗';
            }, 2000);
        }
    });
    
    document.body.appendChild(shareButton);
    
    // Add reading progress indicator
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 2px;
        background: #007acc;
        z-index: 1000;
        transition: width 0.1s ease;
        width: 0%;
    `;
    document.body.appendChild(progressBar);
    
    // Update progress on scroll
    function updateProgress() {
        const scrolled = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    }
    
    window.addEventListener('scroll', updateProgress);
    updateProgress(); // Initial call
}

function displayNotFoundPage() {
    document.body.innerHTML = '';
    document.body.classList.remove('auth-active');
    
    // Create dark mode toggle
    createDarkModeToggle();
    
    // Create home button
    const homeButton = document.createElement('button');
    homeButton.className = 'user-menu-toggle';
    homeButton.textContent = '←';
    homeButton.style.position = 'fixed';
    homeButton.style.top = '20px';
    homeButton.style.left = '20px';
    homeButton.style.zIndex = '1000';
    homeButton.title = 'Back to Stories';
    homeButton.addEventListener('click', () => {
        window.history.pushState({}, '', window.location.pathname);
        if (currentUser) {
            displayMainPage();
        } else {
            displayAuthPage();
        }
    });
    document.body.appendChild(homeButton);
    
    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';
    document.body.appendChild(mainContainer);
    
    const notFoundMessage = document.createElement('div');
    notFoundMessage.className = 'empty-hint';
    notFoundMessage.innerHTML = `
        <div>Profile not found</div>
        <div style="margin-top: 12px; font-size: 12px; opacity: 0.6;">The profile you're looking for doesn't exist or has been removed.</div>
    `;
    mainContainer.appendChild(notFoundMessage);
}