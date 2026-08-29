import React from "react";
import useIsMobile from "../hooks/useIsMobile";
import { LargeRoomProvider, useLargeRoom } from "./LargeRoomContext";
import ParticipantStreamManager from "./ParticipantStreamManager";
import LargeRoomControls from "./LargeRoomControls";
import LargeRoomGrid from "./LargeRoomGrid";
import LargeRoomTile from "./LargeRoomTile";
import ParticipantRoster from "./ParticipantRoster";
import { LAYOUTS } from "./constants";

/**
 * One manager per participant, rendered outside the grid so it survives page
 * changes. This is what pauses the video of someone we are not showing while
 * keeping them audible.
 */
const StreamManagers = () => {
  const { orderedIds } = useLargeRoom();

  return (
    <>
      {orderedIds.map((participantId) => (
        <ParticipantStreamManager
          key={`manager_${participantId}`}
          participantId={participantId}
        />
      ))}
    </>
  );
};

// Your own tile: never paused, and kept out of the pages so a page shows 9
// other people instead of 8 plus yourself.
const SelfView = () => {
  const { showSelfView, localParticipantId } = useLargeRoom();

  if (!showSelfView || !localParticipantId) return null;

  return (
    <div className="absolute bottom-3 right-3 z-20 h-20 w-32 md:h-28 md:w-44 xl:h-36 xl:w-56 rounded-lg overflow-hidden shadow-lg">
      <LargeRoomTile participantId={localParticipantId} />
    </div>
  );
};

const LargeRoomBody = ({ isMobile }) => {
  const { layout, mainId, gridIds } = useLargeRoom();

  if (layout === LAYOUTS.SPOTLIGHT) {
    return (
      <div className="relative flex flex-1 items-center justify-center p-2 overflow-hidden">
        <SelfView />
        <div className="h-full w-full max-w-6xl">
          {mainId ? (
            <LargeRoomTile participantId={mainId} />
          ) : null}
        </div>
      </div>
    );
  }

  if (layout === LAYOUTS.SIDEBAR) {
    return (
      <div className="relative flex flex-1 flex-col md:flex-row p-2 gap-2 overflow-hidden">
        <SelfView />
        <div className="flex flex-1 overflow-hidden">
          {mainId ? (
            <LargeRoomTile participantId={mainId} />
          ) : null}
        </div>
        {gridIds.length ? (
          <div className="flex h-32 md:h-auto">
            <LargeRoomGrid isMobile={isMobile} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 p-2 overflow-hidden">
      <LargeRoomGrid isMobile={isMobile} />
      <SelfView />
    </div>
  );
};

const LargeRoomContent = ({ audioOnly }) => {
  const isMobile = useIsMobile();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <StreamManagers />
      {audioOnly ? null : (
        <>
          <LargeRoomControls />
          <LargeRoomBody isMobile={isMobile} />
          <ParticipantRoster />
        </>
      )}
    </div>
  );
};

/**
 * Drop-in replacement for the plain participant view, implementing
 * https://docs.videosdk.live/react/guide/best-practices/handle-large-rooms
 *
 * @param isPresenting - someone is screen sharing, so fewer tiles are shown.
 * @param audioOnly    - the screen share owns the viewport (mobile): keep audio
 *                       alive but render no tiles.
 */
const LargeRoomView = ({ isPresenting, audioOnly }) => {
  return (
    <LargeRoomProvider isPresenting={isPresenting}>
      <LargeRoomContent audioOnly={audioOnly} />
    </LargeRoomProvider>
  );
};

export default LargeRoomView;
