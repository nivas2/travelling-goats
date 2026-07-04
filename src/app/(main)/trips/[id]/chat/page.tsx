"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessageData, ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatRoom {
  id: string;
  tripId: string;
  tripTitle: string;
  memberCount: number;
  members: {
    id: string;
    name: string;
    avatar: string | null;
    isCaptain: boolean;
  }[];
}

interface TypingUser {
  userId: string;
  userName: string;
}

// ---------------------------------------------------------------------------
// Chat Header
// ---------------------------------------------------------------------------

function ChatHeader({
  room,
  onBack,
}: {
  room: ChatRoom | null;
  onBack: () => void;
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
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-1.5">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="30%" height={12} />
        </div>
      )}

      <button
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
        aria-label="Group info"
      >
        <Icon name="info" size={22} className="text-on-surface-variant" />
      </button>
    </header>
  );
}

// ---------------------------------------------------------------------------
// System Message
// ---------------------------------------------------------------------------

function SystemMessage({ message }: { message: ChatMessageData }) {
  return (
    <div className="flex justify-center py-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant">
        <Icon name="info" size={14} />
        {message.content}
      </span>
    </div>
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
  onReply,
}: {
  message: ChatMessageData;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  onReply: (message: ChatMessageData) => void;
}) {
  const time = new Date(message.createdAt);
  const timeString = time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

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
            "relative rounded-2xl px-3.5 py-2",
            isOwn
              ? "bg-primary-container text-on-primary-container rounded-br-md"
              : "bg-surface-container text-on-surface rounded-bl-md"
          )}
        >
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

        {/* Reply action (visible on hover) */}
        <button
          onClick={() => onReply(message)}
          className={cn(
            "mt-0.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-container-high",
            isOwn ? "ml-auto" : ""
          )}
        >
          <Icon name="reply" size={14} />
          Reply
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
  sending,
}: {
  onSend: (content: string, imageFile?: File) => void;
  replyTo: ChatMessageData | null;
  onCancelReply: () => void;
  sending: boolean;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !sending) return;
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

  useEffect(() => {
    if (replyTo) {
      inputRef.current?.focus();
    }
  }, [replyTo]);

  return (
    <div className="sticky bottom-0 border-t border-outline-variant bg-surface-container-lowest pb-safe">
      {/* Reply Preview */}
      {replyTo && (
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
            onClick={onCancelReply}
            className="shrink-0 rounded-full p-1 hover:bg-surface-container-high"
            aria-label="Cancel reply"
          >
            <Icon name="close" size={18} className="text-on-surface-variant" />
          </button>
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2 px-3 py-2">
        {/* Attach image */}
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

        {/* Text Input */}
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={cn(
              "w-full resize-none rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2.5",
              "text-body-md text-on-surface placeholder:text-on-surface-variant/50",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
              "max-h-32 scrollbar-thin"
            )}
            style={{ minHeight: "40px" }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
            text.trim()
              ? "primary-gradient text-on-primary shadow-elevated"
              : "bg-surface-container-high text-on-surface-variant"
          )}
          aria-label="Send message"
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
          ) : (
            <Icon name="send" size={20} filled />
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message List Skeleton
// ---------------------------------------------------------------------------

function MessageListSkeleton() {
  return (
    <div className="flex-1 space-y-4 px-4 py-6">
      {/* Left-aligned messages */}
      <div className="flex gap-2">
        <Skeleton variant="circular" diameter={32} />
        <div className="space-y-1">
          <Skeleton variant="rectangular" width={180} height={48} className="rounded-2xl" />
        </div>
      </div>
      {/* Right-aligned message */}
      <div className="flex gap-2 justify-end">
        <Skeleton variant="rectangular" width={200} height={40} className="rounded-2xl" />
      </div>
      {/* Left-aligned */}
      <div className="flex gap-2">
        <Skeleton variant="circular" diameter={32} />
        <div className="space-y-1">
          <Skeleton variant="rectangular" width={140} height={36} className="rounded-2xl" />
        </div>
      </div>
      {/* Right-aligned */}
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

const CURRENT_USER_ID = "current-user"; // Placeholder - would come from auth context
const POLL_INTERVAL = 3000;

export default function TripChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tripId = params.id;

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageData | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isAtBottomRef = useRef(true);

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Track if user is at bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 100;
    isAtBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
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
        const data: ApiResponse<ChatMessageData[]> = await res.json();
        if (!data.success) throw new Error(data.error ?? "Failed to load messages");

        const newMessages = data.data ?? [];
        setMessages((prev) => {
          // Only update if there are new messages
          if (prev.length !== newMessages.length || isInitial) {
            return newMessages;
          }
          const lastPrev = prev[prev.length - 1]?.id;
          const lastNew = newMessages[newMessages.length - 1]?.id;
          if (lastPrev !== lastNew) {
            return newMessages;
          }
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

        // Optimistically add the message
        if (data.data) {
          setMessages((prev) => [...prev, data.data!]);
          setTimeout(() => scrollToBottom("smooth"), 50);
        }

        setReplyTo(null);
      } catch (err) {
        console.error("Failed to send message:", err);
      } finally {
        setSending(false);
      }
    },
    [tripId, replyTo, scrollToBottom]
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
    }, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchMessages]);

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

  return (
    <div className="flex h-dvh flex-col bg-surface">
      {/* Header */}
      <ChatHeader room={room} onBack={() => router.back()} />

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
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
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
                    const isOwn = msg.userId === CURRENT_USER_ID;
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
                        onReply={setReplyTo}
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
      )}

      {/* Input Bar */}
      {!error && (
        <MessageInputBar
          onSend={sendMessage}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          sending={sending}
        />
      )}
    </div>
  );
}
