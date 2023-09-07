FROM arm64v8/ubuntu:latest
ENV DEBIAN_FRONTEND=noninteractive
ARG SDK_VERSION=commandlinetools-linux-8512546_latest.zip
ARG GRADLE_VERSION=7.5.1
ARG NODE_VERSION=18.15.0
ARG ANDROID_BUILD_VERSION=31.0.0
ARG ANDROID_TOOLS_VERSION=31.0.0
ARG ANDROID_VERSION=31
ARG CORDOVA_VERSION=10

ARG ssh_prv_key
ARG ssh_pub_key
SHELL ["/bin/bash", "-c"]
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=/opt/android-sdk
ENV GRADLE_HOME=/opt/gradle
ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-arm64
ENV NVM_DIR=/root/.nvm
ENV NODE_PATH=${NVM_DIR}/versions/node/v${NODE_VERSION}/lib/node_modules
ENV DOCK_USER=root
ENV USER_HOME=/home/$DOCK_USER

ENV PATH=${GRADLE_HOME}/gradle-${GRADLE_VERSION}/bin/:${PATH}
ENV PATH=${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}
ENV PATH=${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/:${PATH}
ENV PATH=${ANDROID_SDK_ROOT}/cmdline-tools/latest/tools/:${PATH}
ENV PATH=${ANDROID_SDK_ROOT}/cmdline-tools/latest/tools/bin/:${PATH}
ENV PATH=${ANDROID_SDK_ROOT}/platform-tools/:${PATH}
ENV PATH=${ANDROID_SDK_ROOT}/platforms/android-21/:${PATH}
ENV PATH=${ANDROID_SDK_ROOT}/build-tools/:${PATH}
ENV PATH=${ANDROID_SDK_ROOT}/build-tools/${ANDROID_BUILD_VERSION}/:${PATH}
ENV LD_LIBRARY_PATH=${ANDROID_SDK_ROOT}/emulator/lib64:${ANDROID_SDK_ROOT}/emulator/lib64/qt/lib/
ENV QTWEBENGINE_DISABLE_SANDBOX=1
ENV QEMU_STRACE=1
ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/lib64:/usr/x86_64-linux-gnu/lib

USER $DOCK_USER


ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone

# Install system dependencies
RUN apt-get update -qq && apt-get upgrade -qq -y --no-install-recommends \
  docker-compose libfontconfig-dev libfontconfig-dev binfmt-support qemu-user-static qemu-efi-arm crossbuild-essential-amd64 \
  libsvn-class-perl libsvn-dev libapache2-mod-svn git-svn maven perl gcc-10-arm-linux-gnueabi gcc android-libaapt aapt \
  android-platform-tools-base an android-tools-mkbootimg android-tools-fastboot android-tools-adb android-sdk-platform-tools-common \
  android-sdk-platform-tools android-sdk-libsparse-utils android-sdk-helper android-sdk-common android-sdk-build-tools-common android-sdk \
  android-sdk-build-tools x11proto-core-dev libx11-dev ccache libgl1-mesa-dev libxml2-utils xsltproc squashfs-tools libssl-dev \
  ninja-build lunzip syslinux-common syslinux-efi gettext genisoimage gettext bc xorriso libncurses5 xmlstarlet build-essential \
  git imagemagick liblz4-tool libncurses5-dev libsdl1.2-dev libxml2 lzop pngcrush rsync schedtool python3-mako libelf-dev curl \
  wget golang sudo git-core gnupg flex gperf zip curl zlib1g-dev adduser libc6-amd64-cross jq jsonnet bison mercurial apt qemu-system \
  qemu-system-x86 apt-transport-https base-files base-passwd bash bsdutils ca-certificates coreutils dash dbus debconf debianutils \
  diffutils dpkg e2fsprogs fastjar file findutils g++ gcc gcc-12-base git gnupg2 gpgv grep gzip hostname init-system-helpers \
  libacl1 libapparmor1 libapt-pkg6.0 libattr1 libaudit-common libaudit1 libblkid1 libbsd0 libbz2-1.0 libc-bin libc++-dev \
  libc6 libcap-ng0 libcap2 libcom-err2 libcrypt1 libdb5.3 libdbus-1-3 libdebconfclient0 libexpat1 libext2fs2 libffi8 libfontconfig1 \
  libgcc-s1 libgcc1 libgcrypt20 libgl1 libgmp10 libgnutls30 libgpg-error0 libgssapi-krb5-2 libguestfs-tools libhogweed6 libicu-dev \
  libidn2-0 libk5crypto3 libkeyutils1 libkrb5-3 libkrb5support0 liblocale-gettext-perl liblz4-1 liblzma5 libmd0 libmount1 libncurses6 \
  libncursesw6 libnettle8 libnsl2 libnss3 libp11-kit0 libpam-modules libpam-modules-bin libpam-runtime libpam0g libpcre2-8-0 libpcre3 \
  libprocps8 libpulse0 libpython-all-dev libpython3-all-dev libpython3-dev libseccomp2 libsecret-1-dev libselinux1 libsemanage-common \
  libsemanage2 libsepol2 libsmartcols1 libsqlite3-0 libss2 libssl3 libstdc++6 libsystemd0 libtasn1-6 libtcmalloc-minimal4 libtinfo5 \
  libtinfo6 libtirpc-common libtirpc3 libudev1 libunistring2 libuuid1 libvips-dev libvips-tools libvirt-clients libvirt-daemon-system \
  libx11-6 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxxhash0 libzip-dev libzstd1 login logsave \
  lsb-base mawk mount ncurses-base ncurses-bin netbase npm openjdk-8-jdk-headless openssl passwd patch perl-base pkg-config procps \
  python-all python-all-dev python2 python2-dev python2.7 python2.7-dev python3-all python3-all-dev python3-dev python3-distutils \
  python3-distutils-extra python3-pip python3.10 python3.10-dev python3.10-full rsync ruby ruby-dev sed sensible-utils tar unzip \
  software-properties-common sysvinit-utils ubuntu-keyring ucf usrmerge util-linux wget zipalign zlib1g qemu qemu-utils qemu-system-arm \
  qemu-efi qemu-system qemu-kvm bridge-utils lib32stdc++6-10-dbg-amd64-cross && rm -rf /var/lib/apt-get/lists/*;


RUN USERADD="${USERADD:-user}" \
  && useradd "${USERADD}" -p "${USERADD}" \
  && tee -a /etc/sudoers <<< "${USERADD} ALL=(ALL) NOPASSWD: ALL" \
  && mkdir -p "/home/${USERADD}" \
  && chown "${USERADD}:${USERADD}" "/home/${USERADD}"

RUN git config --global user.name "okanbeydanol"
RUN git config --global user.email okan.beydanol@gmail.com

# allow ssh to container
RUN mkdir -m 700 /root/.ssh

WORKDIR /root/.ssh
RUN touch authorized_keys \
    && chmod 644 authorized_keys

WORKDIR /etc/ssh
RUN tee -a sshd_config <<< 'AllowTcpForwarding yes' \
    && tee -a sshd_config <<< 'PermitTunnel yes' \
    && tee -a sshd_config <<< 'X11Forwarding yes' \
    && tee -a sshd_config <<< 'PasswordAuthentication yes' \
    && tee -a sshd_config <<< 'PermitRootLogin yes' \
    && tee -a sshd_config <<< 'PubkeyAuthentication yes' \
    && tee -a sshd_config <<< 'HostKey /etc/ssh/ssh_host_rsa_key' \
    && tee -a sshd_config <<< 'HostKey /etc/ssh/ssh_host_ecdsa_key' \
    && tee -a sshd_config <<< 'HostKey /etc/ssh/ssh_host_ed25519_key'

WORKDIR $USER_HOME/

# Minor changes to image to get ccsmp to build
RUN ln -s /usr/lib/jvm/java-1.8.0-openjdk /usr/lib/jvm/default-jvm
RUN cp /usr/include/linux/stddef.h /usr/include/stddef.h

# # Python Setup
# RUN wget -q -O Python-3.10.7.tgz https://www.python.org/ftp/python/3.10.7/Python-3.10.7.tgz --no-check-certificate
# RUN tar -xf Python-3.10.7.tgz
# RUN cd Python-3.10.7 && ./configure --enable-optimizations && make -j $(nproc) && sudo make altinstall
# RUN rm -rf Python-3.10.7.tgz
# RUN rm -rf Python-3.10.7
# ENV PATH=usr/local/lib/python3.10:/usr/local/include/python3.10:/usr/local/lib/python3.10/lib-dynload:/usr/local/bin/python3.10:/usr/bin/python3:${PATH}

RUN python3 --version
RUN ln -s /usr/bin/python3.10 /usr/bin/python
RUN ln -s /usr/x86_64-linux-gnu/lib64/ /lib64


# Pip Setup
RUN wget https://bootstrap.pypa.io/get-pip.py
RUN python3.10 get-pip.py
RUN pip install inquirer

#Gradle Setup
RUN wget https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip --no-check-certificate && \
  mkdir ${GRADLE_HOME} && \
  unzip -d ${GRADLE_HOME} gradle-${GRADLE_VERSION}-bin.zip && \
  rm -rf gradle-${GRADLE_VERSION}-bin.zip \
  && chmod 777 -R ${GRADLE_HOME} \
  && chmod 777 -R ${GRADLE_HOME}/gradle-${GRADLE_VERSION}
RUN gradle -v

#Node Setup
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
RUN node -v
RUN npx envinfo

#ANDROID SDK Setup
RUN curl -sS https://dl.google.com/android/repository/${SDK_VERSION} -o sdk.zip
RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools
RUN unzip -q -d ${ANDROID_SDK_ROOT}/cmdline-tools sdk.zip
RUN mv ${ANDROID_SDK_ROOT}/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest
RUN rm -rf sdk.zip

RUN yes | sdkmanager --licenses \
  && yes | sdkmanager "platform-tools" \
  "platforms;android-$ANDROID_VERSION" \
  "build-tools;$ANDROID_BUILD_VERSION" \
  "system-images;android-21;google_apis;armeabi-v7a" \
  "sources;android-$ANDROID_VERSION" \
  && chmod 777 -R ${ANDROID_SDK_ROOT} \
  && chmod 777 -R ${ANDROID_SDK_ROOT}/cmdline-tools

RUN cd ${ANDROID_SDK_ROOT}/build-tools/31.0.0 \
  && mv d8 dx \
  && cd lib  \
  && mv d8.jar dx.jar
RUN sdkmanager --version

#Yarn Setup
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -qq && apt-get install -qq -y --no-install-recommends yarn
RUN yarn --version

#COPY . $USER_HOME/SkillCat
#WORKDIR $USER_HOME/SkillCat

#Environment Info
RUN python3 --version
RUN sdkmanager --version
RUN node -v
RUN gradle -v
RUN yarn --version
RUN npx envinfo

#Install npx @ionic/cli cordova cordova-res
#RUN npm install -g @ionic/cli
#RUN npm install -g cordova@${CORDOVA_VERSION} --unsafe-perm=true
#RUN npm install -g cordova-res --unsafe-perm=true

#Remove will refresh files
#RUN rm -rf node_modules && rm -rf www && rm -rf plugins && rm -rf platforms/android && rm -rf platforms/ios && rm -rf package-lock.json


#nstall App Libraries
#RUN npm run cleaningjs platform=android version=1.6.2 build=13417 server=stg keystore=scripts/keystore.jks

#EXPOSE 8100 35729
#CMD ["ionic", "serve"]
