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

const android_server = document.getElementById('android-server');
const ios_server = document.getElementById('ios-server');

const android_avd_name_wrapper = document.getElementById('android_avd_name_wrapper');
const android_avd_name_input = document.getElementById('android_avd_name');


document.addEventListener('DOMContentLoaded', async () => {
    const result = await window.deployForTestDetail.startReadDevices();
    console.log('%c Devices', 'background: #222; color: #bada55', result);

    const androidData = [];
    const virtuals = result.android.data.filter(o => Object.hasOwn(o, 'device'));
    const definitions = result.android.data.filter(o => !Object.hasOwn(o, 'device'));
    androidData.push({ id: 0, text: '--AVAILABLE INSTALLED AVD MANAGERS--' });
    $.map(virtuals, function (obj) {
        obj.text = obj.device + ' - ' + obj.id;
        androidData.push(obj);
    });
    androidData.push({ id: 1, text: '--AVAILABLE DEFINITIONS FOR CREATE AVD MANAGER--' });
    $.map(definitions, function (obj) {
        obj.text = obj.name;
        androidData.push(obj);
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
    const iosServerElement = $('#ios-server');
    iosServerElement.select2({});
    iosServerElement.val('stg');
    iosServerElement.trigger('change');
    const androidServerElement = $('#android-server');
    androidServerElement.select2({});
    androidServerElement.val('stg');
    androidServerElement.trigger('change');
    androidElement.on('select2:select', function (e) {
        const data = e.params.data;
        if (Object.hasOwn(data, 'device')) {
            android_avd_name_wrapper.classList.add('--hidden');
        }
        if (Object.hasOwn(data, 'name')) {
            android_avd_name_wrapper.classList.remove('--hidden');
        }
        console.log(data);
    });
    play_android_device.addEventListener('click', async () => {
        const value = androidElement.val();
        androidElement.prop('disabled', true);
        if (value.toString() === '0' || (!android_avd_name_wrapper.classList.contains('--hidden') && !android_avd_name_input.value)) {
            return;
        }

        play_android_device.classList.add('--hidden');
        stop_android_device.classList.add('--hidden');
        loader_android_device.classList.remove('--hidden');
        const uninstall_first_android = uninstall_first_android_input.checked;
        const live_reload_android = live_reload_android_input.checked;
        const server = androidServerElement.val();
        console.log('%c android_avd_name_wrapper.classList.contains(\'--hidden\')', 'background: #222; color: #bada55', android_avd_name_wrapper.classList.contains('--hidden'));
        const startDevice = await window.deployForTestDetail.startAndroidDevice({
            device: value,
            uninstall: uninstall_first_android,
            live_reload: live_reload_android,
            server,
            avdName: android_avd_name_input.value,
            createAvd: !android_avd_name_wrapper.classList.contains('--hidden')
        });
        play_android_device.classList.add('--hidden');
        stop_android_device.classList.remove('--hidden');
        loader_android_device.classList.add('--hidden');
    });
    stop_android_device.addEventListener('click', async () => {
        const value = androidElement.val();
        androidElement.prop('disabled', false);
        if (value.toString() === '0') {
            return;
        }
        play_android_device.classList.add('--hidden');
        stop_android_device.classList.add('--hidden');
        loader_android_device.classList.remove('--hidden');
        const killPorts = await window.deployForTestDetail.killAllPortsAndroid({
            device: value,
            shutdown: true
        });
        play_android_device.classList.remove('--hidden');
        stop_android_device.classList.add('--hidden');
        loader_android_device.classList.add('--hidden');
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
        const server = iosServerElement.val();
        const startDevice = await window.deployForTestDetail.startIosDevice({
            device: value,
            uninstall: uninstall_first_ios,
            live_reload: live_reload_ios,
            server
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
        const killPorts = await window.deployForTestDetail.killAllPortsIos({
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
