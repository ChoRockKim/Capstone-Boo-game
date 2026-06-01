/**
 * @description  서버 친구 응답을 기존 친구 UI 모델로 변환합니다.
 * @depends      components/FriendList/FriendListDummyData.ts, utils/serverApi.ts
 * @used-by      components/FriendPanel/FriendPanel.tsx, components/FriendPanel/FriendAddModal.tsx, components/FriendList/FriendList.tsx
 * @side-effects 없음
 */
import { FriendListItem } from "@/components/FriendList/FriendListDummyData";
import { FriendOut, FriendUser } from "@/utils/serverApi";

export const mapFriendUserToFriendListItem = (
  friend: FriendUser,
): FriendListItem => ({
  id: `server-user-${friend.user_id}`,
  image: friend.image ?? null,
  name: friend.nickname,
  serverUserId: friend.user_id,
  studentId: friend.student_id,
});

export const mapFriendOutToFriendListItem = (
  friendOut: FriendOut,
): FriendListItem => ({
  ...mapFriendUserToFriendListItem(friendOut.friend),
  id: `server-friend-${friendOut.friend_id}`,
  serverFriendId: friendOut.friend_id,
});
