import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Constants, useMeeting } from "@videosdk.live/react-sdk";
import useIsMobile from "../hooks/useIsMobile";
import useIsTab from "../hooks/useIsTab";
import {
  LAYOUTS,
  QUALITY,
  SPEAKER_HISTORY_SIZE,
  getGridPageSize,
  getGridQuality,
} from "./constants";

const LargeRoomContext = createContext(null);

export const useLargeRoom = () => useContext(LargeRoomContext);

/**
 * Single source of truth for the large room demo.
 *
 * Answers three questions for every participant in the meeting:
 *   1. Are they visible right now?  -> drives pause() / resume()
 *   2. What video quality?          -> drives setQuality()
 *   3. Where do they sit in order?  -> keeps active speakers on page 1
 */
export const LargeRoomProvider = ({ isPresenting, children }) => {
  const [layout, setLayout] = useState(LAYOUTS.GRID);
  const [page, setPage] = useState(0);
  const [speakerHistory, setSpeakerHistory] = useState([]);
  const [promotedId, setPromotedId] = useState(null);
  const [rosterOpen, setRosterOpen] = useState(false);

  // Bumped on onParticipantModeChanged so the grid recomputes when somebody
  // switches between SEND_AND_RECV and RECV_ONLY / SIGNALLING_ONLY.
  const [modeVersion, setModeVersion] = useState(0);

  /**
   * "Pin for me" is app state, not SDK state. The SDK's pin() is broadcast to
   * the whole meeting, so a local-only pin has to live here.
   */
  const [locallyPinnedIds, setLocallyPinnedIds] = useState([]);

  // Refs let onSpeakerChanged read current state without re-subscribing the
  // meeting event on every page change.
  const visibleIdsRef = useRef([]);
  const localIdRef = useRef(null);

  const isMobile = useIsMobile();
  const isTab = useIsTab();

  // onSpeakerChanged tells us who is talking. It fires with a single id, or
  // null when nobody speaks, so we keep our own recency list from it.
  // https://docs.videosdk.live/react/api/sdk-reference/use-meeting/events#onspeakerchanged
  const {
    participants,
    pinnedParticipants,
    localParticipant,
    activeSpeakerId,
  } = useMeeting({
    onParticipantModeChanged: () => setModeVersion((v) => v + 1),

    onSpeakerChanged: (participantId) => {
      if (!participantId) return;

      setSpeakerHistory((prev) =>
        [participantId, ...prev.filter((id) => id !== participantId)].slice(
          0,
          SPEAKER_HISTORY_SIZE
        )
      );

      // Promote to the first tile only if they were off screen. Someone
      // already visible keeps their slot, so the grid does not reshuffle
      // every time a person in view speaks.
      if (
        participantId !== localIdRef.current &&
        !visibleIdsRef.current.includes(participantId)
      ) {
        setPromotedId(participantId);
      }
    },
  });

  const localParticipantId = localParticipant?.id;

  useEffect(() => {
    localIdRef.current = localParticipantId;
  }, [localParticipantId]);

  /**
   * Room order: pinned -> off-screen speaker -> you -> recent speakers -> rest.
   * Speakers bubble to the front, so they always land on the first page.
   */
  const orderedIds = useMemo(() => {
    const all = [...participants.keys()];
    const pinnedIds = [...pinnedParticipants.keys()];

    const ordered = [];
    const push = (id) => {
      if (id && all.includes(id) && !ordered.includes(id)) ordered.push(id);
    };

    // Pins are an explicit choice, so they outrank everything else.
    locallyPinnedIds.forEach(push);
    pinnedIds.forEach(push);
    push(promotedId);
    push(localParticipantId);
    speakerHistory.forEach(push);
    all.forEach(push);

    return ordered;
  }, [
    participants,
    pinnedParticipants,
    localParticipantId,
    speakerHistory,
    promotedId,
    locallyPinnedIds,
  ]);

  /**
   * Only SEND_AND_RECV participants publish media, so only they get a tile.
   * RECV_ONLY / SIGNALLING_ONLY participants (viewers) would otherwise take up
   * page slots with an empty tile.
   * https://docs.videosdk.live/react/api/sdk-reference/use-participant/properties
   */
  const canPublish = useCallback(
    (id) => participants.get(id)?.mode === Constants.modes.SEND_AND_RECV,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [participants, modeVersion]
  );

  // Everyone except you: your tile floats bottom right instead of taking a
  // grid slot, so a page shows 9 other people.
  const remoteOrderedIds = useMemo(
    () => orderedIds.filter((id) => id !== localParticipantId && canPublish(id)),
    [orderedIds, localParticipantId, canPublish]
  );

  const hasRemote = remoteOrderedIds.length > 0;

  // The participant shown in the big frame for SPOTLIGHT / SIDEBAR.
  const mainId = useMemo(() => {
    if (layout === LAYOUTS.GRID) return null;
    if (activeSpeakerId && canPublish(activeSpeakerId)) return activeSpeakerId;

    const lastSpeaker = speakerHistory.find(canPublish);
    return (
      lastSpeaker ||
      remoteOrderedIds[0] ||
      (canPublish(localParticipantId) ? localParticipantId : null)
    );
  }, [
    layout,
    activeSpeakerId,
    speakerHistory,
    remoteOrderedIds,
    localParticipantId,
    canPublish,
  ]);

  // The list the pager walks through (spotlight has no pager).
  const pagedIds = useMemo(() => {
    if (layout === LAYOUTS.SPOTLIGHT) return [];
    if (layout === LAYOUTS.SIDEBAR) {
      return remoteOrderedIds.filter((id) => id !== mainId);
    }
    // Alone in the room there is nobody else to show, so you take the grid.
    if (hasRemote) return remoteOrderedIds;
    return orderedIds.filter(canPublish);
  }, [layout, remoteOrderedIds, orderedIds, hasRemote, mainId, canPublish]);

  const pageSize = getGridPageSize({ layout, isPresenting, isMobile, isTab });

  const pageCount = pageSize
    ? Math.max(1, Math.ceil(pagedIds.length / pageSize))
    : 1;

  // Keep the pager in range when participants leave.
  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  const safePage = Math.min(page, pageCount - 1);

  const gridIds = useMemo(
    () =>
      pageSize
        ? pagedIds.slice(safePage * pageSize, safePage * pageSize + pageSize)
        : [],
    [pagedIds, pageSize, safePage]
  );

  const visibleIds = useMemo(
    () => (mainId ? [mainId, ...gridIds] : gridIds),
    [mainId, gridIds]
  );

  const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  useEffect(() => {
    visibleIdsRef.current = visibleIds;
  }, [visibleIds]);

  const isVisible = useCallback((id) => visibleIdSet.has(id), [visibleIdSet]);

  // Quality each visible tile should request: high for the speaker and the
  // spotlight frame, low for sidebar thumbnails, tiered by count otherwise.
  const qualityFor = useCallback(
    (participantId) => {
      if (participantId === mainId) return QUALITY.HIGH;
      if (layout === LAYOUTS.SIDEBAR) return QUALITY.LOW;
      if (participantId === activeSpeakerId) return QUALITY.HIGH;
      return getGridQuality(gridIds.length);
    },
    [mainId, layout, activeSpeakerId, gridIds.length]
  );

  const nextPage = useCallback(
    () => setPage((p) => Math.min(p + 1, pageCount - 1)),
    [pageCount]
  );
  const prevPage = useCallback(() => setPage((p) => Math.max(p - 1, 0)), []);

  // Let the user jump to the page holding the participant who is talking.
  const isSpeakerOffScreen =
    !!activeSpeakerId &&
    activeSpeakerId !== localParticipantId &&
    canPublish(activeSpeakerId) &&
    !visibleIdSet.has(activeSpeakerId);

  const jumpToSpeaker = useCallback(() => {
    if (!activeSpeakerId || !pageSize) return;
    const index = pagedIds.indexOf(activeSpeakerId);
    if (index !== -1) setPage(Math.floor(index / pageSize));
  }, [activeSpeakerId, pagedIds, pageSize]);

  const value = {
    // layout
    layout,
    setLayout,
    isPresenting,
    // participants
    orderedIds,
    visibleIds,
    gridIds,
    mainId,
    activeSpeakerId,
    localParticipantId,
    isVisible,
    qualityFor,
    // roster panel
    rosterOpen,
    setRosterOpen,
    toggleRoster: () => setRosterOpen((open) => !open),
    locallyPinnedIds,
    toggleLocalPin: (participantId) =>
      setLocallyPinnedIds((prev) =>
        prev.includes(participantId)
          ? prev.filter((id) => id !== participantId)
          : [...prev, participantId]
      ),
    // your own tile: floats bottom right unless it is already on screen
    showSelfView:
      !!localParticipantId &&
      canPublish(localParticipantId) &&
      !visibleIdSet.has(localParticipantId),
    // pagination
    page: safePage,
    pageCount,
    pageSize,
    setPage,
    nextPage,
    prevPage,
    // speaker awareness
    isSpeakerOffScreen,
    jumpToSpeaker,
    totalCount: orderedIds.length,
  };

  return (
    <LargeRoomContext.Provider value={value}>
      {children}
    </LargeRoomContext.Provider>
  );
};
