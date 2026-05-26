import {
  EquippedRoomItems,
  RoomWallpaperId,
} from "@/components/Room/RoomData";
import type { MiniGameId } from "@/components/MiniGame/MiniGameData";
import { CharacterState } from "@/constants/character";

export interface FriendRoomSnapshot {
  booName: string;
  characterState: CharacterState;
  equippedRoomItems: EquippedRoomItems;
  equippedRoomWallpaper: RoomWallpaperId;
  totalXp: number;
}

export type FriendMiniGameScores = Record<MiniGameId, number>;
export type FriendMiniGameDifficulty = "normal" | "hard" | "infinite";

export interface FriendListItem {
  id: string;
  miniGameScores?: Partial<FriendMiniGameScores>;
  miniGameHardScores?: Partial<FriendMiniGameScores>;
  name: string;
  roomSnapshot?: FriendRoomSnapshot;
  studentId: string;
}

const BASIC_ROOM_ITEMS: EquippedRoomItems = {
  bed: "bed-basic",
  closet: "closet-basic",
  table: "table-basic",
};

const createFriendRoomSnapshot = ({
  booName,
  characterState,
  equippedRoomItems,
  equippedRoomWallpaper = "wallpaper-basic",
  totalXp,
}: {
  booName: string;
  characterState: CharacterState;
  equippedRoomItems?: Partial<EquippedRoomItems>;
  equippedRoomWallpaper?: RoomWallpaperId;
  totalXp: number;
}): FriendRoomSnapshot => ({
  booName,
  characterState,
  equippedRoomItems: { ...BASIC_ROOM_ITEMS, ...equippedRoomItems },
  equippedRoomWallpaper,
  totalXp,
});

export const getFriendRoomSnapshot = (
  friend: FriendListItem,
): FriendRoomSnapshot =>
  FRIEND_DIRECTORY_DUMMY_DATA.find((item) => item.id === friend.id)
    ?.roomSnapshot ??
  friend.roomSnapshot ??
  createFriendRoomSnapshot({
    booName: `${friend.name}의 부`,
    characterState: "basic1",
    totalXp: 0,
  });

export const FRIEND_LIST_DUMMY_DATA: FriendListItem[] = [
  {
    id: "friend-1",
    name: "이세계킹왕짱",
    studentId: "202100010",
    miniGameScores: { catchTheMajor: 1500, catchBoo: 1720, freeThrow: 980 },
    miniGameHardScores: { catchTheMajor: 460, catchBoo: 560, freeThrow: 410 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "왕짱부",
      characterState: "happy1",
      equippedRoomItems: {
        bed: "bed-maple-blue",
        closet: "closet-maple",
        table: "table-maple-blue",
      },
      equippedRoomWallpaper: "wallpaper-blue",
      totalXp: 1820,
    }),
  },
  {
    id: "friend-2",
    name: "친구임",
    studentId: "202100020",
    miniGameScores: { catchTheMajor: 1280, catchBoo: 940, freeThrow: 1370 },
    miniGameHardScores: { catchTheMajor: 390, catchBoo: 330, freeThrow: 520 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "친구부",
      characterState: "basic1",
      equippedRoomItems: {
        bed: "bed-merbau-yellow",
        closet: "closet-merbau",
        table: "table-merbau-yellow",
      },
      equippedRoomWallpaper: "wallpaper-yellow",
      totalXp: 640,
    }),
  },
  {
    id: "friend-3",
    name: "ㅎㅎ",
    studentId: "202100030",
    miniGameScores: { catchTheMajor: 920, catchBoo: 1180, freeThrow: 760 },
    miniGameHardScores: { catchTheMajor: 280, catchBoo: 450, freeThrow: 310 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "웃는부",
      characterState: "happy2",
      equippedRoomItems: {
        bed: "bed-white-oak-pink",
        closet: "closet-white-oak",
        table: "table-white-oak-pink",
      },
      equippedRoomWallpaper: "wallpaper-pink",
      totalXp: 3200,
    }),
  },
  {
    id: "friend-4",
    name: "취준기조아",
    studentId: "202100040",
    miniGameScores: { catchTheMajor: 760, catchBoo: 640, freeThrow: 1510 },
    miniGameHardScores: { catchTheMajor: 220, catchBoo: 250, freeThrow: 610 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "취준부",
      characterState: "hungry",
      equippedRoomItems: {
        bed: "bed-walnut-teal",
        closet: "closet-walnut",
        table: "table-walnut-teal",
      },
      equippedRoomWallpaper: "wallpaper-gray",
      totalXp: 4200,
    }),
  },
  {
    id: "friend-5",
    name: "외대킹",
    studentId: "202100050",
    miniGameScores: { catchTheMajor: 640, catchBoo: 820, freeThrow: 540 },
    miniGameHardScores: { catchTheMajor: 180, catchBoo: 300, freeThrow: 210 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "킹부",
      characterState: "talking",
      equippedRoomItems: {
        bed: "bed-oak-red",
        closet: "closet-oak",
        table: "table-oak-red",
      },
      equippedRoomWallpaper: "wallpaper-red",
      totalXp: 5200,
    }),
  },
  {
    id: "friend-6",
    name: "밤샘장인",
    studentId: "202100060",
    miniGameScores: { catchTheMajor: 430, catchBoo: 1010, freeThrow: 690 },
    miniGameHardScores: { catchTheMajor: 120, catchBoo: 370, freeThrow: 260 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "밤샘부",
      characterState: "basic2",
      equippedRoomItems: {
        bed: "bed-maple-green",
        closet: "closet-maple",
        table: "table-maple-green",
      },
      equippedRoomWallpaper: "wallpaper-green",
      totalXp: 250,
    }),
  },
  {
    id: "friend-7",
    name: "커피수혈중",
    studentId: "202100070",
    miniGameScores: { catchTheMajor: 1380, catchBoo: 1550, freeThrow: 1240 },
    miniGameHardScores: { catchTheMajor: 430, catchBoo: 520, freeThrow: 470 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "카페인부",
      characterState: "happy1",
      equippedRoomItems: {
        bed: "bed-walnut-blue",
        closet: "closet-walnut",
        table: "table-walnut-blue",
      },
      equippedRoomWallpaper: "wallpaper-teak",
      totalXp: 6900,
    }),
  },
  {
    id: "friend-8",
    name: "월요병퇴치반",
    studentId: "202100080",
    miniGameScores: { catchTheMajor: 1110, catchBoo: 730, freeThrow: 1660 },
    miniGameHardScores: { catchTheMajor: 340, catchBoo: 290, freeThrow: 650 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "월요부",
      characterState: "basic1",
      equippedRoomItems: {
        bed: "bed-merbau-purple",
        closet: "closet-merbau",
        table: "table-merbau-purple",
      },
      equippedRoomWallpaper: "wallpaper-purple",
      totalXp: 1510,
    }),
  },
  {
    id: "friend-9",
    name: "학식헌터",
    studentId: "202100090",
    miniGameScores: { catchTheMajor: 850, catchBoo: 1320, freeThrow: 880 },
    miniGameHardScores: { catchTheMajor: 260, catchBoo: 490, freeThrow: 330 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "헌터부",
      characterState: "eating",
      equippedRoomItems: {
        bed: "bed-oak-yellow",
        closet: "closet-oak",
        table: "table-oak-yellow",
      },
      equippedRoomWallpaper: "wallpaper-meolbow",
      totalXp: 3770,
    }),
  },
  {
    id: "friend-10",
    name: "벼락치기고수",
    studentId: "202100100",
    miniGameScores: { catchTheMajor: 570, catchBoo: 470, freeThrow: 1120 },
    miniGameHardScores: { catchTheMajor: 160, catchBoo: 170, freeThrow: 420 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "벼락부",
      characterState: "talking",
      equippedRoomItems: {
        bed: "bed-white-oak-teal",
        closet: "closet-white-oak",
        table: "table-white-oak-teal",
      },
      equippedRoomWallpaper: "wallpaper-whiteoak",
      totalXp: 6100,
    }),
  },
];

export const FRIEND_DIRECTORY_DUMMY_DATA: FriendListItem[] = [
  ...FRIEND_LIST_DUMMY_DATA,
  {
    id: "friend-11",
    name: "외대폭파",
    studentId: "202033000",
    miniGameScores: { catchTheMajor: 990, catchBoo: 1090, freeThrow: 720 },
    miniGameHardScores: { catchTheMajor: 310, catchBoo: 400, freeThrow: 280 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "폭파부",
      characterState: "basic2",
      equippedRoomItems: {
        bed: "bed-maple-red",
        closet: "closet-maple",
        table: "table-maple-red",
      },
      equippedRoomWallpaper: "wallpaper-yellow",
      totalXp: 940,
    }),
  },
  {
    id: "friend-12",
    name: "도서관정주행",
    studentId: "202144440",
    miniGameScores: { catchTheMajor: 1460, catchBoo: 890, freeThrow: 1420 },
    miniGameHardScores: { catchTheMajor: 480, catchBoo: 320, freeThrow: 550 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "도서부",
      characterState: "talking",
      equippedRoomItems: {
        bed: "bed-white-oak-blue",
        closet: "closet-white-oak",
        table: "table-white-oak-blue",
      },
      equippedRoomWallpaper: "wallpaper-blue",
      totalXp: 2260,
    }),
  },
  {
    id: "friend-13",
    name: "시험기간생존자",
    studentId: "202155550",
    miniGameScores: { catchTheMajor: 720, catchBoo: 1210, freeThrow: 590 },
    miniGameHardScores: { catchTheMajor: 210, catchBoo: 430, freeThrow: 230 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "생존부",
      characterState: "hungry",
      equippedRoomItems: {
        bed: "bed-walnut-pink",
        closet: "closet-walnut",
        table: "table-walnut-pink",
      },
      equippedRoomWallpaper: "wallpaper-gray",
      totalXp: 4700,
    }),
  },
  {
    id: "friend-14",
    name: "학점사냥꾼",
    studentId: "202166660",
    miniGameScores: { catchTheMajor: 1320, catchBoo: 1460, freeThrow: 1310 },
    miniGameHardScores: { catchTheMajor: 410, catchBoo: 510, freeThrow: 500 },
    roomSnapshot: createFriendRoomSnapshot({
      booName: "사냥부",
      characterState: "happy2",
      equippedRoomItems: {
        bed: "bed-oak-purple",
        closet: "closet-oak",
        table: "table-oak-purple",
      },
      equippedRoomWallpaper: "wallpaper-purple",
      totalXp: 7050,
    }),
  },
];

export const getFriendByStudentId = (studentId: string) =>
  FRIEND_DIRECTORY_DUMMY_DATA.find((friend) => friend.studentId === studentId);

export const getFriendMiniGameScore = (
  friend: FriendListItem,
  miniGameId: keyof FriendMiniGameScores,
  difficulty: FriendMiniGameDifficulty = "normal",
) => {
  const directoryFriend = FRIEND_DIRECTORY_DUMMY_DATA.find(
    (item) => item.id === friend.id,
  );

  if (difficulty === "hard" || difficulty === "infinite") {
    return (
      friend.miniGameHardScores?.[miniGameId] ??
      directoryFriend?.miniGameHardScores?.[miniGameId] ??
      0
    );
  }

  return (
    friend.miniGameScores?.[miniGameId] ??
    directoryFriend?.miniGameScores?.[miniGameId] ??
    0
  );
};
