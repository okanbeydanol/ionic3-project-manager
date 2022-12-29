const cleanType = document.getElementsByClassName('clean-type');
const commandInput = document.getElementById('command-input');
const ios_cleaner = document.getElementById('ios_cleaner');
const android_cleaner = document.getElementById('android_cleaner');
const command_input_label = document.getElementById('command-input-label');
const terminal = document.getElementById('terminal');
const consoleType = {
    command: 'command',
    output: 'output',
    error: 'error',
    info: 'info'
};
let scroll = false;

document.addEventListener('DOMContentLoaded', async () => {


    window.terminalDetail.listenCommandNode((ev, value) => {
        console.log('%c ev', 'background: #222; color: #bada55', ev);
        console.log('%c value', 'background: #222; color: #bada55', value);
        if (value.type === consoleType.command) {
            const span = document.createElement('span');
            span.setAttribute('style', 'display: block;color: #976262;');
            span.innerHTML = value.data;
            terminal.insertAdjacentElement('beforeend', span);
        }
        if (value.type === consoleType.output) {
            const span = document.createElement('span');
            span.setAttribute('style', 'display: block;color: #976262;');
            span.innerHTML = value.data;
            terminal.insertAdjacentElement('beforeend', span);
        }
        if (value.type === consoleType.info) {
            const span = document.createElement('span');
            span.setAttribute('style', 'display: block;color: #976262;');
            span.innerHTML = value.data;
            terminal.insertAdjacentElement('beforeend', span);
        }
        if (value.type === consoleType.error) {
            const span = document.createElement('span');
            span.setAttribute('style', 'display: block;color: #976262;');
            span.innerHTML = value.data;
            terminal.insertAdjacentElement('beforeend', span);
        }
        if (value.type === 'folder_change') {
            command_input_label.innerText = value.data;
        }
        console.log('%c scroll', 'background: #222; color: #bada55', scroll);

        if (!scroll) {
            terminal.scrollTo(0, terminal.scrollHeight);
        }
    });
    const getCommand = async () => {
        const type = [];
        const target = [];
        Array.from(cleanType).map((t) => {
            const att = t.getAttributeNames();
            if (att.includes('prepare') && t.classList.contains('clean-type--active')) {
                if (!target.includes('prepare')) {
                    target.push('prepare');
                }
            }
            if (att.includes('android_apk') && t.classList.contains('clean-type--active')) {
                if (!target.includes('apk')) {
                    target.push('apk');
                }
            }
            if (att.includes('android_bundle') && t.classList.contains('clean-type--active')) {
                if (!target.includes('bundle')) {
                    target.push('bundle');
                }
            }

            if (att.includes('node_modules') && t.classList.contains('clean-type--active')) {
                if (!target.includes('node_modules')) {
                    target.push('node_modules');
                }
            }
            if (att.includes('ios_prepare') && t.classList.contains('clean-type--active')) {
                if (!type.includes('ios')) {
                    type.push('ios');
                }
                if (!target.includes('prepare')) {
                    target.push('prepare');
                }
            }
            if (att.includes('ios_build') && t.classList.contains('clean-type--active')) {
                if (!type.includes('ios')) {
                    type.push('ios');
                }
                if (!target.includes('build')) {
                    target.push('build');
                }
            }
            if (att.includes('ios_archive') && t.classList.contains('clean-type--active')) {
                if (!type.includes('ios')) {
                    type.push('ios');
                }
                if (!target.includes('archive')) {
                    target.push('archive');
                }
            }
        });
        return { type: type, target: target };

    };
    console.log('%c cleanType', 'background: #222; color: #bada55', cleanType);

    Array.from(cleanType).map((t) => {
        t.addEventListener('click', async (ev) => {
            if (t.classList.contains('clean-type--active')) {
                t.classList.remove('clean-type--active');
                t.children[1].classList.add('clean-type-img--active');
            } else {
                t.classList.add('clean-type--active');
                t.children[1].classList.remove('clean-type-img--active');
            }
            const command = await getCommand();
            console.log('%c command', 'background: #222; color: #bada55', command);
            if (command.type.length + command.target.length === 0) {
                commandInput.value = 'npm run cleaning';
            } else {
                commandInput.value = 'npm run cleaning type=' + command.type.join(',') + ' target=' + command.target.join(',');
            }
        });
    });
    android_cleaner.addEventListener('click', async () => {
        const command = await getCommand();
        if (command.type.length + command.target.length !== 0) {
            window.projectDetail.startAndroidCleanerPreload(command.target);
        }
    });

    const currentPath = await window.projectDetail.currentPath();
    command_input_label.innerText = currentPath;


    terminal.addEventListener('scroll', (ev) => {
        const calc = ev.target.scrollHeight - ev.target.clientHeight;
        if (calc - 1000 < +ev.target.scrollTop) {
            console.log('%c FALSEEE', 'background: #222; color: #bada55', +ev.target.scrollTop, calc);
            scroll = false;
        } else {
            console.log('%c TRUUUUU', 'background: #222; color: #bada55', +ev.target.scrollTop, calc);

            scroll = true;
        }
    });


});
