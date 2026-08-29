import React, { memo } from "react";
import { useMeeting, useParticipant } from "@videosdk.live/react-sdk";
import { XMarkIcon } from "@heroicons/react/24/outline";
import MicOnIcon from "../icons/ParticipantTabPanel/MicOnIcon";
import MicOffIcon from "../icons/ParticipantTabPanel/MicOffIcon";
import VideoCamOnIcon from "../icons/ParticipantTabPanel/VideoCamOnIcon";
import VideoCamOffIcon from "../icons/ParticipantTabPanel/VideoCamOffIcon";
import { nameTructed } from "../utils/helper";
import { useLargeRoom } from "./LargeRoomContext";

const PinButton = ({ active, onClick, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`rounded-md px-2 py-1 text-[11px] font-medium ${
      active
        ? "bg-purple-550 text-white"
        : "bg-gray-650 text-gray-900 hover:bg-gray-600 hover:text-white"
    }`}
  >
    {children}
  </button>
);

const RosterRow = memo(({ participantId }) => {
  const { displayName, isLocal, micOn, webcamOn, pinState, pin, unpin } =
    useParticipant(participantId);
  const { locallyPinnedIds, toggleLocalPin } = useLargeRoom();

  const pinnedForEveryone = !!pinState?.cam;
  const pinnedForMe = locallyPinnedIds.includes(participantId);

  // The SDK's pin() is broadcast to the whole meeting.
  // https://docs.videosdk.live/react/api/sdk-reference/use-participant/methods
  const togglePinForEveryone = async () => {
    try {
      if (pinnedForEveryone) {
        await unpin("CAM");
      } else {
        await pin("CAM");
      }
    } catch (err) {
      console.log("Error in pin/unpin", err);
    }
  };

  return (
    <div className="mx-2 mt-2 rounded-lg bg-gray-700 p-2">
      <div className="flex items-center">
        <div
          className="flex h-9 w-9 items-center justify-center rounded overflow-hidden"
          style={{ color: "#212032", backgroundColor: "#757575" }}
        >
          {displayName?.charAt(0).toUpperCase()}
        </div>

        <p className="ml-2 flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap text-sm text-white">
          {isLocal ? "You" : nameTructed(displayName, 18)}
        </p>

        <div className="p-1">{micOn ? <MicOnIcon /> : <MicOffIcon />}</div>
        <div className="p-1">
          {webcamOn ? <VideoCamOnIcon /> : <VideoCamOffIcon />}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1">
        {isLocal ? null : (
          <PinButton
            active={pinnedForMe}
            onClick={() => toggleLocalPin(participantId)}
            title="Keeps them on your first page. Only you see this."
          >
            {pinnedForMe ? "Unpin for me" : "Pin for me"}
          </PinButton>
        )}
        <PinButton
          active={pinnedForEveryone}
          onClick={togglePinForEveryone}
          title="Uses the SDK pin(), which applies for every participant."
        >
          {pinnedForEveryone ? "Unpin for everyone" : "Pin for everyone"}
        </PinButton>
      </div>
    </div>
  );
});

/**
 * Scrollable roster of everyone in the room, opened from the "N in room" chip.
 * Two kinds of pin: "for me" is local app state, "for everyone" is the SDK's
 * pin() and applies to every participant.
 */
const ParticipantRoster = () => {
  const { rosterOpen, setRosterOpen, orderedIds } = useLargeRoom();
  const { participants } = useMeeting();

  return (
    <>
      {rosterOpen ? (
        <div
          className="absolute inset-0 z-30 bg-black bg-opacity-40"
          onClick={() => setRosterOpen(false)}
        />
      ) : null}

      <div
        className={`absolute inset-y-0 right-0 z-40 flex w-72 xl:w-80 flex-col bg-gray-750 shadow-2xl transition-transform duration-200 ease-out ${
          rosterOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="flex items-center justify-between p-3"
          style={{ borderBottom: "1px solid #70707033" }}
        >
          <p className="text-base font-bold text-white">
            {`Participants (${participants.size})`}
          </p>
          <button
            onClick={() => setRosterOpen(false)}
            className="rounded-full p-1 hover:bg-gray-650"
          >
            <XMarkIcon className="text-white" style={{ height: 18, width: 18 }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-3">
          {orderedIds.map((participantId) => (
            <RosterRow key={`roster_${participantId}`} participantId={participantId} />
          ))}
        </div>
      </div>
    </>
  );
};

export default ParticipantRoster;
