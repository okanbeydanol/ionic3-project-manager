const loader = document.getElementById('loader-container');
const container = document.getElementById('container');
const nodeModulesFix = document.getElementById('node-modules-fix');
const androidFix = document.getElementById('android-fix');
const iosFix = document.getElementById('ios-fix');
const androidHooksFix = document.getElementById('android-hooks-fix');
const iosHooksFix = document.getElementById('ios-hooks-fix');

const androidHookAdd = document.getElementById('android-hooks-add');
const nodeModulesAdd = document.getElementById('node-modules-add');
const androidAdd = document.getElementById('android-add');
const iosAdd = document.getElementById('ios-add');
const modal = document.getElementById('modal');
const modal_backdrop = document.getElementById('modal_backdrop');
const close_modal = document.getElementById('close-modal');
const modal2 = document.getElementById('modal2');
const modal_backdrop2 = document.getElementById('modal_backdrop2');
const close_modal2 = document.getElementById('close-modal2');


document.addEventListener('DOMContentLoaded', async () => {
    const result = await window.projectDetail.startReadAdvance();


    result.data.node_modules_fixes.map(async (d) => {
        const icons = await createIcons('Plugin: ' + d.plugin + ', Name: ' + d.name + ', Type: ' + d.type);
        nodeModulesFix.appendChild(icons);
    });
    result.data.android_fixes.map(async (d) => {
        const icons = await createIcons('Plugin: ' + d.plugin + ', Name: ' + d.name + ', Type: ' + d.type);
        androidFix.appendChild(icons);
    });
    result.data.ios_fixes.map(async (d) => {
        const icons = await createIcons('Plugin: ' + d.plugin + ', Name: ' + d.name + ', Type: ' + d.type);
        iosFix.appendChild(icons);
    });
    result.data.androidHooks && result.data.androidHooks.map(async (d) => {
        const icons = await createIcons('Src: ' + d.$.src + ', Type: ' + d.$.type);
        androidHooksFix.appendChild(icons);
    });
    result.data.iosHooks && result.data.iosHooks.map(async (d) => {
        const icons = await createIcons('Src: ' + d.$.src + ', Type: ' + d.$.type);
        iosHooksFix.appendChild(icons);
    });
    const types = $('#server');
    types.select2({});
    types.val('before_build');
    types.trigger('change');
    nodeModulesAdd.addEventListener('click', (ev) => {
        modal.classList.remove('--hidden');
    });
    modal_backdrop.addEventListener('click', (ev) => {
        modal.classList.add('--hidden');
    });
    close_modal.addEventListener('click', (ev) => {
        modal.classList.add('--hidden');
    });
    androidHookAdd.addEventListener('click', (ev) => {
        modal2.classList.remove('--hidden');
    });
    modal_backdrop2.addEventListener('click', (ev) => {
        modal2.classList.add('--hidden');
    });
    close_modal2.addEventListener('click', (ev) => {
        modal2.classList.add('--hidden');
    });

    console.log('%c result', 'background: #222; color: #bada55', result);
    loader.classList.add('--hidden');
    container.classList.remove('--hidden');
});
const createIcons = async (title) => {
    return new Promise(
        async (resolve) => {
            const createDiv = document.createElement('div');
            createDiv.setAttribute('class', 'fix-container');

            const label = document.createElement('label');
            label.innerText = title;
            createDiv.appendChild(label);

            const penIcon = document.createElement('i');
            penIcon.setAttribute('class', 'fa-solid fa-pen icon-pen');
            const trashIcon = document.createElement('i');
            trashIcon.setAttribute('class', 'fa-solid fa-trash icon-trash');
            createDiv.appendChild(penIcon);
            createDiv.appendChild(trashIcon);
            resolve(createDiv);
        }
    );
};
