document.addEventListener('DOMContentLoaded', async () => {
    const drag_drop_container = document.getElementById('drag-drop-container');
    const loaderContainer = document.getElementById('loader-container');
    drag_drop_container.addEventListener("dragover", function (event) {
        event.target.style.filter = 'blur(0.6px)';
        event.preventDefault();
    }, false);

    drag_drop_container.addEventListener("dragleave", function (event) {
        event.target.style.filter = 'blur(0)';
    }, false);

    drag_drop_container.addEventListener("drop", async function (ev) {
        ev.target.parentElement.classList.add('drag-drop-container--active');
        loaderContainer.style.display = 'block';
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
        if (ev.dataTransfer.files.length > 0) {
            const d = await window.projectDetail.startRead(ev.dataTransfer.files[0].path);
            if (!d.data) {
                alert('This is not a ionic project. We couln`t find config.xml');
                ev.target.parentElement.classList.remove('drag-drop-container--active');
                loaderContainer.style.display = 'none';
            }
        }


    }, false);
});
