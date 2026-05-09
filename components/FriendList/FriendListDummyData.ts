export interface FriendListItem {
  id: string;
  name: string;
  studentId: string;
}

export const FRIEND_LIST_DUMMY_DATA: FriendListItem[] = [
  { id: "friend-1", name: "이세계킹왕짱", studentId: "202100010" },
  { id: "friend-2", name: "친구임", studentId: "202100020" },
  { id: "friend-3", name: "ㅎㅎ", studentId: "202100030" },
  { id: "friend-4", name: "취준기조아", studentId: "202100040" },
  { id: "friend-5", name: "외대킹", studentId: "202100050" },
  { id: "friend-6", name: "밤샘장인", studentId: "202100060" },
  { id: "friend-7", name: "커피수혈중", studentId: "202100070" },
  { id: "friend-8", name: "월요병퇴치반", studentId: "202100080" },
  { id: "friend-9", name: "학식헌터", studentId: "202100090" },
  { id: "friend-10", name: "벼락치기고수", studentId: "202100100" },
];

export const FRIEND_DIRECTORY_DUMMY_DATA: FriendListItem[] = [
  ...FRIEND_LIST_DUMMY_DATA,
  { id: "friend-11", name: "외대폭파", studentId: "202033000" },
  { id: "friend-12", name: "도서관정주행", studentId: "202144440" },
  { id: "friend-13", name: "시험기간생존자", studentId: "202155550" },
  { id: "friend-14", name: "학점사냥꾼", studentId: "202166660" },
];

export const getFriendByStudentId = (studentId: string) =>
  FRIEND_DIRECTORY_DUMMY_DATA.find((friend) => friend.studentId === studentId);
