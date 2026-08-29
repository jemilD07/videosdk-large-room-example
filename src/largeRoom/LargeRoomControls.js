import React from "react";
import { useParticipant } from "@videosdk.live/react-sdk";
import { useLargeRoom } from "./LargeRoomContext";
import { LAYOUTS } from "./constants";
import { nameTructed } from "../utils/common";

const LAYOUT_LABELS = [
  { key: LAYOUTS.GRID, label: "Grid" },
  { key: LAYOUTS.SPOTLIGHT, label: "Spotlight" },
  { key: LAYOUTS.SIDEBAR, label: "Sidebar" },
];

const SpeakingElsewherePill = () => {
  const { activeSpeakerId, jumpToSpeaker } = useLargeRoom();
  const { displayName } = useParticipant(activeSpeakerId);

  return (
    <button
      onClick={jumpToSpeaker}
      className="flex items-center rounded-md bg-purple-550 px-3 py-1.5 hover:bg-purple-600"
    >
      <p className="text-xs text-white font-medium">
        {`${nameTructed(displayName, 14)} is speaking - jump to them`}
      </p>
    </button>
  );
};

// Layout switch, pager, and the roster button.

const LargeRoomControls = () => {
  const {
    layout,
    setLayout,
    page,
    pageCount,
    nextPage,
    prevPage,
    totalCount,
    isSpeakerOffScreen,
    rosterOpen,
    toggleRoster,
  } = useLargeRoom();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-gray-750">
      <div className="flex items-center gap-1">
        {LAYOUT_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLayout(key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              layout === key
                ? "bg-purple-550 text-white"
                : "bg-gray-700 text-gray-900 hover:bg-gray-650"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isSpeakerOffScreen ? <SpeakingElsewherePill /> : null}

        {/* Opens the roster panel. */}
        <button
          onClick={toggleRoster}
          title="Show everyone in the room"
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            rosterOpen
              ? "bg-purple-550 text-white"
              : "bg-gray-700 text-white hover:bg-gray-650"
          }`}
        >
          {`${totalCount} in room`}
        </button>

        {layout !== LAYOUTS.SPOTLIGHT ? (
          <div className="flex items-center gap-1">
            <button
              onClick={prevPage}
              disabled={page === 0}
              className="rounded-md bg-gray-700 px-2.5 py-1.5 text-xs text-white disabled:opacity-40"
            >
              Prev
            </button>
            <p className="text-xs text-white w-14 text-center">
              {`${page + 1} / ${pageCount}`}
            </p>
            <button
              onClick={nextPage}
              disabled={page >= pageCount - 1}
              className="rounded-md bg-gray-700 px-2.5 py-1.5 text-xs text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default LargeRoomControls;
