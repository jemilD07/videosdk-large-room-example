import React from "react";
import LargeRoomTile from "./LargeRoomTile";
import { useLargeRoom } from "./LargeRoomContext";
import { LAYOUTS } from "./constants";

const getPerRow = (count, isMobile) => {
  if (isMobile) return count < 3 ? 1 : 2;
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
};

/**
 * Renders only the current page. Nobody else is mounted here, which is what
 * keeps a large room cheap.
 */
const LargeRoomGrid = ({ isMobile }) => {
  const { gridIds, layout } = useLargeRoom();

  if (!gridIds.length) return null;

  const isStrip = layout === LAYOUTS.SIDEBAR;

  if (isStrip) {
    return (
      <div className="flex flex-row md:flex-col gap-2 h-full md:h-full w-full md:w-52 xl:w-64 overflow-hidden p-1">
        {gridIds.map((participantId) => (
          <div
            key={`strip_${participantId}`}
            className="flex flex-1 items-center justify-center overflow-hidden"
          >
            <LargeRoomTile participantId={participantId} />
          </div>
        ))}
      </div>
    );
  }

  const perRow = getPerRow(gridIds.length, isMobile);
  const rows = Math.ceil(gridIds.length / perRow);

  return (
    <div className="flex flex-col w-full h-full">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={`row_${rowIndex}`}
          className="flex flex-1 items-center justify-center"
        >
          {gridIds
            .slice(rowIndex * perRow, (rowIndex + 1) * perRow)
            .map((participantId) => (
              <div
                key={`tile_${participantId}`}
                className="flex flex-1 items-center justify-center h-full w-full overflow-hidden p-1"
              >
                <LargeRoomTile participantId={participantId} />
              </div>
            ))}
        </div>
      ))}
    </div>
  );
};

export default LargeRoomGrid;
