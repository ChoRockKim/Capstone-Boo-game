# Expo 앱을 iOS와 Android 실기기에 로컬 빌드해서 테스트하기

이 문서는 Expo 앱을 처음 다루는 사람이 `iPhone`과 `Android` 실기기에 앱을 직접 설치하고 테스트할 때 필요한 흐름을 차근차근 정리한 가이드입니다.

기준은 `Expo Go`가 아니라 `expo-dev-client`가 들어간 **개발 빌드(Development Build)** 입니다. 네이티브 모듈, 커스텀 권한, `app.json`의 iOS/Android 설정, config plugin을 제대로 테스트하려면 보통 이 방식이 필요합니다.

공식 문서 참고:

- [Expo Local app development](https://docs.expo.dev/guides/local-app-development/)
- [Expo Dev Client](https://docs.expo.dev/versions/latest/sdk/dev-client/)
- [Use development builds](https://docs.expo.dev/develop/development-builds/use-development-builds/)
- [Switch from Expo Go to a development build](https://docs.expo.dev/develop/development-builds/expo-go-to-dev-build/)
- [iOS Developer Mode](https://docs.expo.dev/guides/ios-developer-mode/)

## 1. 먼저 알아야 하는 큰 그림

Expo 앱을 개발할 때 실행 방식은 크게 두 가지입니다.

### Expo Go

`Expo Go`는 App Store나 Play Store에서 받는 Expo의 공용 앱입니다. JS/TS 코드와 Expo 기본 기능을 빠르게 테스트하기 좋습니다.

하지만 다음처럼 앱마다 고유한 네이티브 설정이 필요한 경우에는 한계가 있습니다.

- 네이티브 모듈을 추가한 경우
- `expo-dev-client`를 쓰는 경우
- iOS 권한, Android 권한, 앱 scheme, bundle id, package name을 테스트해야 하는 경우
- config plugin이 네이티브 프로젝트에 반영되어야 하는 경우
- 실제 배포 앱과 비슷한 환경에서 테스트해야 하는 경우

### Development Build, Dev Client

Development Build는 **내 앱 자체를 개발용으로 빌드한 앱**입니다. 이 앱 안에 `expo-dev-client`가 들어가면 개발 서버를 고르고, QR을 열고, dev menu를 쓰는 기능이 생깁니다.

중요한 차이는 이것입니다.

```text
Expo Go
= Expo가 만든 공용 앱 안에서 내 JS를 실행

Development Build
= 내 앱을 실제로 기기에 설치하고, 그 앱이 Metro 서버의 JS를 받아 실행
```

따라서 `npx expo start --dev-client`의 QR은 Expo Go용 QR이 아닙니다. 이미 기기에 설치된 내 개발 앱을 여는 QR입니다.

## 2. 전체 순서 요약

완전히 처음 시작하는 사람이 iOS와 Android 실기기 테스트를 준비한다면 흐름은 이렇게 됩니다.

```bash
npm install
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios --device
npx expo run:android --device
npx expo start --dev-client --tunnel
```

다만 실제로는 iOS와 Android를 한 번에 다 하지 않고, 보통 한 플랫폼씩 진행합니다.

iOS만 먼저 한다면:

```bash
npm install
npx expo install expo-dev-client
npx expo prebuild --platform ios
npx expo run:ios --device
npx expo start --dev-client --tunnel
```

Android만 먼저 한다면:

```bash
npm install
npx expo install expo-dev-client
npx expo prebuild --platform android
npx expo run:android --device
npx expo start --dev-client --tunnel
```

이미 `expo-dev-client`가 설치된 프로젝트라면 `npx expo install expo-dev-client`는 생략해도 됩니다.

## 3. 사전 준비

### 공통 준비

필요한 것:

- Node.js
- npm 또는 yarn 또는 pnpm
- 프로젝트 의존성 설치
- Expo CLI는 전역 설치보다 `npx expo ...` 사용 권장

확인 명령:

```bash
node -v
npm -v
npx expo --version
```

프로젝트 의존성 설치:

```bash
npm install
```

### iOS 실기기 준비

iPhone 실기기 로컬 빌드에는 다음이 필요합니다.

- macOS
- Xcode
- iPhone
- USB 케이블
- Apple ID 또는 Apple Developer 계정
- Xcode signing 설정
- iOS 16 이상이면 Developer Mode 활성화

iOS는 보안 정책상 아무 앱이나 USB로 바로 설치할 수 없습니다. 앱을 기기에 설치하려면 Apple signing이 필요합니다.

Signing에 관련된 핵심 개념:

```text
Team
= 어떤 Apple 개발자 계정으로 서명할지

Bundle Identifier
= iOS 앱의 고유 ID
예: com.example.myapp

Signing Certificate
= 이 개발자가 만든 앱임을 증명하는 인증서

Provisioning Profile
= 이 앱을 이 기기에 설치해도 된다는 허가 파일
```

Xcode의 `Automatically manage signing`을 켜면 대부분 자동으로 생성됩니다.

### Android 실기기 준비

Android 실기기 로컬 빌드에는 다음이 필요합니다.

- Android Studio
- Android SDK
- Android 기기
- USB 케이블
- 기기의 개발자 옵션 활성화
- USB debugging 활성화

Android 연결 확인:

```bash
adb devices
```

정상이라면 대략 이렇게 나옵니다.

```text
List of devices attached
XXXXXXXX	device
```

`unauthorized`가 나오면 휴대폰 화면에서 USB 디버깅 허용 팝업을 승인해야 합니다.

## 4. app.json에서 먼저 확인할 것

Expo 프로젝트의 네이티브 설정은 보통 `app.json` 또는 `app.config.js`에 있습니다.

이 프로젝트의 핵심 값은 다음과 같습니다.

```json
{
  "expo": {
    "scheme": "booapp",
    "ios": {
      "bundleIdentifier": "com.chorockkim.booapp"
    },
    "android": {
      "package": "com.chorockkim.booapp"
    }
  }
}
```

각 값의 의미:

```text
scheme
= 앱을 URL처럼 여는 이름
예: booapp://

ios.bundleIdentifier
= iOS 앱의 고유 ID
예: com.chorockkim.booapp

android.package
= Android 앱의 고유 ID
예: com.chorockkim.booapp
```

주의할 점:

- `ios.bundleIdentifier`와 `android.package`는 앱의 신분증처럼 생각하면 됩니다.
- 이미 기기에 설치한 뒤 이 값을 바꾸면 재빌드와 재설치가 필요합니다.
- iOS bundle id는 소문자와 점을 사용하는 형태가 안전합니다.
- 예: `com.chorockkim.booapp`
- 하이픈이나 대문자가 섞인 값은 signing이나 profile 관리에서 헷갈림을 만들 수 있습니다.

## 5. expo-dev-client 확인

개발 빌드를 쓰려면 프로젝트에 `expo-dev-client`가 있어야 합니다.

설치:

```bash
npx expo install expo-dev-client
```

설치 확인:

```bash
npm ls expo-dev-client
```

`package.json`의 dependencies 안에 이런 식으로 들어가 있으면 됩니다.

```json
{
  "dependencies": {
    "expo-dev-client": "~6.0.21"
  }
}
```

버전은 Expo SDK에 따라 다를 수 있으므로 직접 숫자를 복사하기보다 `npx expo install expo-dev-client`로 설치하는 것이 좋습니다.

## 6. prebuild 이해하기

Expo 프로젝트는 처음에는 `ios/`, `android/` 폴더가 없을 수 있습니다. 이때 `prebuild`가 `app.json`과 설치된 라이브러리, Expo config plugin을 바탕으로 네이티브 프로젝트를 생성합니다.

```bash
npx expo prebuild
```

iOS만 생성:

```bash
npx expo prebuild --platform ios
```

Android만 생성:

```bash
npx expo prebuild --platform android
```

기존 네이티브 폴더를 지우고 다시 생성:

```bash
npx expo prebuild --clean
```

`--clean`은 강력한 명령입니다. `ios/`, `android/` 안에 직접 수정한 내용이 있다면 사라질 수 있습니다.

처음 배우는 단계에서는 보통 다음 원칙을 추천합니다.

```text
JS/TS 코드만 수정했다
=> prebuild 필요 없음

app.json의 iOS/Android 설정을 바꿨다
=> prebuild 필요

네이티브 모듈을 새로 설치했다
=> prebuild 필요

scheme, bundleIdentifier, android.package를 바꿨다
=> prebuild + 재빌드 + 재설치 필요

ios/ 또는 android/ 안을 직접 수정했다
=> prebuild --clean 전에 반드시 변경 내용 확인
```

## 7. iOS 실기기에 로컬 빌드하기

### 7.1 iPhone 연결

iPhone을 USB로 Mac에 연결합니다.

iPhone에서 다음을 확인합니다.

- 이 컴퓨터를 신뢰할지 묻는 팝업 승인
- iOS 16 이상이면 Developer Mode 활성화
- 잠금 해제 상태 유지

Developer Mode는 보통 다음 경로에 있습니다.

```text
Settings
→ Privacy & Security
→ Developer Mode
```

### 7.2 iOS 네이티브 프로젝트 생성

처음이라면:

```bash
npx expo prebuild --platform ios
```

이미 `ios/`가 있지만 `app.json`의 iOS 설정을 바꿨거나 scheme이 꼬인 것 같다면:

```bash
npx expo prebuild --clean --platform ios
```

### 7.3 Xcode signing 확인

Xcode에서 프로젝트를 열어 signing을 확인합니다.

```bash
open ios/Booapp.xcodeproj
```

또는 CocoaPods workspace를 열어야 하는 상황이면:

```bash
open ios/Booapp.xcworkspace
```

Xcode에서 확인할 곳:

```text
Booapp target
→ Signing & Capabilities
→ Automatically manage signing 체크
→ Team 선택
→ Bundle Identifier 확인
```

정상 상태:

```text
Automatically manage signing: 켜짐
Team: 내 Apple 계정 또는 팀
Bundle Identifier: app.json의 ios.bundleIdentifier와 동일
Provisioning Profile: Xcode Managed Profile
Signing Certificate: Apple Development ...
```

### 7.4 iPhone에 앱 설치

터미널에서:

```bash
npx expo run:ios --device
```

이 명령은 다음을 합니다.

```text
ios/ 네이티브 프로젝트를 Xcode로 빌드
→ 연결된 iPhone 선택
→ 앱 서명
→ iPhone에 앱 설치
→ 앱 실행
```

처음 빌드는 오래 걸릴 수 있습니다.

## 8. Android 실기기에 로컬 빌드하기

### 8.1 Android 개발자 옵션 켜기

기기마다 메뉴 이름은 조금씩 다르지만 일반적인 흐름은 다음과 같습니다.

```text
Settings
→ About phone
→ Build number 7번 탭
→ Developer options 활성화
```

그 다음:

```text
Settings
→ Developer options
→ USB debugging 켜기
```

### 8.2 기기 연결 확인

USB로 연결한 뒤:

```bash
adb devices
```

정상:

```text
XXXXXXXX	device
```

권한 미승인:

```text
XXXXXXXX	unauthorized
```

`unauthorized`라면 Android 기기 화면에서 RSA fingerprint 허용 팝업을 승인합니다.

### 8.3 Android 네이티브 프로젝트 생성

처음이라면:

```bash
npx expo prebuild --platform android
```

Android package나 권한 설정을 바꿨다면:

```bash
npx expo prebuild --clean --platform android
```

### 8.4 Android 기기에 앱 설치

```bash
npx expo run:android --device
```

보통 `--device` 없이도 연결된 기기를 찾지만, 여러 기기나 에뮬레이터가 있으면 `--device`가 더 명확합니다.

## 9. Metro 서버 실행과 QR 연결

iOS나 Android에 개발 빌드를 한 번 설치했다면, 이후 JS/TS 코드 개발은 Metro 서버로 진행합니다.

이 프로젝트에서는 QR scheme과 tunnel 옵션을 고정한 스크립트를 준비해두었습니다.

```bash
npm run dev:device
```

캐시까지 지우고 다시 시작하고 싶다면:

```bash
npm run dev:device:clear
```

ngrok tunnel이 불안정하거나 같은 Wi-Fi 안에서 직접 붙고 싶다면 LAN 스크립트를 사용합니다.

```bash
npm run dev:device:lan
```

캐시까지 지우고 다시 시작하고 싶다면:

```bash
npm run dev:device:lan:clear
```

위 스크립트는 내부적으로 다음 명령을 실행합니다.

```bash
expo start --dev-client --host tunnel --scheme exp+boo-app
```

LAN 스크립트는 내부적으로 다음 명령을 실행합니다.

```bash
expo start --dev-client --host lan --scheme exp+boo-app
```

일반 Expo 명령을 직접 입력한다면:

```bash
npx expo start --dev-client
```

실기기에서 LAN 연결이 자주 실패한다면 처음부터 tunnel을 추천합니다.

```bash
npx expo start --dev-client --tunnel
```

중요한 점:

- 이 QR은 Expo Go용 QR이 아닙니다.
- 기기에 설치된 내 개발 앱을 여는 QR입니다.
- iPhone 기본 카메라로 QR을 찍거나, 개발 앱 안에서 서버를 선택할 수 있습니다.
- QR을 찍었는데 Safari나 브라우저만 열린다면 dev client 앱 설치 또는 URL scheme 연결이 잘못된 상태일 수 있습니다.

## 10. LAN과 Tunnel 차이

### LAN

```bash
npx expo start --dev-client
```

장점:

- 빠릅니다.
- 같은 Wi-Fi 안에서는 가장 자연스럽습니다.

조건:

- 컴퓨터와 휴대폰이 같은 네트워크에 있어야 합니다.
- VPN, 방화벽, 회사/학교 Wi-Fi 정책 때문에 막힐 수 있습니다.

### Tunnel

```bash
npx expo start --dev-client --tunnel
```

장점:

- 같은 Wi-Fi 문제가 있어도 우회할 수 있습니다.
- 실기기 테스트에서 연결 문제를 줄일 수 있습니다.

단점:

- LAN보다 느릴 수 있습니다.
- tunnel 패키지나 네트워크 상태에 영향을 받을 수 있습니다.

실기기 초심자에게는 `--tunnel`이 더 편할 때가 많습니다.

## 11. 언제 다시 빌드해야 할까?

매번 `run:ios`나 `run:android`를 할 필요는 없습니다.

### 다시 빌드하지 않아도 되는 경우

대부분의 JS/TS 수정:

- 화면 UI 수정
- React component 수정
- 스타일 수정
- API 호출 코드 수정
- 일반 비즈니스 로직 수정

이 경우:

```bash
npx expo start --dev-client --tunnel
```

켜둔 상태에서 앱을 reload하면 됩니다.

### 다시 빌드해야 하는 경우

다음은 네이티브 앱 자체가 바뀌는 경우입니다.

- `expo-dev-client`를 새로 설치한 경우
- 네이티브 모듈이 포함된 라이브러리를 설치/삭제한 경우
- `app.json`의 `ios`, `android`, `plugins`, `scheme`, `permissions`를 바꾼 경우
- `ios.bundleIdentifier`를 바꾼 경우
- `android.package`를 바꾼 경우
- 앱 아이콘, splash screen 등 네이티브 리소스 설정을 바꾼 경우
- iOS 권한 문구를 바꾼 경우
- Android 권한을 바꾼 경우

이 경우:

```bash
npx expo prebuild --clean --platform ios
npx expo run:ios --device
```

또는:

```bash
npx expo prebuild --clean --platform android
npx expo run:android --device
```

## 12. 자주 일어나는 에러 처리

### QR을 찍으면 앱이 아니라 브라우저가 열림

가능한 원인:

- 개발 빌드 앱이 기기에 설치되어 있지 않음
- `expo-dev-client`가 들어간 앱으로 빌드하지 않음
- QR의 URL scheme을 받을 앱이 없음
- `app.json`의 `scheme` 변경 후 재빌드하지 않음
- Expo Go로 QR을 열려고 함

해결:

```bash
npx expo prebuild --clean --platform ios
npx expo run:ios --device
npx expo start --dev-client --tunnel
```

Android라면:

```bash
npx expo prebuild --clean --platform android
npx expo run:android --device
npx expo start --dev-client --tunnel
```

확인 방법:

```text
booapp://
```

같은 custom scheme을 휴대폰 브라우저 주소창에 입력했을 때 앱이 열리면 scheme 등록은 된 것입니다. 앱이 안 열리면 개발 빌드를 다시 설치해야 합니다.

### iOS에서 No profiles for ... were found

예시:

```text
No profiles for 'com.example.app' were found.
Xcode couldn't find any iOS App Development provisioning profiles.
```

원인:

- 해당 bundle id용 provisioning profile이 없음
- Xcode signing team이 선택되지 않음
- 자동 signing이 꺼져 있음
- `app.json`의 `ios.bundleIdentifier`와 Xcode의 Bundle Identifier가 다름

해결:

1. Xcode 열기

```bash
open ios/Booapp.xcodeproj
```

2. Xcode에서 확인

```text
Booapp target
→ Signing & Capabilities
→ Automatically manage signing 체크
→ Team 선택
→ Bundle Identifier 확인
```

3. `app.json`과 동일하게 맞추기

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.chorockkim.booapp"
    }
  }
}
```

4. 다시 빌드

```bash
npx expo run:ios --device
```

### iOS에서 Developer Mode가 필요하다고 나옴

iOS 16 이상에서는 개발 빌드를 실행하려면 Developer Mode가 필요할 수 있습니다.

해결:

```text
Settings
→ Privacy & Security
→ Developer Mode
→ On
→ iPhone 재시작
```

### Xcode에서 workspace를 열면 먹통처럼 보임

가능한 원인:

- 처음 열면서 indexing 중
- Pods 프로젝트를 읽는 중
- Xcode cache 또는 DerivedData 문제
- 한글 경로, 특수문자 경로에서 Xcode가 느려지는 경우

해결 순서:

1. 몇 분 기다려 보기
2. Xcode 완전 종료 후 다시 열기
3. `.xcworkspace` 대신 signing 확인용으로 `.xcodeproj` 열기

```bash
open ios/Booapp.xcodeproj
```

4. 계속 문제가 있으면 프로젝트를 영어 경로로 옮겨 보기

```text
~/Projects/Boo-app
```

### Android에서 adb devices에 기기가 안 보임

원인:

- USB debugging이 꺼져 있음
- 케이블이 충전 전용임
- Android SDK platform tools가 설치되지 않음
- 휴대폰에서 USB 연결 모드가 파일 전송이 아님

해결:

```bash
adb devices
```

기기 화면에서 USB 디버깅 허용 팝업을 승인합니다.

그래도 안 보이면:

- USB 케이블 교체
- USB 포트 교체
- Android Studio에서 SDK Platform Tools 설치 확인
- Android 기기에서 USB 모드를 File Transfer로 변경

### Android에서 unauthorized가 나옴

예시:

```text
XXXXXXXX	unauthorized
```

해결:

1. Android 기기 화면 확인
2. RSA fingerprint 허용 팝업 승인
3. 다시 확인

```bash
adb devices
```

필요하면 기기에서 USB debugging을 껐다 켜거나, 개발자 옵션에서 USB debugging authorizations를 초기화합니다.

### Metro 서버에 연결이 안 됨

증상:

- 앱은 열리는데 JS bundle을 못 가져옴
- 계속 loading
- Network response timed out
- 개발 서버 목록이 안 보임
- tunnel 시작 중 `remote gone away`
- tunnel 시작 중 `session closed`

해결:

```bash
npx expo start --dev-client --tunnel
```

이 프로젝트에서는 먼저 아래 스크립트를 써도 됩니다.

```bash
npm run dev:device
```

ngrok이 `remote gone away` 또는 `session closed`로 실패하면, 같은 Wi-Fi 안에서 LAN으로 우회합니다.

```bash
npm run dev:device:lan
```

캐시까지 함께 지우고 다시 시도하려면:

```bash
npm run dev:device:lan:clear
```

추가 확인:

- 컴퓨터와 휴대폰이 같은 Wi-Fi인지
- VPN이 켜져 있는지
- 방화벽이 Node/Metro 연결을 막는지
- 회사/학교 Wi-Fi가 기기간 통신을 막는지

### 네이티브 모듈을 설치했는데 앱에서 못 찾음

예시:

```text
Native module cannot be null
TurboModuleRegistry.getEnforcing(...): could not be found
```

원인:

- JS dependency만 설치하고 앱을 다시 빌드하지 않음
- 네이티브 프로젝트에 모듈이 반영되지 않음

해결:

```bash
npx expo prebuild --clean
npx expo run:ios --device
```

또는:

```bash
npx expo prebuild --clean
npx expo run:android --device
```

### bundleIdentifier 또는 android.package를 바꾼 뒤 이상해짐

원인:

- 기기에 이전 ID의 앱이 남아 있음
- Xcode signing profile은 이전 bundle id 기준임
- Android는 이전 package의 앱과 새 package 앱이 별개로 취급됨

해결:

1. 기기에서 기존 앱 삭제
2. `app.json` 값 확인
3. prebuild clean
4. 다시 설치

```bash
npx expo prebuild --clean --platform ios
npx expo run:ios --device
```

Android:

```bash
npx expo prebuild --clean --platform android
npx expo run:android --device
```

## 13. 간단명료 코드 정리

### 처음 세팅

```bash
npm install
npx expo install expo-dev-client
```

### iOS 실기기 처음 설치

```bash
npx expo prebuild --platform ios
npx expo run:ios --device
```

### Android 실기기 처음 설치

```bash
npx expo prebuild --platform android
npx expo run:android --device
```

### 평소 개발 서버 실행

```bash
npx expo start --dev-client --tunnel
```

### iOS 네이티브 설정을 바꾼 뒤

```bash
npx expo prebuild --clean --platform ios
npx expo run:ios --device
npx expo start --dev-client --tunnel
```

### Android 네이티브 설정을 바꾼 뒤

```bash
npx expo prebuild --clean --platform android
npx expo run:android --device
npx expo start --dev-client --tunnel
```

### iOS signing 확인용 Xcode 열기

```bash
open ios/Booapp.xcodeproj
```

### Android 기기 연결 확인

```bash
adb devices
```

### 캐시까지 의심될 때 Metro 재시작

```bash
npx expo start --dev-client --tunnel --clear
```

## 14. 초심자용 추천 루틴

처음에는 한 번에 iOS와 Android를 다 잡으려고 하지 말고, 한 플랫폼씩 끝내는 것이 좋습니다.

### iPhone부터 잡는 루틴

```bash
npm install
npx expo install expo-dev-client
npx expo prebuild --platform ios
open ios/Booapp.xcodeproj
npx expo run:ios --device
npx expo start --dev-client --tunnel
```

Xcode에서는 signing만 확인합니다.

```text
Automatically manage signing
Team
Bundle Identifier
Provisioning Profile
Signing Certificate
```

### Android부터 잡는 루틴

```bash
npm install
npx expo install expo-dev-client
adb devices
npx expo prebuild --platform android
npx expo run:android --device
npx expo start --dev-client --tunnel
```

Android에서는 USB debugging 허용 팝업을 놓치지 않는 것이 중요합니다.

## 15. 마지막으로 기억할 것

가장 중요한 원칙은 이것입니다.

```text
JS/TS만 바꿨다
=> Metro reload

네이티브 설정이나 모듈을 바꿨다
=> prebuild + run:ios/run:android

QR이 브라우저로 열린다
=> dev client 앱 설치와 scheme 등록을 의심

iOS 실기기 설치가 안 된다
=> signing, provisioning, bundleIdentifier를 확인

Android 실기기 설치가 안 된다
=> USB debugging, adb devices, package name을 확인
```

Expo 로컬 실기기 개발은 처음에는 복잡해 보이지만, 실제로는 다음 네 단계를 반복하는 구조입니다.

```text
설정 확인
→ 네이티브 프로젝트 생성
→ 기기에 개발 앱 설치
→ Metro 서버에 연결
```
