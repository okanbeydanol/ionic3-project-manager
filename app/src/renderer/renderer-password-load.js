document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('password-button').addEventListener('click', async () => {
        const setPasswordDialog = await window.projectDetail.setPasswordDialog(document.getElementById('password-input').value);
    });
});
