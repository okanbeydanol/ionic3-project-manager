const loader = document.getElementById('loader-container');
const container = document.getElementById('container');
const play_android_device = document.getElementById('play-android-device');
const stop_android_device = document.getElementById('stop-android-device');
const play_ios_device = document.getElementById('play-ios-device');
const stop_ios_device = document.getElementById('stop-ios-device');
const live_reload_ios_input = document.getElementById('live_reload_ios');
const live_reload_android_input = document.getElementById('live_reload_android');
const uninstall_first_ios_input = document.getElementById('uninstall_first_ios');
const uninstall_first_android_input = document.getElementById('uninstall_first_android');

const loader_ios_device = document.getElementById('loader-ios-device');
const loader_android_device = document.getElementById('loader-android-device');


document.addEventListener('DOMContentLoaded', async () => {
    const result = await window.deployForTestDetail.startReadDevices();
    const androidData = $.map(result.android.data, function (obj) {
        obj.id = obj;
        obj.text = obj;
        return obj;
    });
    const androidElement = $('#android-devices');
    androidElement.select2({
        data: androidData
    });
    const iosData = $.map(result.ios.data, function (obj) {
        obj.id = obj.identifier;
        obj.text = obj.name;
        return obj;
    });
    const iosElement = $('#ios-devices');
    iosElement.select2({
        data: iosData
    });
    play_android_device.addEventListener('click', () => {
    });
    stop_android_device.addEventListener('click', () => {
    });
    play_ios_device.addEventListener('click', async () => {
        const value = iosElement.val();
        iosElement.prop('disabled', true);
        if (value.toString() === '0') {
            return;
        }
        play_ios_device.classList.add('--hidden');
        stop_ios_device.classList.add('--hidden');
        loader_ios_device.classList.remove('--hidden');
        const uninstall_first_ios = uninstall_first_ios_input.checked;
        const live_reload_ios = live_reload_ios_input.checked;

        const startDevice = await window.deployForTestDetail.startIosDevice({
            device: value,
            uninstall: uninstall_first_ios,
            live_reload: live_reload_ios
        });
        play_ios_device.classList.add('--hidden');
        stop_ios_device.classList.remove('--hidden');
        loader_ios_device.classList.add('--hidden');
    });
    stop_ios_device.addEventListener('click', async () => {
        const value = iosElement.val();
        iosElement.prop('disabled', false);
        if (value.toString() === '0') {
            return;
        }
        play_ios_device.classList.add('--hidden');
        stop_ios_device.classList.add('--hidden');
        loader_ios_device.classList.remove('--hidden');
        const killPorts = await window.deployForTestDetail.killAllPorts({
            device: value,
            shutdown: true
        });
        play_ios_device.classList.remove('--hidden');
        stop_ios_device.classList.add('--hidden');
        loader_ios_device.classList.add('--hidden');
    });
    loader.classList.add('--hidden');
    container.classList.remove('--hidden');

});
