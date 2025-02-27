// Initialize or load existing notes from localStorage
let pages = JSON.parse(localStorage.getItem('pages')) || [];

// Save notes to localStorage
function savePages() {
    localStorage.setItem('pages', JSON.stringify(pages));
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
    
    // Then add the new click listener
    document.body.addEventListener('click', createTitleInput);

    // Display existing titles
    pages.forEach(page => {
        const titleElement = document.createElement('div');
        titleElement.textContent = page.title;
        titleElement.className = 'page-title';
        titleElement.style.cursor = 'pointer';
        titleElement.style.marginBottom = '15px';
        
        titleElement.addEventListener('click', (e) => {
            e.stopPropagation();
            openPage(page.id);
        });
        
        document.body.appendChild(titleElement);
    });
}

// Create a new title input when the page is clicked
function createTitleInput(event) {
    if (event.target !== document.body) return;

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    
    document.body.appendChild(titleInput);
    titleInput.focus();

    titleInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && titleInput.value.trim() !== '') {
            const newPage = {
                id: Date.now(),
                title: titleInput.value.trim(),
                content: ''
            };
            pages.push(newPage);
            savePages();
            openPage(newPage.id);
        }
    });

    document.body.removeEventListener('click', createTitleInput);
}



// Open a specific note for editing
function openPage(id) {
    document.body.innerHTML = '';

    const page = pages.find(p => p.id === id);
    if (!page) {
        displayMainPage();
        return;
    }

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
                savePages();
                titleElement.textContent = newTitle;
            }
            titleInput.replaceWith(titleElement);
        });
    });

    document.body.appendChild(titleElement);
    
    // Create content area
    const textarea = document.createElement('textarea');
    textarea.value = page.content;
    
    textarea.addEventListener('input', () => {
        page.content = textarea.value;
        savePages();
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

    document.body.appendChild(textarea);
    textarea.focus();
}

// Initialize the app
document.addEventListener('DOMContentLoaded', displayMainPage);