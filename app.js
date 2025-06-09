// Initialize or load existing notes from localStorage
let pages = JSON.parse(localStorage.getItem('pages')) || [];

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
    // Find the index of the page we want to delete
    const pageIndex = pages.findIndex(page => page.id === id);
    
    // Remove the page if found
    if (pageIndex !== -1) {
        pages.splice(pageIndex, 1);
        savePages();
        displayMainPage();
    }
}

// Display the main page where users can create new notes
function displayMainPage() {
    // First, remove any existing click listener before clearing the page
    document.body.removeEventListener('click', createTitleInput);
    
    document.body.innerHTML = '';
    
    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';
    document.body.appendChild(mainContainer);
    
    // Then add the new click listener
    mainContainer.addEventListener('click', createTitleInput);

    // Sort pages by most recently modified
    const sortedPages = pages.sort((a, b) => {
        const aTime = a.modifiedAt || a.createdAt || a.id;
        const bTime = b.modifiedAt || b.createdAt || b.id;
        return bTime - aTime;
    });

    // Show hint if no pages exist
    if (sortedPages.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'empty-hint';
        hint.innerHTML = 'Click anywhere to start writing<br><span style="font-size: 11px; opacity: 0.6;">Press / to search • 1-9 for quick access • Escape to return • ⌘⌫ to delete</span>';
        mainContainer.appendChild(hint);
    }

    // Display existing titles
    sortedPages.forEach((page, index) => {
        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-container';
        
        const titleElement = document.createElement('div');
        titleElement.textContent = page.title;
        titleElement.className = 'page-title';
        titleElement.style.cursor = 'pointer';
        titleElement.style.marginBottom = '15px';
        
        // Add subtle number indicator for quick access
        if (index < 9) {
            const numberHint = document.createElement('span');
            numberHint.className = 'number-hint';
            numberHint.textContent = `${index + 1}`;
            titleContainer.appendChild(numberHint);
        }
        
        const dateElement = document.createElement('span');
        dateElement.className = 'page-date';
        dateElement.textContent = formatDate(page.modifiedAt || page.createdAt || page.id);
        
        titleContainer.appendChild(titleElement);
        titleContainer.appendChild(dateElement);
        
        titleElement.addEventListener('click', (e) => {
            e.stopPropagation();
            openPage(page.id);
        });
        
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
            pages.push(newPage);
            savePages();
            openPage(newPage.id);
        }
    });

    event.currentTarget.removeEventListener('click', createTitleInput);
}

// Simple search functionality
function displaySearchResults(query) {
    document.body.innerHTML = '';
    
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
    
    const results = pages.filter(page => 
        page.title.toLowerCase().includes(query.toLowerCase()) ||
        page.content.toLowerCase().includes(query.toLowerCase())
    );
    
    results.forEach(page => {
        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-container search-result';
        
        const titleElement = document.createElement('div');
        titleElement.textContent = page.title;
        titleElement.className = 'page-title';
        titleElement.style.cursor = 'pointer';
        
        const dateElement = document.createElement('span');
        dateElement.className = 'page-date';
        dateElement.textContent = formatDate(page.modifiedAt || page.createdAt || page.id);
        
        titleContainer.appendChild(titleElement);
        titleContainer.appendChild(dateElement);
        
        titleElement.addEventListener('click', (e) => {
            e.stopPropagation();
            openPage(page.id);
        });
        
        mainContainer.appendChild(titleContainer);
    });
    
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

    const page = pages.find(p => p.id === id);
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
                    savePages();
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
                savePages();
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
        savePages();
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
            
            // Delete the page and return to main page
            deletePage(id);
        } else if (e.key === 'Escape') {
            // Remove the event listeners before going back
            document.removeEventListener('keydown', pageHandler);
            displayMainPage();
        }
    });

    writingContainer.appendChild(textarea);
    writingContainer.appendChild(wordCount);
    
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

// Initialize the app
document.addEventListener('DOMContentLoaded', displayMainPage);

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Only handle global shortcuts on main page (not when in a note)
    if (document.querySelector('textarea')) return;
    
    if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        displaySearchResults('');
    }
    
    // Quick navigation with numbers
    if (e.key >= '1' && e.key <= '9' && !e.metaKey && !e.ctrlKey) {
        const index = parseInt(e.key) - 1;
        const sortedPages = pages.sort((a, b) => {
            const aTime = a.modifiedAt || a.createdAt || a.id;
            const bTime = b.modifiedAt || b.createdAt || b.id;
            return bTime - aTime;
        });
        
        if (sortedPages[index]) {
            openPage(sortedPages[index].id);
        }
    }
});