const environmentType = {
    brew: 'brew',
    sdk: 'sdk',
    git: 'git',
    node: 'node',
    java: 'java',
    gradle: 'gradle',
    ionic: 'ionic',
    cordova: 'cordova',
    cordovaRes: 'cordovaRes',
    xcode: 'xcode',
    nativeRun: 'nativeRun',
    iosDeploy: 'iosDeploy',
    buildTools: 'buildTools',
    platformTools: 'platformTools',
    platformsAndroid: 'platformsAndroid'
};

const brewVersionInput = document.getElementById('brew-version');
const sdkVersionInput = document.getElementById('sdk-version');
const gitVersionInput = document.getElementById('git-version');
const nodeVersionInput = document.getElementById('node-version');
const javaVersionInput = document.getElementById('java-version');
const gradleVersionInput = document.getElementById('gradle-version');
const ionicVersionInput = document.getElementById('ionic-version');
const cordovaVersionInput = document.getElementById('cordova-version');
const cordovaResVersionInput = document.getElementById('cordova-res-version');
const xcodeVersionInput = document.getElementById('xcode-version');
const nativeRunVersionInput = document.getElementById('native-run-version');
const iosDeployVersionInput = document.getElementById('ios-deploy-version');
const buildToolsVersionInput = document.getElementById('build-tools-version');
const platformsAndroidVersionInput = document.getElementById('platforms-android-version');
const platformToolsVersionInput = document.getElementById('platform-tools-version');
const configAndroidVersion = document.getElementById('config-android-version');
const configAndroidBuildNumber = document.getElementById('config-android-build-number');
const configIosVersion = document.getElementById('config-ios-version');
const configIosBuildNumber = document.getElementById('config-ios-build-number');
document.addEventListener('DOMContentLoaded', async () => {
    const data = await window.projectDetail.startReadDetailData();
    const windowData = data.windowData;
    const configData = data.configData;
    if (configData) {
        configAndroidVersion.value = configData.androidVersion;
        configAndroidBuildNumber.value = configData.androidBuildNumber;
        configIosVersion.value = configData.iosVersion;
        configIosBuildNumber.value = configData.iosBuildNumber;
    }
    if (windowData) {
        const data = $.map(windowData.branches, function (obj) {
            obj.id = obj.id || obj.name;
            obj.text = obj.text || obj.name; //
            return obj;
        });
        const branchesElement = $('#branches');
        branchesElement.select2({
            data: data
        });
        branchesElement.val(windowData.gitConfig.currentBranch ? windowData.gitConfig.currentBranch : 'master');
        branchesElement.trigger('change');
        $('#server').select2({});
        brewVersionInput.nextElementSibling.addEventListener('click', async (ev) => {
            if (brewVersionInput.value) {
                brewVersionInput.nextElementSibling.classList.add('--hidden');
                brewVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
                const result = await window.projectSettings.installBrewSettings(brewVersionInput.value);
                brewVersionInput.nextElementSibling.classList.remove('--hidden');
                brewVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
        });
        javaVersionInput.nextElementSibling.addEventListener('click', async (ev) => {
            if (javaVersionInput.value) {
                javaVersionInput.nextElementSibling.classList.add('--hidden');
                javaVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
                const result = await window.projectSettings.installJavaWithAzulSettings(javaVersionInput.value);
                javaVersionInput.nextElementSibling.classList.remove('--hidden');
                javaVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
        });
        buildToolsVersionInput.nextElementSibling.addEventListener('click', async (ev) => {
            if (buildToolsVersionInput.value) {
                buildToolsVersionInput.nextElementSibling.classList.add('--hidden');
                buildToolsVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
                const result = await window.projectSettings.installBuildToolsSettings(buildToolsVersionInput.value);
                buildToolsVersionInput.nextElementSibling.classList.remove('--hidden');
                buildToolsVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
        });
        platformsAndroidVersionInput.nextElementSibling.addEventListener('click', async (ev) => {
            if (platformsAndroidVersionInput.value) {
                platformsAndroidVersionInput.nextElementSibling.classList.add('--hidden');
                platformsAndroidVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
                const result = await window.projectSettings.installPlatformsSettings(platformsAndroidVersionInput.value);
                platformsAndroidVersionInput.nextElementSibling.classList.remove('--hidden');
                platformsAndroidVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
        });
        window.projectSettings.cleanerStarted((ev, value) => {
            brewVersionInput.nextElementSibling.classList.add('--hidden');
            brewVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            sdkVersionInput.nextElementSibling.classList.add('--hidden');
            sdkVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            gitVersionInput.nextElementSibling.classList.add('--hidden');
            gitVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            nodeVersionInput.nextElementSibling.classList.add('--hidden');
            nodeVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            javaVersionInput.nextElementSibling.classList.add('--hidden');
            javaVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            cordovaVersionInput.nextElementSibling.classList.add('--hidden');
            cordovaVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            cordovaResVersionInput.nextElementSibling.classList.add('--hidden');
            cordovaResVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            gradleVersionInput.nextElementSibling.classList.add('--hidden');
            gradleVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            ionicVersionInput.nextElementSibling.classList.add('--hidden');
            ionicVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            xcodeVersionInput.nextElementSibling.classList.add('--hidden');
            xcodeVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            nativeRunVersionInput.nextElementSibling.classList.add('--hidden');
            nativeRunVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            iosDeployVersionInput.nextElementSibling.classList.add('--hidden');
            iosDeployVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            buildToolsVersionInput.nextElementSibling.classList.add('--hidden');
            buildToolsVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            platformsAndroidVersionInput.nextElementSibling.classList.add('--hidden');
            platformsAndroidVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
            platformToolsVersionInput.nextElementSibling.classList.add('--hidden');
            platformToolsVersionInput.nextElementSibling.nextElementSibling.classList.remove('--hidden');
        });
        window.projectSettings.environmentCheckData((ev, value) => {
            if (value.type === environmentType.brew) {
                console.log('%c brewVersionInput', 'background: #222; color: #bada55', brewVersionInput);
                brewVersionInput.value = value.data;
                brewVersionInput.nextElementSibling.classList.remove('--hidden');
                brewVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.sdk) {
                sdkVersionInput.value = value.data;
                sdkVersionInput.nextElementSibling.classList.remove('--hidden');
                sdkVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.git) {
                gitVersionInput.value = value.data;
                gitVersionInput.nextElementSibling.classList.remove('--hidden');
                gitVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.node) {
                nodeVersionInput.value = value.data;
                nodeVersionInput.nextElementSibling.classList.remove('--hidden');
                nodeVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.java) {
                javaVersionInput.value = value.data;
                javaVersionInput.nextElementSibling.classList.remove('--hidden');
                javaVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.cordova) {
                cordovaVersionInput.value = value.data;
                cordovaVersionInput.nextElementSibling.classList.remove('--hidden');
                cordovaVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.cordovaRes) {
                cordovaResVersionInput.value = value.data;
                cordovaResVersionInput.nextElementSibling.classList.remove('--hidden');
                cordovaResVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.gradle) {
                gradleVersionInput.value = value.data;
                gradleVersionInput.nextElementSibling.classList.remove('--hidden');
                gradleVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.ionic) {
                ionicVersionInput.value = value.data;
                ionicVersionInput.nextElementSibling.classList.remove('--hidden');
                ionicVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.xcode) {
                xcodeVersionInput.value = value.data;
                xcodeVersionInput.nextElementSibling.classList.remove('--hidden');
                xcodeVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.nativeRun) {
                nativeRunVersionInput.value = value.data;
                nativeRunVersionInput.nextElementSibling.classList.remove('--hidden');
                nativeRunVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.iosDeploy) {
                iosDeployVersionInput.value = value.data;
                iosDeployVersionInput.nextElementSibling.classList.remove('--hidden');
                iosDeployVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.buildTools) {
                buildToolsVersionInput.value = value.data;
                buildToolsVersionInput.nextElementSibling.classList.remove('--hidden');
                buildToolsVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.platformTools) {
                platformToolsVersionInput.value = value.data;
                platformToolsVersionInput.nextElementSibling.classList.remove('--hidden');
                platformToolsVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            if (value.type === environmentType.platformsAndroid) {
                platformsAndroidVersionInput.value = value.data;
                platformsAndroidVersionInput.nextElementSibling.classList.remove('--hidden');
                platformsAndroidVersionInput.nextElementSibling.nextElementSibling.classList.add('--hidden');
            }
            console.log('%c value', 'background: #222; color: #bada55', value);
        });
    }
});
