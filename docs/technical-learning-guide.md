# 부 키우기 기술 학습 가이드

이 문서는 `부 키우기` 프로젝트를 통해 모바일 앱 개발을 처음부터 다시 이해하기 위한 학습 문서입니다. 단순히 “어떤 라이브러리를 썼다”를 나열하는 것이 아니라, 각 기술이 왜 필요했고, 이 프로젝트에서는 어떤 문제를 해결하기 위해 어떻게 적용되었는지를 설명합니다.

각 장은 가능한 한 다음 순서로 읽히도록 구성했습니다.

```text
기초 개념
-> 작은 예시
-> 이 프로젝트의 실제 코드
-> 왜 이렇게 했는지
-> 자주 헷갈리는 점
```

읽을 때 추천하는 방식은 먼저 큰 흐름을 이해한 뒤, 필요한 장을 다시 돌아와서 코드와 함께 보는 것입니다.

---

## 1장. 앱 전체를 Top-down으로 보기

### 1.1 먼저 큰 흐름부터 보기

앱은 사용자가 화면에서 보는 것보다 훨씬 많은 일을 뒤에서 먼저 준비합니다. `부 키우기` 앱의 큰 흐름은 다음과 같습니다.

```text
앱 실행
-> 네이티브 Splash 표시
-> app/_layout.tsx 실행
-> 폰트, 필수 이미지, 사운드 preload
-> Provider 준비
-> Expo Router가 현재 화면 결정
-> 로그인 화면 app/index.tsx 표시
-> 로그인 후 app/game/index.tsx로 이동
-> 게임 화면 이미지와 캐릭터 preload
-> 커스텀 로딩 화면 표시
-> 메인 게임 화면 표시
```

여기서 중요한 점은 “화면 전환”과 “데이터 준비”가 동시에 일어난다는 것입니다. 사용자는 로그인 화면과 게임 화면만 보는 것처럼 느끼지만, 내부에서는 폰트, 이미지, 사운드, 서버 데이터, 상태 복원 등이 순차적으로 준비됩니다.

### 1.2 엔트리 포인트란 무엇인가

엔트리 포인트는 앱이 시작될 때 가장 먼저 들어가는 입구입니다. Expo Router 프로젝트에서는 `package.json`의 `main` 값이 중요합니다.

```json
{
  "main": "expo-router/entry"
}
```

이 값은 Expo Router가 `app` 폴더를 기준으로 화면 구조를 읽도록 만듭니다.

### 1.3 `_layout.tsx`의 역할

`app/_layout.tsx`는 개별 화면보다 더 위에 있는 공통 뼈대입니다. 이 프로젝트에서는 다음 역할을 합니다.

- 폰트 로딩
- 필수 이미지 preload
- React Query Provider 설정
- Safe Area Provider 설정
- Android navigation bar 설정
- BGM/SFX preload
- 라우트 등록

실제 코드 일부:

```tsx
SplashScreen.preventAutoHideAsync();

const REQUIRED_IMAGE_ASSETS = [
  require("../assets/images/main-building.png"),
  require("../assets/images/main-title.png"),
  require("../assets/images/inGameMain.png"),
  require("../assets/images/egg-closed.png"),
  require("../assets/images/egg-opened.png"),
];
```

이 코드는 네이티브 Splash가 자동으로 사라지지 않도록 막고, 앱이 처음 표시되기 전에 반드시 필요한 이미지를 미리 불러오기 위해 준비한 배열입니다.

```tsx
return (
  <QueryClientProvider client={queryClient}>
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="game/index" />
        <Stack.Screen name="room/index" />
      </Stack>
    </SafeAreaProvider>
  </QueryClientProvider>
);
```

이 부분은 앱 전체에 필요한 Provider와 화면 Stack을 설정합니다.

### 1.4 Provider란 무엇인가

Provider는 하위 컴포넌트들이 특정 기능을 사용할 수 있도록 감싸주는 상위 컴포넌트입니다.

예를 들어 `QueryClientProvider`가 없으면 `useQuery`를 사용할 수 없습니다. 실제로 이 프로젝트에서도 한때 다음 오류가 발생했습니다.

```text
No QueryClient set, use QueryClientProvider to set one
```

이 오류는 React Query를 쓰는 훅이 있는데, 그 위쪽에 `QueryClientProvider`가 없을 때 발생합니다.

### 1.5 이 장에서 기억할 것

```text
_layout.tsx
= 앱 전체 공통 준비 공간

Provider
= 하위 컴포넌트들이 특정 기능을 사용할 수 있게 해주는 감싸개

Router
= 현재 어떤 화면을 보여줄지 결정하는 구조

Preload
= 화면에 필요한 리소스를 미리 불러오는 작업
```

---

## 2장. JavaScript / TypeScript / React 기초

### 2.1 JavaScript와 TypeScript의 차이

JavaScript는 실제로 실행되는 언어입니다. TypeScript는 JavaScript에 타입 시스템을 추가한 언어입니다.

작은 예시:

```ts
let coin = 100;
coin = "많음"; // JavaScript에서는 실행 전까지 실수인지 알기 어렵습니다.
```

TypeScript에서는 다음처럼 타입을 지정할 수 있습니다.

```ts
let coin: number = 100;
coin = "많음"; // 타입 오류
```

이 프로젝트는 TypeScript를 사용합니다. 게임 상태나 퀴즈 데이터처럼 구조가 중요한 데이터가 많기 때문에, 타입을 두면 실수를 줄일 수 있습니다.

### 2.2 객체와 배열

객체는 이름이 붙은 값들의 묶음입니다.

```ts
const user = {
  name: "김외대",
  coin: 100,
};
```

배열은 순서가 있는 목록입니다.

```ts
const menus = ["라멘", "카레", "제육덮밥"];
```

이 프로젝트에서는 에셋 목록, 퀴즈 목록, 학식 메뉴 목록이 모두 배열로 관리됩니다.

### 2.3 타입, interface, union type

`interface`는 객체의 모양을 정의합니다.

```ts
interface TopAlertState {
  autoHideDuration: number;
  closable: boolean;
  message: string;
  title: string;
  visible: boolean;
}
```

`union type`은 여러 값 중 하나만 허용하는 타입입니다.

```ts
export type MealSectionId = "breakfast" | "lunch" | "dinner";
```

이렇게 하면 `"snack"` 같은 잘못된 값이 들어가는 것을 막을 수 있습니다.

### 2.4 import와 export

파일 간에 코드를 나누기 위해 `export`와 `import`를 사용합니다.

```ts
export const getXpProgressInfo = (totalXp: number) => {
  // ...
};
```

```ts
import { getXpProgressInfo } from "@/utils/xpProgress";
```

이 프로젝트는 기능별로 파일을 나누고, 필요한 곳에서 import해서 사용합니다.

### 2.5 함수와 콜백

함수는 특정 일을 수행하는 코드 묶음입니다.

```ts
const clampVolume = (volume: number) => Math.max(0, Math.min(volume, 1));
```

콜백은 다른 함수에 전달되는 함수입니다.

```tsx
<Pressable onPress={() => setIsMealOpen(true)} />
```

여기서 `() => setIsMealOpen(true)`가 콜백입니다. 버튼이 눌렸을 때 실행됩니다.

### 2.6 Promise와 async/await

서버 요청, 이미지 preload, 사운드 준비처럼 시간이 걸리는 작업은 바로 결과가 나오지 않습니다. 이런 비동기 작업을 다룰 때 Promise와 async/await를 사용합니다.

```ts
const preloadAssets = async () => {
  await Promise.all(
    REQUIRED_IMAGE_ASSETS.map((source) => ExpoImage.loadAsync(source)),
  );
};
```

`await`는 “이 작업이 끝날 때까지 기다린다”는 뜻입니다.

### 2.7 React 컴포넌트, props, state

React 컴포넌트는 UI를 만드는 함수입니다.

```tsx
const CoinBox = ({ coin }: { coin: number }) => {
  return <Text>{coin}</Text>;
};
```

`props`는 부모 컴포넌트가 자식 컴포넌트에게 넘겨주는 값입니다. 위 예시에서 `coin`이 props입니다.

`state`는 컴포넌트가 기억하는 값입니다.

```tsx
const [isMealOpen, setIsMealOpen] = useState(false);
```

이 값이 바뀌면 React는 화면을 다시 그립니다.

### 2.8 Hook 기초

이 프로젝트에서 자주 쓰는 Hook은 다음과 같습니다.

| Hook | 역할 |
| --- | --- |
| `useState` | 화면 상태를 기억 |
| `useEffect` | 렌더링 이후 부수효과 실행 |
| `useMemo` | 계산 결과 캐싱 |
| `useCallback` | 함수를 캐싱 |
| `useRef` | 렌더링과 무관하게 값을 보관 |

실제 예시:

```tsx
const booChatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

말풍선을 일정 시간 뒤에 닫기 위해 timeout id를 저장합니다. 이 값은 화면을 다시 그릴 필요가 없으므로 `useState`가 아니라 `useRef`가 적절합니다.

### 2.9 자주 헷갈리는 점

- `state`가 바뀌면 화면이 다시 렌더링됩니다.
- `ref`가 바뀌어도 화면은 다시 렌더링되지 않습니다.
- `useEffect`는 화면이 그려진 뒤 실행됩니다.
- `async/await`는 비동기 작업을 순서대로 읽기 쉽게 만드는 문법입니다.

---

## 3장. React Native와 Expo

### 3.1 React Native는 언어가 아니다

React Native는 JavaScript/TypeScript로 iOS와 Android 앱을 만드는 프레임워크입니다. 언어는 TypeScript이고, React Native는 그 언어로 모바일 앱 UI를 만들게 해주는 도구입니다.

```text
TypeScript = 코드를 쓰는 언어
React = UI를 컴포넌트로 만드는 라이브러리
React Native = React 방식으로 모바일 앱을 만드는 프레임워크
Expo = React Native 앱 개발을 편하게 해주는 플랫폼
```

### 3.2 웹과 React Native의 차이

웹에서는 `div`, `span`, `button`, `img`를 씁니다.

React Native에서는 다음을 씁니다.

| 웹 | React Native |
| --- | --- |
| `div` | `View` |
| `span`, `p` | `Text` |
| `button` | `Pressable` |
| `img` | `Image` |

작은 예시:

```tsx
<View>
  <Text>부 키우기</Text>
</View>
```

### 3.3 Expo는 무엇인가

Expo는 React Native 앱 개발을 쉽게 해주는 플랫폼입니다. 네이티브 기능, 빌드, 테스트, 설정을 더 간단하게 다룰 수 있게 해줍니다.

이 프로젝트에서 사용한 Expo 기능:

- `expo-router`: 화면 라우팅
- `expo-image`: 이미지 캐싱과 preload
- `expo-audio`: BGM, 효과음
- `expo-font`: 픽셀 폰트 로딩
- `expo-splash-screen`: Splash 제어
- `expo-navigation-bar`: Android 내비게이션 바 숨김

### 3.4 Expo Go와 Development Build

Expo Go는 Expo가 만든 공용 앱입니다. 간단한 기능을 빠르게 테스트할 수 있지만, 앱 고유 네이티브 모듈이 필요하면 한계가 있습니다.

Development Build는 내 앱 자체를 개발용으로 빌드한 것입니다.

```text
Expo Go
= Expo 공용 앱 안에서 내 JS 실행

Development Build
= 내 앱을 기기에 설치하고 그 안에서 JS 실행
```

이 프로젝트는 `expo-dev-client`, `expo-audio`, `expo-navigation-bar`, 앱 scheme 등 네이티브 설정이 중요하므로 Development Build 기준으로 테스트하는 것이 안전합니다.

### 3.5 자주 헷갈리는 점

- Expo는 React Native를 대체하는 것이 아니라 도와주는 플랫폼입니다.
- Expo Go에서 되던 것이 Development Build에서 다르게 보일 수 있고, 반대도 가능합니다.
- 네이티브 모듈을 새로 추가하면 앱을 재빌드해야 합니다.

---

## 4장. Expo Router와 화면 구조

### 4.1 파일 기반 라우팅

Expo Router는 `app` 폴더의 파일 구조를 URL처럼 해석합니다.

```text
app/index.tsx       -> /
app/game/index.tsx  -> /game
app/room/index.tsx  -> /room
```

즉 파일을 만들면 라우트가 생깁니다.

### 4.2 Stack 화면 등록

`app/_layout.tsx`에서 Stack을 등록합니다.

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="index" />
  <Stack.Screen name="game/index" />
  <Stack.Screen name="room/index" />
</Stack>
```

`headerShown: false`는 Expo Router의 기본 헤더를 숨기고, 우리가 만든 픽셀 UI만 보이게 하기 위한 설정입니다.

### 4.3 화면 이동

게임 화면에서 마이룸으로 이동하는 코드:

```tsx
<SquareButton
  Icon={home}
  onPress={() => router.replace("/room")}
/>
```

`replace`는 현재 화면을 새 화면으로 교체합니다. 뒤로가기 히스토리를 남기고 싶으면 `push`를 사용할 수 있습니다.

### 4.4 라우트 오류가 나는 이유

라우트가 없는데 이동하려고 하면 `Unmatched Route`가 뜹니다.

예를 들어 `/home`으로 이동하려는데 `app/home/index.tsx`가 없으면 오류가 납니다. 반대로 `/room`으로 이동하려면 `app/room/index.tsx`가 있어야 합니다.

---

## 5장. UI 컴포넌트 구조

### 5.1 컴포넌트란 무엇인가

컴포넌트는 화면의 일부를 독립적으로 만든 UI 조각입니다.

예를 들어 버튼을 매번 새로 만들지 않고 `SquareButton`으로 만들면, 여러 화면에서 같은 규칙으로 재사용할 수 있습니다.

```tsx
<SquareButton Icon={setting} onPress={() => setIsOptionOpen(true)} />
```

### 5.2 props로 값을 넘기기

컴포넌트는 props를 통해 외부에서 값을 받습니다.

```tsx
<ProgressBar
  booName={booName}
  grade={displayedGrade}
  xp={displayedProgressXp}
  maxXp={displayedProgressMaxXp}
/>
```

`ProgressBar`는 직접 store를 읽지 않고, 부모가 넘겨준 값을 화면에 표시합니다. 이렇게 하면 컴포넌트가 더 재사용 가능해집니다.

### 5.3 React Native 기본 UI

| 컴포넌트 | 역할 |
| --- | --- |
| `View` | 레이아웃 박스 |
| `Text` | 글자 |
| `Pressable` | 누를 수 있는 영역 |
| `Image` | 이미지 |
| `StyleSheet` | 스타일 정의 |

### 5.4 overlay와 zIndex

이 프로젝트에는 패널, 알림창, 말풍선, 진화 오버레이처럼 서로 겹치는 UI가 많습니다. 이때 `position: absolute`, `zIndex`, `elevation`을 사용합니다.

```tsx
root: {
  ...StyleSheet.absoluteFillObject,
  zIndex: 999,
  elevation: 999,
}
```

Android에서는 `zIndex`만으로 부족한 경우가 있어 `elevation`도 함께 쓰는 경우가 많습니다.

### 5.5 SafeArea

휴대폰에는 노치, 상태바, 홈 인디케이터, Android 내비게이션 바가 있습니다. 이를 피해서 UI를 배치하려면 Safe Area를 고려해야 합니다.

```tsx
<SafeAreaView style={styles.container}>
  {/* main controls */}
</SafeAreaView>
```

### 5.6 이 프로젝트의 UI 철학

이 앱은 픽셀 아트 스타일을 유지해야 하므로, 버튼과 패널의 느낌이 화면마다 다르면 전체 완성도가 떨어집니다. 그래서 다음 요소를 공통 패턴으로 만들었습니다.

- `SquareButton`: 아이콘 버튼
- `MainButton`: 큰 액션 버튼
- `TopAlert`: 상단 알림
- `BooChat`: 캐릭터 말풍선
- `OptionButton`, `ProfileButton`, `FriendPanelButton`: 패널 내부 버튼

---

## 6장. 상태관리 기초: Local State와 Global State

### 6.1 상태란 무엇인가

상태는 시간이 지나며 바뀌는 값입니다.

예를 들어 다음은 상태입니다.

- 옵션 창이 열렸는지
- 현재 코인이 몇 개인지
- 현재 XP가 몇인지
- 튜토리얼을 봤는지
- 지금 캐릭터가 배고픈지

### 6.2 Local State

Local state는 특정 컴포넌트 안에서만 필요한 상태입니다.

```tsx
const [isMealOpen, setIsMealOpen] = useState(false);
const [isQuizOpen, setIsQuizOpen] = useState(false);
```

이 값들은 메인 게임 화면 안에서 어떤 패널을 열지 결정하는 UI 상태입니다. 앱 전체에 저장될 필요는 없습니다.

### 6.3 Global State

Global state는 여러 화면에서 공유하거나 앱을 껐다 켜도 유지해야 하는 상태입니다.

예:

- `coin`
- `totalXp`
- `friendList`
- `hasSeenGameTutorial`
- `equippedRoomItems`
- `masterVolume`, `bgmVolume`, `sfxVolume`

이런 값은 Zustand store에 둡니다.

### 6.4 판단 기준

```text
한 화면에서만 쓰는가?
-> local state

여러 화면에서 쓰는가?
-> global state

앱을 껐다 켜도 유지되어야 하는가?
-> global state + persist

서버에서 받아오는 원본 데이터인가?
-> TanStack Query
```

### 6.5 props drilling이란 무엇인가

부모에서 자식, 그 자식의 자식까지 계속 props를 넘기는 상황을 props drilling이라고 합니다. 너무 깊어지면 코드가 복잡해집니다.

Zustand는 이런 전역 상태를 필요한 컴포넌트에서 직접 꺼내 쓰게 해줍니다.

```tsx
const coin = useGameStore((state) => state.coin);
```

---

## 7장. Zustand, persist, AsyncStorage

### 7.1 Zustand란 무엇인가

Zustand는 React 앱에서 전역 상태를 관리하는 라이브러리입니다. Redux보다 문법이 간단하고, 작은 게임 상태를 빠르게 관리하기 좋습니다.

작은 예시:

```ts
const useStore = create((set) => ({
  coin: 100,
  addCoin: () => set((state) => ({ coin: state.coin + 1 })),
}));
```

### 7.2 이 프로젝트의 store

실제 코드:

```ts
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialGameState(),
      adjustCoin: (delta) =>
        set((state) => ({
          coin: Math.max(state.coin + delta, 0),
        })),
    }),
    {
      name: "boo-game-store",
      storage: createJSONStorage(resolvePersistStorage),
    },
  ),
);
```

`useGameStore`는 게임 데이터의 중심입니다.

### 7.3 state, action, selector

Zustand store에는 상태와 액션이 함께 들어갑니다.

```ts
coin: number;
adjustCoin: (delta: number) => void;
```

상태를 읽을 때는 selector를 씁니다.

```tsx
const coin = useGameStore((state) => state.coin);
```

액션도 같은 방식으로 꺼냅니다.

```tsx
const adjustCoin = useGameStore((state) => state.adjustCoin);
```

### 7.4 persist와 AsyncStorage 차이

가장 많이 헷갈리는 부분입니다.

```text
AsyncStorage
= 실제로 폰 내부에 값을 저장하는 저장소

persist
= Zustand 상태를 저장소에 자동 저장하고 복원하는 미들웨어
```

즉 AsyncStorage는 창고이고, persist는 store의 값을 창고에 넣고 꺼내주는 직원입니다.

### 7.5 partialize

모든 상태를 저장하면 안 됩니다. 예를 들어 `pendingEvolution`처럼 현재 실행 중인 컷신 상태가 앱 재실행 후 복원되면 이상합니다.

그래서 저장할 값만 고릅니다.

```ts
partialize: (state) => ({
  booName: state.booName,
  coin: state.coin,
  totalXp: state.totalXp,
  hasSeenGameTutorial: state.hasSeenGameTutorial,
  equippedRoomItems: state.equippedRoomItems,
})
```

게스트 모드는 로그인 세션과 분리된 `guestGameSnapshot`을 함께 저장합니다. 게스트 모드 종료 시 현재 로컬 진행도를 snapshot에 보관하고, 다음에 게스트로 시작하면 그 snapshot을 복원합니다. 로컬 전용 플레이에서는 서버 로그인 이벤트가 없으므로 게스트 시작 또는 기존 게스트 저장값 복원 시 `first_login` 업적을 즉시 달성 처리합니다.

게스트 프로필 기본값은 학번 `00000000`, 이름 `외대생`, 닉네임 `부`입니다. 게스트 모드에서는 설정의 `나의 계정`에서 학번, 이름, 닉네임을 로컬로 수정할 수 있지만 친구 기능과 비밀번호 변경은 제공하지 않습니다. 설정의 `게스트 데이터 초기화` 버튼으로 로컬 게스트 진행도와 저장 snapshot을 처음 상태로 되돌릴 수 있습니다.

게스트 모드에서는 서버와 섞일 수 있는 친구 기능을 막습니다. 메인/미니게임의 친구 버튼, 친구 관리 패널, 친구 방, 방명록 작성, 미니게임 친구 랭킹 fallback은 게스트에서 사용하지 않고 사용 불가 모달을 보여줍니다. 게스트 진행도는 서버로 보내지 않으며, 회원 계정과 병합하는 API도 현재는 없습니다.

### 7.6 AsyncStorage native module 이슈

개발 중 다음 경고가 있었습니다.

```text
AsyncStorage native module is unavailable.
Falling back to in-memory storage until the app is rebuilt.
```

이는 네이티브 모듈이 개발 빌드에 아직 반영되지 않았을 때 발생할 수 있습니다. 이 프로젝트는 앱이 죽지 않도록 fallback storage를 둡니다.

```ts
const noopStorage: StateStorage = {
  getItem: async () => null,
  removeItem: async () => {},
  setItem: async () => {},
};
```

이 fallback은 임시 저장소이므로 앱을 재실행하면 값이 유지되지 않습니다. 진짜 저장을 위해서는 앱 재빌드가 필요합니다.

---

## 8장. 데이터 관리 구조

### 8.1 데이터의 종류

이 앱의 데이터는 크게 네 가지로 나뉩니다.

| 종류 | 예시 | 관리 위치 |
| --- | --- | --- |
| 정적 에셋 | 캐릭터, 음식, 가구, 사운드 | `assets` |
| 사용자 상태 | XP, 코인, 친구, 튜토리얼 여부 | Zustand |
| 서버 데이터 | 학식 메뉴, 추후 유저 정보 | TanStack Query |
| 파생 데이터 | 현재 학년, 프로그레스바 | 계산 함수 |

### 8.2 정적 에셋

정적 에셋은 앱 내부에 포함된 파일입니다.

```text
assets/characters  -> 부 캐릭터 이미지
assets/plates      -> 음식 이미지
assets/Rooms       -> 마이룸 방/가구 이미지
assets/musics      -> BGM, SFX
assets/tutorials   -> 튜토리얼 이미지
```

캐릭터나 버튼처럼 자주 쓰이는 이미지는 서버에서 매번 가져오면 느립니다. 그래서 앱에 포함시켰습니다.

### 8.3 사용자 상태 데이터

사용자마다 달라지는 값은 store에서 관리합니다.

```ts
type GameStoreState = {
  booName: string;
  coin: number;
  totalXp: number;
  friendList: FriendListItem[];
  quizAttemptHistory: QuizAttemptHistory;
  lastFedMeals: MealHistory;
  equippedRoomItems: EquippedRoomItems;
};
```

### 8.4 파생 데이터

파생 데이터는 저장하지 않고 계산하는 값입니다.

예를 들어 현재 학년은 저장하지 않습니다. `totalXp`를 보고 계산합니다.

```ts
const xpProgress = useMemo(() => getXpProgressInfo(totalXp), [totalXp]);
```

이렇게 하면 서버에는 `totalXp`만 저장해도 되고, 현재 학년과 진행률은 언제든 계산할 수 있습니다.

### 8.5 서버 연동 후 구조

서버가 붙으면 서버는 원본 데이터만 저장합니다.

```text
서버가 저장:
- userId
- totalXp
- coin
- friendList
- equippedItemIds
- tutorial completion

프론트가 계산:
- current grade
- progress bar
- itemId -> image
- character image
```

이 구조는 서버 부담을 줄이고, 프론트의 게임 표현을 유연하게 만듭니다.

---

## 9장. XP, 학년, 진화 시스템

### 9.1 왜 totalXp 하나만 저장하는가

XP를 저장하는 방법은 두 가지가 있습니다.

```text
방법 A
현재 학년, 현재 학년 XP를 따로 저장

방법 B
누적 XP totalXp만 저장하고 나머지는 계산
```

이 프로젝트는 방법 B를 선택했습니다.

이유:

- 서버에 저장할 값이 단순해집니다.
- 학년 기준이 바뀌어도 계산 함수만 수정하면 됩니다.
- 현재 학년, 현재 XP, 졸업 여부를 일관되게 계산할 수 있습니다.

### 9.2 XP 기준

```ts
const GRADE_XP_REQUIREMENTS: Record<CharacterGrade, number> = {
  1: 1500,
  2: 2000,
  3: 2500,
  4: 3000,
};
```

누적 시작점:

```text
1학년 시작: 0
2학년 시작: 1500
3학년 시작: 3500
4학년 시작: 6000
졸업 기준: 9000
```

4학년 XP를 모두 채우면 일반 진화 컷신 대신 졸업 화면을 표시합니다. 졸업 화면은 `components/EvolutionOverlay/EvolutionOverlay.tsx`의 `GraduationOverlay`가 담당하고, 배경은 `assets/images/graduate-background.png`, 캐릭터는 `assets/characters/graduated-boo.png`, BGM은 `assets/musics/bgm/graduation.mp3`를 사용합니다.

졸업 화면의 플레이 일수는 가입일 기준으로 계산합니다. 학식 횟수, 퀴즈 정답 수, 미니게임 최고 점수는 현재 로컬 통계로 표시하므로, 로그인 유저가 다른 기기에서 같은 졸업 리포트를 보려면 백엔드가 누적 통계 요약을 내려주는 계약이 추가되어야 합니다.

### 9.3 XP 계산 함수

실제 코드:

```ts
export const getXpProgressInfo = (totalXp: number): XpProgressInfo => {
  const safeTotalXp = Math.max(Math.floor(totalXp), 0);

  if (safeTotalXp >= TOTAL_XP_FOR_GRADUATION) {
    return {
      totalXp: safeTotalXp,
      grade: 4,
      currentXpInGrade: GRADE_XP_REQUIREMENTS[4],
      progressMaxXp: GRADE_XP_REQUIREMENTS[4],
      hasReachedGraduation: true,
      lifeStage: "graduate",
      nextLifeStage: null,
    };
  }

  // 이후 4학년, 3학년, 2학년, 1학년 순서로 판정
};
```

### 9.4 진화 pending 상태

XP가 임계치를 넘었다고 해서 바로 컷신을 시작하면 문제가 생깁니다.

예:

- 퀴즈 정답 결과 화면을 먼저 보여줘야 합니다.
- 밥 먹이는 eating 모션 2초가 먼저 보여야 합니다.
- 열려 있는 패널을 닫고 메인 화면에서 컷신을 보여줘야 합니다.

그래서 `pendingEvolution`을 둡니다.

```ts
export type PendingEvolution = {
  fromGrade: CharacterGrade;
  id: number;
  readyAt: number | null;
  resumeState: CharacterState;
  toGrade: CharacterGrade;
  trigger: EvolutionTrigger;
};
```

### 9.5 진화 흐름

```text
XP 증가
-> getXpProgressInfo로 이전 학년과 다음 학년 비교
-> 학년이 올랐으면 pendingEvolution 생성
-> trigger에 따라 대기
   - quiz: 결과 확인 후
   - meal: eating 2초 후
   - xp: 즉시
-> 모든 패널 닫기
-> EvolutionOverlay 표시
-> BGM pause
-> 진화 SFX
-> smoke 효과
-> 축하 메시지
-> BGM resume
```

### 9.6 자주 헷갈리는 점

- `totalXp`는 원본 상태입니다.
- 현재 학년은 파생 상태입니다.
- `pendingEvolution`은 저장하면 안 되는 임시 상태입니다.
- 진화 컷신은 XP 계산이 아니라 화면 연출입니다.

---

## 10장. 학식 기능과 시간 기반 로직

### 10.1 학식 기능의 구성

학식 기능은 단순히 음식 버튼을 누르는 기능이 아닙니다. 다음 조건이 함께 작동합니다.

- 조식, 중식, 석식 시간
- 한 끼에 한 번만 먹일 수 있음
- 다음 식사까지 카운트다운
- 주말 메뉴 분기
- 먹이면 코인 감소, XP 증가
- 끼니를 많이 거르면 hungry 상태와 XP 감소

### 10.2 시간대 타입

```ts
export type MealSectionId = "breakfast" | "lunch" | "dinner";
```

식사 기록은 식사 구간별로 저장합니다.

```ts
export type MealHistory = Partial<Record<MealSectionId, string>>;
```

`Partial`은 모든 끼니가 항상 기록되어 있지는 않다는 뜻입니다.

### 10.3 학식 시간

```ts
export const MEAL_SECTIONS: MealSection[] = [
  {
    id: "breakfast",
    startMinutes: 8 * 60,
    endMinutes: 10 * 60,
    title: "조식",
  },
  {
    id: "lunch",
    startMinutes: 11 * 60,
    endMinutes: 14 * 60 + 30,
    title: "중식",
  },
  {
    id: "dinner",
    startMinutes: 16 * 60 + 40,
    endMinutes: 18 * 60 + 40,
    title: "석식",
  },
];
```

시간을 `시:분` 문자열로 비교하지 않고 분 단위 숫자로 바꾸면 계산이 쉬워집니다.

### 10.4 먹이기 흐름

```text
학식 버튼 클릭
-> 현재 시간이 식사 가능 시간인지 확인
-> 이미 먹였는지 확인
-> 코인이 충분한지 확인
-> feedBoo 실행
-> 코인 감소
-> XP +50
-> characterState = eating
-> 2초 후 기본 상태로 복귀
```

실제 store의 핵심:

```ts
feedBoo: (mealCost, mealSectionId) => {
  if (coin < mealCost) {
    return false;
  }

  const nextTotalXp = state.totalXp + FEED_XP_REWARD;
  // coin, totalXp, lastFedMeals, characterState 갱신
}
```

### 10.5 끼니를 거르면 왜 상태가 바뀌는가

이 프로젝트는 6끼니부터 hungry 상태를 유지하고, 9끼니 이후부터 한 끼마다 XP를 감소시키는 구조를 실험했습니다.

핵심 개념:

- 현재 완료된 식사 슬롯 번호를 계산합니다.
- 마지막으로 먹인 슬롯 번호와 비교합니다.
- 차이가 커지면 skipped meal count가 증가합니다.
- 일정 기준 이후 XP penalty가 적용됩니다.

### 10.6 자주 헷갈리는 점

- 학식 패널이 열리는 것과 실제 먹이기는 다릅니다.
- 먹이기는 시간 제한, 기록, 코인 조건을 모두 통과해야 합니다.
- 카운트다운은 현재 시간과 다음 식사 시간을 계속 비교해서 표시합니다.

---

## 11장. 퀴즈 기능과 쿨타임

### 11.1 퀴즈 타입

퀴즈는 O/X와 객관식이 있습니다. 두 형식은 구조가 다르므로 union type으로 구분합니다.

```ts
export type MultipleChoiceQuizQuestion = QuizQuestionBase & {
  options: string[];
  type: "multiple-choice";
};

export type OxQuizQuestion = QuizQuestionBase & {
  answer: "O" | "X";
  type: "ox";
};

export type QuizQuestion = MultipleChoiceQuizQuestion | OxQuizQuestion;
```

`type` 값을 보면 어떤 UI를 렌더링해야 하는지 알 수 있습니다.

### 11.2 퀴즈 정책

```ts
export const QUIZ_DAILY_LIMIT = 3;
export const QUIZ_COOLDOWN_MS = 1000 * 60 * 60 * 3;
export const QUIZ_CORRECT_XP_REWARD = 30;
export const QUIZ_WRONG_XP_PENALTY = 10;
```

정책:

- 하루 최대 3문제
- 문제를 하나 풀면 3시간 쿨타임
- 다음날이 되면 다시 풀 수 있음
- 정답이면 XP 증가
- 오답이면 XP 감소

### 11.3 퀴즈 풀이 흐름

```text
퀴즈 버튼 클릭
-> 오늘 제한/쿨타임 확인
-> 가능한 문제 선택
-> 사용자가 답 선택
-> 정답 확인
-> submitQuizAttempt
-> 정답이면 +30 XP, 오답이면 -10 XP
-> TopAlert, SFX, BooChat 표시
-> XP 임계치 넘으면 진화 대기
```

### 11.4 기록 저장

퀴즈 기록은 `quizAttemptHistory`에 저장됩니다. 어떤 문제를 언제 풀었는지 알아야 쿨타임과 중복 출제를 제어할 수 있습니다.

### 11.5 자주 헷갈리는 점

- 하루 제한과 3시간 쿨타임은 별개입니다.
- 개발자 모드에서 제한을 끄면 테스트를 쉽게 할 수 있습니다.
- 정답 결과 화면은 사용자 피드백을 위해 먼저 보여주고, 진화는 그 다음에 시작합니다.

---

## 12장. 서버 통신과 TanStack Query

### 12.1 API란 무엇인가

API는 앱과 서버가 데이터를 주고받는 약속입니다. 앱은 서버에 요청을 보내고, 서버는 응답을 돌려줍니다.

```text
앱
-> 오늘 학식 메뉴 주세요
-> 서버
-> 조식/중식/석식 메뉴 응답
-> 앱
```

### 12.2 axios

axios는 HTTP 요청을 보내는 라이브러리입니다.

```ts
const response = await axios.get(TODAY_MEAL_API_URL);
```

### 12.3 TanStack Query

TanStack Query는 서버 데이터를 가져오고 캐싱하는 라이브러리입니다.

직접 `useState`와 `useEffect`로 로딩, 에러, 재요청을 모두 처리할 수도 있지만, 서버 데이터가 많아지면 복잡해집니다.

실제 코드:

```ts
export const useTodayMeal = (): UseTodayMealResult => {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: TODAY_MEAL_QUERY_KEY,
    queryFn: getTodayMeal,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });

  return {
    error: error ? "오늘 학식 메뉴를 불러오지 못했어요." : null,
    isLoading,
    refetch: async () => {
      await refetch();
    },
    todayMealSections: data ?? [],
  };
};
```

### 12.4 query key

`queryKey`는 캐시의 이름입니다.

```ts
const TODAY_MEAL_QUERY_KEY = ["todayMeal"] as const;
```

같은 key를 가진 요청은 같은 캐시를 공유합니다.

### 12.5 staleTime과 gcTime

```text
staleTime
= 데이터를 신선하다고 보는 시간

gcTime
= 사용하지 않는 캐시를 얼마나 보관할지
```

### 12.6 데이터 정규화

서버 응답은 앱이 원하는 모양과 다를 수 있습니다. 그래서 `getTodayMeal`에서 앱에 맞는 구조로 바꿉니다.

```ts
const normalizedSections = rawMealSections
  .map(normalizeMealSection)
  .filter((section): section is TodayMealSection => !!section);
```

이 과정을 정규화라고 볼 수 있습니다.

### 12.7 Zustand와 Query의 역할 분리

```text
TanStack Query
= 서버 데이터 요청, 캐싱, 로딩/에러 상태

Zustand
= 게임 상태, UI 상태, 로컬 설정
```

나중에 서버가 붙으면 유저 XP, 친구 목록, 장착 아이템 같은 데이터는 Query로 받아오고, 화면에서 즉시 필요한 임시 상태는 Zustand가 담당하는 구조가 좋습니다.

---

## 13장. 이미지 에셋, preload, 로딩 화면

### 13.1 왜 이미지 preload가 필요한가

게임 화면에서는 배경, 캐릭터, 버튼, 말풍선이 동시에 필요합니다. 이미지가 늦게 뜨면 캐릭터 없이 말풍선만 보이거나 흰 화면이 보일 수 있습니다.

그래서 중요한 이미지를 미리 불러옵니다.

### 13.2 네이티브 Splash와 커스텀 Loading

```text
네이티브 Splash
= 앱이 JS 화면을 띄우기 전 OS 레벨에서 보이는 화면

커스텀 Loading
= React Native 화면 안에서 직접 만든 로딩 UI
```

이 프로젝트에서는 네이티브 Splash는 로그인에 필요한 최소 에셋을 준비할 때 사용하고, 게임 화면 진입 후에는 커스텀 Loading을 사용합니다.

### 13.3 필수 이미지 preload

`_layout.tsx`:

```ts
const REQUIRED_IMAGE_ASSETS = [
  require("../assets/images/main-building.png"),
  require("../assets/images/main-title.png"),
  require("../assets/images/inGameMain.png"),
  require("../assets/images/egg-closed.png"),
  require("../assets/images/egg-opened.png"),
];
```

### 13.4 게임 이미지 preload

`game/index.tsx`:

```ts
const GAME_IMAGE_ASSETS = [
  require("../../assets/images/big-smoke.png"),
  ...Object.values(CHARACTER_IMAGES.grades).flatMap((gradeImages) =>
    Object.values(gradeImages),
  ),
  CHARACTER_IMAGES.graduate,
  ...PLATE_IMAGE_ASSETS,
  ...ROOM_IMAGE_ASSETS,
  ...TUTORIAL_IMAGE_ASSETS,
];
```

캐릭터, 음식, 마이룸, 튜토리얼 이미지를 게임 진입 시점에 준비합니다.

### 13.5 로딩 종료 조건

게임 로딩은 단순히 2초가 지났다고 끝나지 않습니다.

```text
최소 로딩 시간 경과
AND 게임 에셋 preload 완료
AND 배경 이미지 표시 준비
AND 캐릭터 이미지 표시 준비
```

이렇게 해야 느린 기기에서도 화면이 덜 깨집니다.

### 13.6 자주 헷갈리는 점

- `require`는 이미지를 앱 번들에 포함시키는 정적 참조입니다.
- `ExpoImage.loadAsync`는 이미지를 미리 캐시에 올리는 작업입니다.
- preload를 했다고 모든 렌더링 문제가 자동으로 사라지는 것은 아닙니다. 실제 Image가 display되었는지도 확인해야 합니다.

---

## 14장. 사운드 시스템

### 14.1 BGM과 SFX의 차이

```text
BGM
= 배경음악, 길게 반복 재생

SFX
= 버튼 클릭, 퀴즈 정답, 먹이기 같은 짧은 효과음
```

두 종류는 재생 방식이 다르므로 파일도 로직도 분리했습니다.

### 14.2 BGM 관리

`backgroundMusic.ts`:

```ts
const BACKGROUND_MUSIC_SOURCES = {
  main: require("@/assets/musics/bgm/main-ui.mp3"),
  myRoom: require("@/assets/musics/bgm/my-room.mp3"),
  titleLogin: require("@/assets/musics/bgm/title-login.mp3"),
} as const;
```

화면별로 다른 음악을 재생할 수 있습니다.

### 14.3 SFX 관리

`soundEffects.ts`:

```ts
const SOUND_EFFECT_SOURCES = {
  basicClick: require("@/assets/musics/sfx/basic-click.mp3"),
  booTouch: require("@/assets/musics/sfx/boo-touch.mp3"),
  eating: require("@/assets/musics/sfx/eating.mp3"),
  quizO: require("@/assets/musics/sfx/quiz-o.mp3"),
  quizX: require("@/assets/musics/sfx/quiz-x.mp3"),
} as const;
```

### 14.4 preload로 첫 재생 지연 줄이기

효과음은 처음 재생할 때 플레이어를 생성하면 약간 늦을 수 있습니다. 그래서 앱 시작 시 미리 플레이어를 만들어둡니다.

```ts
export const preloadSoundEffects = () => {
  (Object.keys(SOUND_EFFECT_SOURCES) as SoundEffectName[]).forEach(
    (soundEffectName) => {
      getSoundEffectPlayer(soundEffectName);
    },
  );
};
```

### 14.5 사운드 중첩 방지

화면을 이동할 때 이전 BGM이 계속 재생되면 음악이 겹칩니다. 그래서 현재 활성 track 외의 음악은 pause합니다.

```ts
const pauseOtherBackgroundMusicTracks = (activeTrack: BackgroundMusicTrack) => {
  getAllBackgroundMusicTracks().forEach((track) => {
    if (track !== activeTrack) {
      pauseBackgroundMusicTrack(track);
    }
  });
};
```

### 14.6 진화 중 사운드

진화 컷신에서는 일반 BGM을 잠시 멈추고, 진화 효과음과 축하 효과음을 재생한 뒤 BGM을 다시 이어서 재생합니다.

```text
BGM pause
-> evolution.mp3
-> congratulation.mp3
-> BGM resume
```

---

## 15장. 알림, 말풍선, 튜토리얼

### 15.1 피드백 UI의 종류

이 프로젝트에는 사용자에게 상태를 알려주는 UI가 여러 종류 있습니다.

| UI | 역할 |
| --- | --- |
| `TopAlert` | 성공, 실패, 제한 상황 알림 |
| `BooChat` | 캐릭터 감정과 대사 |
| `TutorialPanel` | 최초 사용자 온보딩 |
| `LoadingOverlay` | 로딩 중 시각 피드백 |

### 15.2 TopAlert

TopAlert는 위에서 내려오는 알림입니다. 예를 들어 코인이 부족하거나 아직 개발되지 않은 기능을 누르면 보여줍니다.

```tsx
showTopAlert("준비 중", "아직 개발되지 않은 기능이에요.", {
  autoHideDuration: 1800,
  textSize: "compact",
});
```

서버 저장, 수정, 삭제처럼 사용자가 기다려야 하는 비동기 작업은 버튼 글씨만 바꾸지 않고 TopAlert로 진행 상태를 같이 보여줍니다.

```tsx
showTopAlert("닉네임 변경 중", "서버에 계정 정보를 저장하고 있어요.", {
  autoHideDuration: 0,
  textSize: "compact",
});
```

작업이 끝나면 성공/실패 알림으로 같은 위치를 갱신합니다. 패널 컴포넌트가 직접 TopAlert를 렌더링하지 않는 경우에는 화면 route에서 `showTopAlert` callback을 props로 내려받아 사용합니다.

### 15.3 BooChat

BooChat은 캐릭터의 감정 표현입니다.

```tsx
const showBooChat = useCallback((message: string) => {
  setBooChatMessage(message);
  setIsBooChatVisible(true);
}, []);
```

대사는 `BooChatList.ts`에서 관리합니다.

```ts
export const getRandomTapBooChat = (
  stateOrCategory: CharacterState | BooChatCategory,
) => getRandomBooChatByMode(stateOrCategory, "tap");
```

### 15.4 튜토리얼

튜토리얼은 최초 1회만 보여야 하므로 store에 완료 여부를 저장합니다.

```ts
hasSeenGameTutorial: boolean;
```

사용자가 “아니요”를 누르거나 마지막 튜토리얼을 끝내면 true로 저장합니다. 개발자 패널에서 이 값을 초기화하면 다시 볼 수 있습니다.

### 15.5 UX 철학

```text
게임 규칙/실패/제한
-> TopAlert

캐릭터 감정/상황 대사
-> BooChat

처음 쓰는 사람 안내
-> TutorialPanel
```

---

## 16장. 마이룸과 교체형 에셋 구조

### 16.1 마이룸의 핵심 구조

마이룸은 단순한 이미지 화면이 아니라, 나중에 상점에서 가구를 바꿀 수 있도록 설계되어 있습니다.

핵심 개념:

```text
slot
= 가구가 들어가는 자리

itemId
= 어떤 가구 아이템인지 나타내는 ID

registry
= itemId와 실제 이미지/정보를 연결하는 목록
```

### 16.2 slot과 itemId

```ts
export type RoomSlotId = "bed" | "closet" | "table";
export type RoomItemId = "bed-basic" | "closet-basic" | "table-basic";
```

`bed`는 자리이고, `bed-basic`은 그 자리에 들어가는 아이템입니다.

### 16.3 registry

```ts
export const ROOM_ITEM_ASSETS: Record<RoomItemId, RoomItemAsset> = {
  "bed-basic": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-basic.png"),
    slotId: "bed",
  },
};
```

나중에 침대 색상을 추가하고 싶으면 `bed-red`, `bed-blue` 같은 itemId를 추가하면 됩니다.

### 16.4 장착 상태

```ts
export const DEFAULT_EQUIPPED_ROOM_ITEMS: EquippedRoomItems = {
  bed: "bed-basic",
  closet: "closet-basic",
  table: "table-basic",
};
```

서버가 붙으면 서버는 이 itemId만 저장하면 됩니다. 이미지는 프론트가 매핑합니다.

### 16.5 좌표 기반 배치

가구는 방 이미지 기준 좌표로 배치됩니다.

```ts
export const ROOM_CANVAS_WIDTH = 1276;
export const ROOM_CANVAS_HEIGHT = 1444;
```

전체 화면 기준이 아니라 방 이미지의 원본 크기 기준으로 좌표를 잡으면, 화면 크기가 달라도 비율을 유지하기 쉽습니다.

---

## 17장. 개발자 패널과 테스트 편의성

### 17.1 왜 개발자 패널이 필요한가

게임 기능은 시간이 걸리는 조건이 많습니다.

예:

- 학식은 특정 시간에만 먹일 수 있습니다.
- 퀴즈는 하루 3문제, 문제당 3시간 쿨타임이 있습니다.
- 진화는 XP 임계치에 도달해야 발생합니다.
- 튜토리얼은 최초 1회만 뜹니다.

이 조건을 실제로 기다리면서 테스트하면 너무 비효율적입니다.

### 17.2 개발자 패널에서 조작하는 것

- 코인 증가/감소
- XP 증가/감소
- 학년 강제 변경
- 부 상태 변경
- 식사 기록 초기화
- 퀴즈 기록 초기화
- 문제 수 제한 on/off
- 학식 주말/평일 모드 변경
- 튜토리얼 조회 초기화

서버에 로그인된 상태에서 실제 API 요청까지 보내는 항목은 제한적입니다.

- 부 이름 변경: `/characters/me`에 `character_name`을 저장합니다.
- 부 상태 변경: `/characters/me`에 `state`를 저장합니다.
- 튜토리얼 조회 초기화: `/user/me/preferences`에 메인/미니게임 튜토리얼 조회 여부를 저장합니다.
- 졸업 화면 미리보기는 서버 상태를 바꾸지 않는 로컬 preview입니다.

코인 증가/감소, XP 증가/감소, 학년 강제 변경, 식사/퀴즈 제한 토글, 유저 이름/학번 디버그 값 변경은 현재 로컬 테스트 상태만 바꿉니다. 백엔드에는 코인 직접 수정, XP 절대값 설정/감소, 학년 강제 설정을 위한 개발자 전용 API가 없으므로 일반 사용자 API로 우회하지 않습니다.

### 17.3 이 기능의 의미

개발자 패널은 단순 편의 기능이 아니라, 복잡한 상태를 빠르게 재현하기 위한 테스트 도구입니다. 발표 시연과 베타 테스트에서도 안정성을 높입니다.

---

## 18장. 버그와 해결 과정

### 18.1 Expo dev-client와 QR scheme

증상:

```text
QR을 찍어도 원하는 개발 앱으로 열리지 않음
```

원인:

- dev-client는 Expo Go와 다릅니다.
- 앱 scheme이 맞아야 설치된 개발 앱이 열립니다.

해결:

```bash
npx expo start --dev-client --host tunnel --scheme exp+boo-app --clear
```

배운 점:

- Expo Go용 개발과 Development Build용 개발은 다릅니다.
- scheme, bundle id, package name은 앱의 신분증입니다.

### 18.2 tunnel/ngrok 실패

증상:

```text
CommandError: failed to start tunnel
remote gone away
```

원인:

- tunnel은 ngrok 상태나 네트워크에 영향을 받습니다.

해결:

- tunnel이 안 될 때는 LAN 모드나 USB 연결을 고려합니다.
- 개발 스크립트를 `dev:device`, `dev:device:lan`처럼 분리합니다.

### 18.3 QueryClientProvider 누락

증상:

```text
No QueryClient set, use QueryClientProvider to set one
```

원인:

- `useQuery`를 쓰는 컴포넌트 위에 `QueryClientProvider`가 없었습니다.

해결:

```tsx
<QueryClientProvider client={queryClient}>
  <SafeAreaProvider>
    <Stack />
  </SafeAreaProvider>
</QueryClientProvider>
```

### 18.4 AsyncStorage native module 미설치

증상:

```text
AsyncStorage native module is unavailable.
```

원인:

- 네이티브 모듈을 추가했지만 앱을 재빌드하지 않았습니다.

해결:

- 앱 재빌드
- 그 전까지는 fallback storage로 앱이 죽지 않게 처리

### 18.5 Android 하단 UI 잘림

증상:

- 삼성/Android 기기에서 하단 내비게이션 바가 앱 UI를 가림

해결:

- Safe Area 적용
- Android navigation bar 숨김 처리
- 네이티브 모듈이 필요하므로 재빌드 필요

### 18.6 이미지 로딩 지연

증상:

- 배경은 아직 안 떴는데 말풍선만 보임
- 캐릭터 이미지가 늦게 표시됨

해결:

- 네이티브 Splash에서 최소 에셋 preload
- 게임 화면에서 커스텀 LoadingOverlay 표시
- 캐릭터와 배경 이미지 display 준비 확인

### 18.7 사운드 중첩과 지연

증상:

- 로그인 화면에서 게임 화면으로 이동할 때 음악이 겹침
- 효과음 첫 재생이 늦음

해결:

- 화면별 BGM session 관리
- 다른 track pause
- 앱 시작 시 SFX player preload

### 18.8 말풍선 고착 현상

증상:

- 말풍선이 사라지지 않고 계속 유지되는 것처럼 보임

원인:

- 진입 직후 말풍선 effect가 state 변화에 의해 반복 스케줄될 수 있었습니다.

해결:

- 포커스당 1회만 실행되도록 구조를 변경
- 최신 상태는 ref로 확인

### 18.9 진화 중 캐릭터 중첩

증상:

- 진화 컷신 뒤에 기존 캐릭터가 비쳐 보임

해결:

- 진화 중에는 오버레이가 캐릭터 영역을 소유하게 함
- smoke 타이밍과 다음 학년 이미지 등장 타이밍을 조정

---

## 19장. 앞으로 서버를 붙일 때의 구조

### 19.1 서버 상태와 클라이언트 상태

서버 상태는 서버가 원본인 데이터입니다.

예:

- 유저 프로필
- XP
- 코인
- 친구 목록
- 장착 가구

클라이언트 상태는 화면에서 즉시 필요한 임시 상태입니다.

예:

- 옵션 창이 열렸는지
- 말풍선이 보이는지
- 현재 튜토리얼 이미지 index
- 진화 컷신 phase

### 19.2 서버 연동 후 역할 분리

```text
서버
-> 원본 데이터 저장

TanStack Query
-> 서버 데이터 요청, 캐싱, 리페칭

Zustand
-> 로컬 게임 상태, UI 상태, 즉각적인 상호작용

AsyncStorage
-> 로컬 설정, 임시 캐시, 앱 재실행 후 유지할 보조 정보
```

### 19.3 예상 API

```text
GET /me
-> 유저 이름, 부 이름, 학번

GET /game-state
-> totalXp, coin, character settings

GET /friends
-> 친구 목록

POST /friends
-> 친구 추가

PATCH /room/equipped-items
-> 장착 가구 변경

PATCH /tutorial
-> 튜토리얼 완료 여부 저장
```

### 19.4 왜 현재 구조가 서버 연동에 유리한가

- XP는 `totalXp` 하나만 서버에 저장하면 됩니다.
- 가구는 `itemId`만 저장하면 됩니다.
- 이미지는 프론트 assets에서 관리하므로 서버가 이미지 파일을 내려줄 필요가 없습니다.
- 학년과 프로그레스바는 프론트 계산 함수로 처리할 수 있습니다.

---

## 20장. 용어집과 흐름 요약

### 20.1 용어집

| 용어 | 의미 |
| --- | --- |
| Framework | 앱의 구조와 실행 방식을 제공하는 큰 틀 |
| Library | 특정 기능을 도와주는 코드 묶음 |
| React Native | React 방식으로 모바일 앱을 만드는 프레임워크 |
| Expo | React Native 개발, 빌드, 네이티브 기능 사용을 쉽게 해주는 플랫폼 |
| Component | UI를 구성하는 재사용 가능한 조각 |
| Props | 부모가 자식 컴포넌트에 넘기는 값 |
| State | 시간이 지나며 바뀌는 값 |
| Hook | React 기능을 함수 컴포넌트에서 쓰게 해주는 함수 |
| Store | 전역 상태를 보관하는 공간 |
| Persist | 상태를 저장소에 자동 저장/복원하는 기능 |
| AsyncStorage | React Native 앱의 로컬 key-value 저장소 |
| Query | 서버 데이터를 요청하고 캐싱하는 작업 |
| Cache | 다시 쓰기 위해 임시로 저장해둔 데이터 |
| Preload | 필요해지기 전에 미리 불러오는 작업 |
| Derived State | 직접 저장하지 않고 다른 값에서 계산하는 상태 |
| API | 앱과 서버가 데이터를 주고받는 약속 |
| Native Module | iOS/Android 네이티브 기능과 연결되는 모듈 |

### 20.2 전체 흐름 요약

```text
앱 실행
-> _layout.tsx
-> 폰트/이미지/SFX/BGM 준비
-> QueryClientProvider, SafeAreaProvider 설정
-> 로그인 화면
-> 게임 화면
-> 게임 이미지 preload + LoadingOverlay
-> 메인 UI 표시
-> 사용자가 학식/퀴즈/터치/마이룸 상호작용
-> Zustand 상태 변경
-> 필요하면 persist로 저장
-> 서버 데이터는 TanStack Query로 fetch
-> XP 변화 시 getXpProgressInfo로 학년 계산
-> 임계치 도달 시 pendingEvolution 생성
-> EvolutionOverlay 컷신
```

### 20.3 이 문서를 읽고 설명할 수 있어야 하는 것

- React Native와 Expo의 차이
- Expo Router가 화면을 찾는 방식
- local state와 global state의 차이
- Zustand, persist, AsyncStorage의 역할
- TanStack Query가 필요한 이유
- 왜 XP를 `totalXp` 하나로 저장하는지
- 왜 이미지와 사운드를 preload하는지
- 서버가 붙으면 어떤 데이터가 서버로 이동하는지
- 어떤 데이터는 프론트에서 계속 계산해야 하는지

---

## 마지막 정리

`부 키우기`는 단순한 화면 모음이 아니라, 상태와 시간, 에셋, 사운드, 서버 데이터가 서로 연결되는 작은 게임 앱입니다.

이 프로젝트를 이해하는 핵심은 다음입니다.

```text
1. 화면은 Expo Router가 관리한다.
2. 반복 UI는 컴포넌트로 나눈다.
3. 게임 상태는 Zustand가 관리한다.
4. 유지할 상태는 persist와 AsyncStorage로 저장한다.
5. 서버 데이터는 TanStack Query로 가져온다.
6. XP와 학년은 totalXp에서 계산한다.
7. 이미지와 사운드는 사용자 경험을 위해 미리 준비한다.
8. 복잡한 조건은 개발자 패널로 빠르게 테스트한다.
9. 서버 연동 후에도 프론트는 계산과 표현을 계속 담당한다.
```

이 구조를 이해하면, 앞으로 상점, 업적, 친구 API, 서버 로그인, 외형 커스텀을 추가할 때도 어디에 어떤 코드를 넣어야 하는지 판단할 수 있습니다.
