"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useToast } from "@/components/ui/toast";
import type { ChatMessageData, PinnedMessageData, ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMember {
  id: string;
  name: string;
  avatar: string | null;
  isCaptain: boolean;
  online: boolean;
}

interface ChatRoom {
  id: string;
  tripId: string;
  tripTitle: string;
  memberCount: number;
  members: ChatMember[];
  onlineCount: number;
  unreadCount: number;
  currentUserRole: string;
  isCurrentUserCaptain: boolean;
}

interface TypingUser {
  userId: string;
  userName: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REACTION_EMOJIS = [
  { key: "heart", display: "\u2764\uFE0F" },
  { key: "thumbs_up", display: "\uD83D\uDC4D" },
  { key: "laugh", display: "\uD83D\uDE02" },
  { key: "fire", display: "\uD83D\uDD25" },
  { key: "sad", display: "\uD83D\uDE22" },
] as const;

const EDIT_WINDOW_MS = 15 * 60 * 1000;

function emojiDisplay(key: string): string {
  return REACTION_EMOJIS.find((e) => e.key === key)?.display ?? key;
}

// ---------------------------------------------------------------------------
// Chat Header
// ---------------------------------------------------------------------------

function ChatHeader({
  room,
  tripId,
  onBack,
  onInfoClick,
}: {
  room: ChatRoom | null;
  tripId: string;
  onBack: () => void;
  onInfoClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-sm px-4 py-3">
      <button
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
        aria-label="Go back"
      >
        <Icon name="arrow_back" size={22} />
      </button>

      {room ? (
        <div className="flex-1 min-w-0">
          <h1 className="text-title-md font-semibold text-on-surface truncate">
            {room.tripTitle}
          </h1>
          <p className="text-label-sm text-on-surface-variant">
            {room.memberCount} member{room.memberCount !== 1 ? "s" : ""}
            {room.onlineCount > 0 && (
              <span className="text-success"> · {room.onlineCount} online</span>
            )}
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-1.5">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="30%" height={12} />
        </div>
      )}

      <Link
        href={`/trips/${tripId}/shepherd`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
        aria-label="Message Shepherd"
      >
        <Icon name="shield" size={22} className="text-on-surface-variant" />
      </Link>

      <button
        onClick={onInfoClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
        aria-label="Group info"
      >
        <Icon name="info" size={22} className="text-on-surface-variant" />
      </button>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Pinned Messages Banner
// ---------------------------------------------------------------------------

function PinnedMessagesBanner({ pins }: { pins: PinnedMessageData[] }) {
  const [expanded, setExpanded] = useState(false);

  if (pins.length === 0) return null;

  const latest = pins[0];

  return (
    <div className="sticky top-0 z-20 border-b border-outline-variant bg-surface-container-low/95 backdrop-blur-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-2 text-left"
      >
        <Icon name="push_pin" size={16} className="text-primary shrink-0" />
        <p className="flex-1 truncate text-label-sm text-on-surface">
          <span className="font-semibold">{latest.userName}:</span> {latest.content}
        </p>
        <Icon
          name={expanded ? "expand_less" : "expand_more"}
          size={18}
          className="text-on-surface-variant shrink-0"
        />
      </button>

      {expanded && pins.length > 1 && (
        <div className="border-t border-outline-variant/50 px-4 pb-2 space-y-1">
          {pins.slice(1).map((pin) => (
            <div key={pin.id} className="flex items-center gap-2 py-1">
              <Icon name="push_pin" size={14} className="text-on-surface-variant/50 shrink-0" />
              <p className="flex-1 truncate text-label-sm text-on-surface-variant">
                <span className="font-medium">{pin.userName}:</span> {pin.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member List Panel (BottomSheet)
// ---------------------------------------------------------------------------

function MemberListPanel({
  open,
  onClose,
  members,
  tripId,
}: {
  open: boolean;
  onClose: () => void;
  members: ChatMember[];
  tripId: string;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Group Members" snapPoints={[50, 80]}>
      <div className="space-y-1">
        <Link
          href={`/trips/${tripId}/shepherd`}
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-container-high transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icon name="shield" size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-label-lg font-semibold text-primary">
              Message Shepherd Privately
            </p>
            <p className="text-label-sm text-on-surface-variant">
              Confidential 1:1 with your trip captain
            </p>
          </div>
          <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
        </Link>

        <div className="my-2 border-t border-outline-variant/30" />

        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-xl px-2 py-2.5"
          >
            <Avatar
              src={member.avatar}
              name={member.name}
              size="md"
              online={member.online}
            />
            <div className="flex-1 min-w-0">
              <p className="text-label-lg font-semibold text-on-surface truncate">
                {member.name}
              </p>
              {member.online && (
                <p className="text-label-sm text-success">Online</p>
              )}
            </div>
            {member.isCaptain && (
              <Badge variant="secondary">Captain</Badge>
            )}
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// System Message
// ---------------------------------------------------------------------------

function SystemMessage({ message }: { message: ChatMessageData }) {
  return (
    <div className="flex justify-center py-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant">
        <Icon name="campaign" size={14} />
        {message.content}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message Action Sheet
// ---------------------------------------------------------------------------

function MessageActionSheet({
  open,
  onClose,
  message,
  isOwn,
  canModerate,
  onReply,
  onReaction,
  onEdit,
  onDelete,
  onPin,
}: {
  open: boolean;
  onClose: () => void;
  message: ChatMessageData | null;
  isOwn: boolean;
  canModerate: boolean;
  onReply: () => void;
  onReaction: (emoji: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  if (!message) return null;

  const isWithinWindow = Date.now() - new Date(message.createdAt).getTime() < EDIT_WINDOW_MS;
  const canEdit = isOwn && message.type === "TEXT" && isWithinWindow && !message.isDeleted;
  const canDeleteOwn = isOwn && isWithinWindow && !message.isDeleted;
  const canModDelete = canModerate && !isOwn && !message.isDeleted;

  return (
    <BottomSheet open={open} onClose={onClose} title="Message Actions" snapPoints={[40, 60]}>
      {/* Emoji row */}
      {!message.isDeleted && (
        <div className="flex items-center justify-center gap-1 pb-3 border-b border-outline-variant/30">
          {REACTION_EMOJIS.map((e) => (
            <button
              key={e.key}
              onClick={() => {
                onReaction(e.key);
                onClose();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-xl"
            >
              {e.display}
            </button>
          ))}
        </div>
      )}

      <div className="py-1 space-y-0.5">
        {/* Reply */}
        {!message.isDeleted && (
          <button
            onClick={() => { onReply(); onClose(); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 hover:bg-surface-container-high transition-colors"
          >
            <Icon name="reply" size={20} className="text-on-surface-variant" />
            <span className="text-body-md text-on-surface">Reply</span>
          </button>
        )}

        {/* Edit */}
        {canEdit && (
          <button
            onClick={() => { onEdit(); onClose(); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 hover:bg-surface-container-high transition-colors"
          >
            <Icon name="edit" size={20} className="text-on-surface-variant" />
            <span className="text-body-md text-on-surface">Edit Message</span>
          </button>
        )}

        {/* Delete own */}
        {canDeleteOwn && (
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 hover:bg-surface-container-high transition-colors"
          >
            <Icon name="delete" size={20} className="text-error" />
            <span className="text-body-md text-error">Delete Message</span>
          </button>
        )}

        {/* Moderator delete */}
        {canModDelete && (
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 hover:bg-surface-container-high transition-colors"
          >
            <Icon name="delete" size={20} className="text-error" />
            <span className="text-body-md text-error">Delete (Moderator)</span>
          </button>
        )}

        {/* Pin/Unpin */}
        {canModerate && !message.isDeleted && (
          <button
            onClick={() => { onPin(); onClose(); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 hover:bg-surface-container-high transition-colors"
          >
            <Icon name={message.isPinned ? "push_pin" : "push_pin"} size={20} className="text-on-surface-variant" />
            <span className="text-body-md text-on-surface">
              {message.isPinned ? "Unpin Message" : "Pin Message"}
            </span>
          </button>
        )}
      </div>
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// Chat Bubble
// ---------------------------------------------------------------------------

function ChatBubble({
  message,
  isOwn,
  showAvatar,
  showName,
  onLongPress,
}: {
  message: ChatMessageData;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  onLongPress: (message: ChatMessageData) => void;
}) {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const time = new Date(message.createdAt);
  const timeString = time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      onLongPress(message);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDoubleClick = () => {
    onLongPress(message);
  };

  // Deleted message display
  if (message.isDeleted) {
    return (
      <div
        className={cn(
          "flex gap-2 px-4 py-0.5",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div className="w-8 shrink-0 self-end">
          {showAvatar && !isOwn && (
            <Avatar src={message.userAvatar} name={message.userName} size="sm" />
          )}
        </div>
        <div className={cn("max-w-[75%] min-w-[80px]", isOwn ? "items-end" : "items-start")}>
          {showName && !isOwn && (
            <p className="mb-0.5 ml-1 text-label-sm font-semibold text-primary">
              {message.userName}
            </p>
          )}
          <div
            className={cn(
              "relative rounded-2xl px-4 py-2.5",
              isOwn
                ? "bg-primary-container/50 rounded-br-md"
                : "bg-surface-container/50 rounded-bl-md"
            )}
          >
            <p className="italic text-on-surface-variant/60 text-body-md flex items-center gap-1">
              <Icon name="block" size={14} />
              This message was deleted
            </p>
            <span className="mt-1 block text-[10px] opacity-50">{timeString}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 px-4 py-0.5 group",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className="w-8 shrink-0 self-end">
        {showAvatar && !isOwn && (
          <Avatar
            src={message.userAvatar}
            name={message.userName}
            size="sm"
          />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[75%] min-w-[80px]",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {/* Sender name */}
        {showName && !isOwn && (
          <p className="mb-0.5 ml-1 text-label-sm font-semibold text-primary">
            {message.userName}
          </p>
        )}

        <div
          className={cn(
            "relative rounded-2xl px-4 py-2.5",
            isOwn
              ? "bg-primary-container text-on-primary-container rounded-br-md"
              : "bg-surface-container text-on-surface rounded-bl-md"
          )}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          {/* Pin indicator */}
          {message.isPinned && (
            <div className="mb-1 flex items-center gap-1">
              <Icon name="push_pin" size={12} className="text-primary/60" />
              <span className="text-[10px] text-primary/60 font-medium">Pinned</span>
            </div>
          )}

          {/* Reply preview */}
          {message.replyToContent && (
            <div
              className={cn(
                "mb-1.5 rounded-lg border-l-2 px-2.5 py-1.5 text-label-sm",
                isOwn
                  ? "border-on-primary-container/40 bg-on-primary-container/10 text-on-primary-container/70"
                  : "border-primary/40 bg-primary/5 text-on-surface-variant"
              )}
            >
              <p className="line-clamp-2">{message.replyToContent}</p>
            </div>
          )}

          {/* Image message */}
          {message.type === "IMAGE" && message.imageUrl && (
            <div className="relative mb-1.5 h-48 w-56 overflow-hidden rounded-xl">
              <Image
                src={message.imageUrl}
                alt="Shared image"
                fill
                className="object-cover"
                sizes="224px"
              />
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <p className="text-body-md whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Timestamp & edit indicator */}
          <div
            className={cn(
              "mt-1 flex items-center gap-1",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            {message.isEdited && (
              <span className="text-[10px] opacity-60">edited</span>
            )}
            <span className="text-[10px] opacity-50">{timeString}</span>
          </div>
        </div>

        {/* Reaction pills */}
        {message.reactions.length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onLongPress(message)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors border",
                  r.reacted
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-surface-container border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                <span>{emojiDisplay(r.emoji)}</span>
                <span className="font-medium">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Reply action (visible on hover) */}
        <button
          onClick={() => onLongPress(message)}
          className={cn(
            "mt-0.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-container-high",
            isOwn ? "ml-auto" : ""
          )}
        >
          <Icon name="more_horiz" size={14} />
          Actions
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing Indicator
// ---------------------------------------------------------------------------

function TypingIndicator({ users }: { users: TypingUser[] }) {
  if (users.length === 0) return null;

  const names =
    users.length === 1
      ? `${users[0].userName} is typing`
      : users.length === 2
        ? `${users[0].userName} and ${users[1].userName} are typing`
        : `${users[0].userName} and ${users.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <div className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant/40 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant/40 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant/40 [animation-delay:300ms]" />
      </div>
      <span className="text-label-sm text-on-surface-variant">{names}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message Input Bar
// ---------------------------------------------------------------------------

function MessageInputBar({
  onSend,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSaveEdit,
  announcementMode,
  onToggleAnnouncement,
  canModerate,
  sending,
}: {
  onSend: (content: string, imageFile?: File) => void;
  replyTo: ChatMessageData | null;
  onCancelReply: () => void;
  editingMessage: ChatMessageData | null;
  onCancelEdit: () => void;
  onSaveEdit: (content: string) => void;
  announcementMode: boolean;
  onToggleAnnouncement: () => void;
  canModerate: boolean;
  sending: boolean;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill text when editing
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    if (replyTo) {
      inputRef.current?.focus();
    }
  }, [replyTo]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !sending) return;

    if (editingMessage) {
      onSaveEdit(trimmed);
      setText("");
      return;
    }

    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSend("", file);
      e.target.value = "";
    }
  };

  const handleCancel = () => {
    if (editingMessage) {
      onCancelEdit();
      setText("");
    } else if (replyTo) {
      onCancelReply();
    }
  };

  return (
    <div className="sticky bottom-0 border-t border-outline-variant bg-surface-container-lowest pb-safe">
      {/* Announcement mode banner */}
      {announcementMode && (
        <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-2 bg-warning/10">
          <Icon name="campaign" size={16} className="text-warning shrink-0" />
          <p className="flex-1 text-label-sm font-medium text-warning">
            Announcing to group
          </p>
          <button
            onClick={onToggleAnnouncement}
            className="shrink-0 rounded-full p-1 hover:bg-surface-container-high"
            aria-label="Cancel announcement"
          >
            <Icon name="close" size={18} className="text-on-surface-variant" />
          </button>
        </div>
      )}

      {/* Edit Preview */}
      {editingMessage && (
        <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-2 bg-surface-container-low">
          <Icon name="edit" size={16} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-label-sm font-semibold text-primary">
              Editing message
            </p>
            <p className="text-label-sm text-on-surface-variant truncate">
              {editingMessage.content}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="shrink-0 rounded-full p-1 hover:bg-surface-container-high"
            aria-label="Cancel edit"
          >
            <Icon name="close" size={18} className="text-on-surface-variant" />
          </button>
        </div>
      )}

      {/* Reply Preview */}
      {replyTo && !editingMessage && (
        <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-2 bg-surface-container-low">
          <Icon name="reply" size={16} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-label-sm font-semibold text-primary">
              {replyTo.userName}
            </p>
            <p className="text-label-sm text-on-surface-variant truncate">
              {replyTo.content}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="shrink-0 rounded-full p-1 hover:bg-surface-container-high"
            aria-label="Cancel reply"
          >
            <Icon name="close" size={18} className="text-on-surface-variant" />
          </button>
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-3 px-4 py-3">
        {/* Attach image (hidden in edit mode) */}
        {!editingMessage && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
              aria-label="Attach image"
            >
              <Icon name="image" size={22} className="text-on-surface-variant" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </>
        )}

        {/* Announcement toggle (moderators only, not in edit mode) */}
        {canModerate && !editingMessage && (
          <button
            onClick={onToggleAnnouncement}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
              announcementMode
                ? "bg-warning/10 text-warning"
                : "hover:bg-surface-container-high text-on-surface-variant"
            )}
            aria-label="Toggle announcement mode"
          >
            <Icon name="campaign" size={22} />
          </button>
        )}

        {/* Text Input */}
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              announcementMode
                ? "Type an announcement..."
                : editingMessage
                  ? "Edit your message..."
                  : "Type a message..."
            }
            rows={1}
            className={cn(
              "w-full resize-none rounded-2xl border px-4 py-2.5",
              "text-body-md text-on-surface placeholder:text-on-surface-variant/50",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
              "max-h-32 scrollbar-thin",
              announcementMode
                ? "border-warning/30 bg-warning/5"
                : "border-outline-variant bg-surface-container-low"
            )}
            style={{ minHeight: "40px" }}
          />
        </div>

        {/* Send / Save Button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
            text.trim()
              ? editingMessage
                ? "bg-success text-on-primary shadow-elevated"
                : "primary-gradient text-on-primary shadow-elevated"
              : "bg-surface-container-high text-on-surface-variant"
          )}
          aria-label={editingMessage ? "Save edit" : "Send message"}
        >
          {sending ? (
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : editingMessage ? (
            <Icon name="check" size={20} />
          ) : (
            <Icon name="send" size={20} filled />
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scroll-to-Bottom FAB
// ---------------------------------------------------------------------------

function ScrollToBottomButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="absolute bottom-20 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-on-surface shadow-lg border border-outline-variant/30 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
      aria-label="Scroll to bottom"
    >
      <Icon name="keyboard_arrow_down" size={24} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Message List Skeleton
// ---------------------------------------------------------------------------

function MessageListSkeleton() {
  return (
    <div className="flex-1 space-y-4 px-4 py-6">
      <div className="flex gap-2">
        <Skeleton variant="circular" diameter={32} />
        <div className="space-y-1">
          <Skeleton variant="rectangular" width={180} height={48} className="rounded-2xl" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Skeleton variant="rectangular" width={200} height={40} className="rounded-2xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="circular" diameter={32} />
        <div className="space-y-1">
          <Skeleton variant="rectangular" width={140} height={36} className="rounded-2xl" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Skeleton variant="rectangular" width={160} height={56} className="rounded-2xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="circular" diameter={32} />
        <div className="space-y-1">
          <Skeleton variant="rectangular" width={220} height={44} className="rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Chat Page
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 3000;

export default function TripChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { error: toastError, success: toastSuccess } = useToast();
  const tripId = params.id;

  const currentUserId = session?.user?.id;

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageData | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessageData | null>(null);
  const [announcementMode, setAnnouncementMode] = useState(false);
  const [actionMessage, setActionMessage] = useState<ChatMessageData | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isAtBottomRef = useRef(true);

  const canModerate =
    room &&
    (["ADMIN", "SUPPORT"].includes(room.currentUserRole) || room.isCurrentUserCaptain);

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Track if user is at bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 100;
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    isAtBottomRef.current = atBottom;
    setShowScrollButton(!atBottom);
  }, []);

  // Fetch chat room info
  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/room?tripId=${tripId}`);
      if (!res.ok) throw new Error("Failed to load chat room");
      const data: ApiResponse<ChatRoom> = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to load chat room");
      setRoom(data.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chat");
    }
  }, [tripId]);

  // Fetch messages
  const fetchMessages = useCallback(
    async (isInitial = false) => {
      try {
        const res = await fetch(`/api/chat?tripId=${tripId}`);
        if (!res.ok) throw new Error("Failed to load messages");
        const data: ApiResponse<{
          roomId: string;
          messages: ChatMessageData[];
          pinnedMessages: PinnedMessageData[];
        }> = await res.json();
        if (!data.success) throw new Error(data.error ?? "Failed to load messages");

        const newMessages = data.data?.messages ?? [];
        setPinnedMessages(data.data?.pinnedMessages ?? []);

        setMessages((prev) => {
          if (prev.length !== newMessages.length || isInitial) {
            return newMessages;
          }
          const lastPrev = prev[prev.length - 1]?.id;
          const lastNew = newMessages[newMessages.length - 1]?.id;
          if (lastPrev !== lastNew) {
            return newMessages;
          }
          // Check for content/reaction/status changes
          const contentChanged = prev.some((msg, idx) => {
            const newMsg = newMessages[idx];
            if (!newMsg) return true;
            return (
              msg.content !== newMsg.content ||
              msg.isDeleted !== newMsg.isDeleted ||
              msg.isPinned !== newMsg.isPinned ||
              msg.isEdited !== newMsg.isEdited ||
              JSON.stringify(msg.reactions) !== JSON.stringify(newMsg.reactions)
            );
          });
          if (contentChanged) return newMessages;
          return prev;
        });

        if (isInitial) {
          setTimeout(() => scrollToBottom("instant"), 50);
        } else if (isAtBottomRef.current) {
          setTimeout(() => scrollToBottom("smooth"), 50);
        }
      } catch (err) {
        if (isInitial) {
          setError(err instanceof Error ? err.message : "Failed to load messages");
        }
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [tripId, scrollToBottom]
  );

  // Send message
  const sendMessage = useCallback(
    async (content: string, imageFile?: File) => {
      if (!content && !imageFile) return;
      setSending(true);

      try {
        if (announcementMode && content) {
          // Send as announcement
          const res = await fetch("/api/chat/moderate", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tripId, content }),
          });
          if (!res.ok) throw new Error("Failed to send announcement");
          const data = await res.json();
          if (!data.success) throw new Error(data.error ?? "Failed to send announcement");

          toastSuccess("Announcement sent");
          setAnnouncementMode(false);
          fetchMessages(false);
          return;
        }

        const body: Record<string, unknown> = {
          tripId,
          content,
          type: imageFile ? "IMAGE" : "TEXT",
          replyToId: replyTo?.id ?? null,
        };

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Failed to send message");
        const data: ApiResponse<ChatMessageData> = await res.json();
        if (!data.success) throw new Error(data.error ?? "Failed to send message");

        if (data.data) {
          setMessages((prev) => [...prev, data.data!]);
          setTimeout(() => scrollToBottom("smooth"), 50);
        }

        setReplyTo(null);
      } catch {
        toastError("Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [tripId, replyTo, announcementMode, scrollToBottom, toastError, toastSuccess, fetchMessages]
  );

  // Edit message
  const saveEdit = useCallback(
    async (content: string) => {
      if (!editingMessage || !content) return;
      const originalContent = editingMessage.content;

      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMessage.id
            ? { ...msg, content, isEdited: true }
            : msg
        )
      );
      setEditingMessage(null);

      try {
        const res = await fetch("/api/chat", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: editingMessage.id, content }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to edit");
        }
      } catch (err) {
        // Revert optimistic update
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === editingMessage.id
              ? { ...msg, content: originalContent }
              : msg
          )
        );
        toastError(err instanceof Error ? err.message : "Failed to edit message");
      }
    },
    [editingMessage, toastError]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: "", reactions: [] }
            : msg
        )
      );

      try {
        const res = await fetch("/api/chat", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to delete");
        }
      } catch (err) {
        // Revert — next poll will correct
        fetchMessages(false);
        toastError(err instanceof Error ? err.message : "Failed to delete message");
      }
    },
    [fetchMessages, toastError]
  );

  // Moderate: pin/unpin/delete
  const moderateMessage = useCallback(
    async (messageId: string, action: "pin" | "unpin" | "delete") => {
      if (action === "delete") {
        // Use moderation endpoint for moderator deletes
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, isDeleted: true, content: "", reactions: [] }
              : msg
          )
        );
      } else {
        // Optimistic pin/unpin
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, isPinned: action === "pin" }
              : msg
          )
        );
      }

      try {
        const res = await fetch("/api/chat/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId, action }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to moderate");
        }
        if (action === "pin" || action === "unpin") {
          fetchMessages(false); // Refresh pinned list
        }
      } catch (err) {
        fetchMessages(false);
        toastError(err instanceof Error ? err.message : "Failed to moderate message");
      }
    },
    [fetchMessages, toastError]
  );

  // Toggle reaction
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const reactions = [...msg.reactions];
          const idx = reactions.findIndex((r) => r.emoji === emoji);
          if (idx >= 0) {
            const r = reactions[idx];
            if (r.reacted) {
              if (r.count === 1) {
                reactions.splice(idx, 1);
              } else {
                reactions[idx] = { ...r, count: r.count - 1, reacted: false };
              }
            } else {
              reactions[idx] = { ...r, count: r.count + 1, reacted: true };
            }
          } else {
            reactions.push({ emoji, count: 1, reacted: true });
          }
          return { ...msg, reactions };
        })
      );

      try {
        await fetch("/api/chat", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId, emoji }),
        });
      } catch {
        fetchMessages(false);
      }
    },
    [fetchMessages]
  );

  // Initial load
  useEffect(() => {
    fetchRoom();
    fetchMessages(true);
  }, [fetchRoom, fetchMessages]);

  // Polling
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchMessages(false);
      fetchRoom();
    }, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchMessages, fetchRoom]);

  // Group messages by date
  const groupedMessages = messages.reduce<{
    groups: { date: string; messages: ChatMessageData[] }[];
  }>(
    (acc, msg) => {
      const dateStr = formatDate(msg.createdAt, "short");
      const lastGroup = acc.groups[acc.groups.length - 1];
      if (lastGroup && lastGroup.date === dateStr) {
        lastGroup.messages.push(msg);
      } else {
        acc.groups.push({ date: dateStr, messages: [msg] });
      }
      return acc;
    },
    { groups: [] }
  );

  // Action sheet handlers
  const handleActionReply = () => {
    if (actionMessage) setReplyTo(actionMessage);
  };
  const handleActionEdit = () => {
    if (actionMessage) setEditingMessage(actionMessage);
  };
  const handleActionDelete = () => {
    if (!actionMessage) return;
    const isOwn = actionMessage.userId === currentUserId;
    if (isOwn) {
      deleteMessage(actionMessage.id);
    } else {
      moderateMessage(actionMessage.id, "delete");
    }
  };
  const handleActionPin = () => {
    if (!actionMessage) return;
    moderateMessage(actionMessage.id, actionMessage.isPinned ? "unpin" : "pin");
  };

  return (
    <div className="flex h-dvh flex-col bg-surface">
      {/* Header */}
      <ChatHeader
        room={room}
        tripId={tripId}
        onBack={() => router.back()}
        onInfoClick={() => setShowMembers(true)}
      />

      {/* Pinned Messages Banner */}
      <PinnedMessagesBanner pins={pinnedMessages} />

      {/* Messages */}
      {loading ? (
        <MessageListSkeleton />
      ) : error ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <Icon
              name="error_outline"
              size={48}
              className="mx-auto mb-3 text-error"
            />
            <p className="text-title-md font-semibold text-on-surface">
              Could not load chat
            </p>
            <p className="mt-1 text-body-md text-on-surface-variant">{error}</p>
            <Button
              className="mt-4"
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchMessages(true);
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative flex-1">
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto"
          >
            {messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center py-20">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container">
                    <Icon
                      name="chat_bubble"
                      size={40}
                      className="text-on-surface-variant"
                    />
                  </div>
                  <p className="text-title-lg font-semibold text-on-surface">
                    Start the conversation
                  </p>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    Say hello to your travel companions!
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                {groupedMessages.groups.map((group) => (
                  <div key={group.date}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center py-3">
                      <span className="rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant">
                        {group.date}
                      </span>
                    </div>

                    {/* Messages */}
                    {group.messages.map((msg, idx) => {
                      const isOwn = msg.userId === currentUserId;
                      const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                      const showAvatar = !prevMsg || prevMsg.userId !== msg.userId;
                      const showName = showAvatar;

                      if (msg.type === "SYSTEM") {
                        return <SystemMessage key={msg.id} message={msg} />;
                      }

                      return (
                        <ChatBubble
                          key={msg.id}
                          message={msg}
                          isOwn={isOwn}
                          showAvatar={showAvatar}
                          showName={showName}
                          onLongPress={setActionMessage}
                        />
                      );
                    })}
                  </div>
                ))}

                {/* Typing Indicator */}
                <TypingIndicator users={typingUsers} />

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Scroll-to-bottom FAB */}
          <ScrollToBottomButton
            visible={showScrollButton}
            onClick={() => scrollToBottom("smooth")}
          />
        </div>
      )}

      {/* Input Bar */}
      {!error && (
        <MessageInputBar
          onSend={sendMessage}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onSaveEdit={saveEdit}
          announcementMode={announcementMode}
          onToggleAnnouncement={() => setAnnouncementMode(!announcementMode)}
          canModerate={!!canModerate}
          sending={sending}
        />
      )}

      {/* Message Action Sheet */}
      <MessageActionSheet
        open={!!actionMessage}
        onClose={() => setActionMessage(null)}
        message={actionMessage}
        isOwn={actionMessage?.userId === currentUserId}
        canModerate={!!canModerate}
        onReply={handleActionReply}
        onReaction={(emoji) => {
          if (actionMessage) toggleReaction(actionMessage.id, emoji);
        }}
        onEdit={handleActionEdit}
        onDelete={handleActionDelete}
        onPin={handleActionPin}
      />

      {/* Member List Bottom Sheet */}
      <MemberListPanel
        open={showMembers}
        onClose={() => setShowMembers(false)}
        members={room?.members ?? []}
        tripId={tripId}
      />
    </div>
  );
}
