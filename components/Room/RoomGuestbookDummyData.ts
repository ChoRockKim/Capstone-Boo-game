/**
 * @description  내 방 방명록 화면에 표시할 임시 방명록 더미 데이터를 정의합니다.
 * @depends      없음
 * @used-by      components/Room/GuestbookListModal.tsx
 * @side-effects 없음
 */
export type RoomGuestbookListEntry = {
  authorFriendId: string;
  authorName: string;
  id: string;
  message: string;
};

export const ROOM_GUESTBOOK_DUMMY_ENTRIES: RoomGuestbookListEntry[] = [
  {
    id: "guestbook-1",
    message: "방 색감이 따뜻해서 부가 진짜 편해보임",
    authorName: "이세계킹왕짱",
    authorFriendId: "friend-1",
  },
  {
    id: "guestbook-2",
    message: "코인 많나보다. 나도 이런 방 꾸미고 싶다",
    authorName: "친구임",
    authorFriendId: "friend-2",
  },
  {
    id: "guestbook-3",
    message: "나도 책상 위치 이렇게 바꿔봐야겠다",
    authorName: "ㅎㅎ",
    authorFriendId: "friend-3",
  },
  {
    id: "guestbook-4",
    message: "내 방이 더 이쁘긴 한데 여기도 꽤 괜찮네",
    authorName: "취준기조아",
    authorFriendId: "friend-4",
  },
  {
    id: "guestbook-5",
    message: "책상 옆에 부 앉아있으면 귀여울 듯",
    authorName: "외대킹",
    authorFriendId: "friend-5",
  },
  {
    id: "guestbook-6",
    message: "침대 색감 귀엽다. 이거 어디서 샀냐",
    authorName: "밤샘장인",
    authorFriendId: "friend-6",
  },
  {
    id: "guestbook-7",
    message: "부가 방에서 돌아다니니까 훨씬 살아있는 느낌임",
    authorName: "커피수혈중",
    authorFriendId: "friend-7",
  },
  {
    id: "guestbook-8",
    message: "다음엔 내 방도 와줘. 구경할 거 많음",
    authorName: "월요병퇴치반",
    authorFriendId: "friend-8",
  },
];
