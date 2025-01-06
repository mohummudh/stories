document.body.addEventListener('click', createTitleInput);

function createTitleInput() {
    document.body.removeEventListener('click', createTitleInput);

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'title-input';
    titleInput.placeholder = 'Name your intention here...';

    document.body.appendChild(titleInput);

    titleInput.focus();

    titleInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            openWritingSpace(titleInput.value);
        }
    });
}

function openWritingSpace(title) {

}
