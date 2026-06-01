/**
 * @description  서버 방명록 응답을 기존 방명록 UI 모델로 변환합니다.
 * @depends      components/Room/RoomGuestbookDummyData.ts, utils/serverApi.ts
 * @used-by      app/room/index.tsx
 * @side-effects 없음
 */
import { RoomGuestbookListEntry } from "@/components/Room/RoomGuestbookDummyData";
import { GuestbookOut } from "@/utils/serverApi";

export const mapGuestbookOutToListEntry = (
  entry: GuestbookOut,
): RoomGuestbookListEntry => ({
  authorFriendId: `server-user-${entry.writer_id}`,
  authorName: entry.writer_nickname,
  id: `server-guestbook-${entry.entry_id}`,
  message: entry.content,
});
