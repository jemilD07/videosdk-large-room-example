/**
 * Configuration for the "Handle Large Rooms" best practices.
 * https://docs.videosdk.live/react/guide/best-practices/handle-large-rooms
 */

// Layouts recommended by the guide: "Switch Between Layouts".
export const LAYOUTS = {
  GRID: "GRID",
  SPOTLIGHT: "SPOTLIGHT",
  SIDEBAR: "SIDEBAR",
};

// Values accepted by useParticipant().setQuality()
// https://docs.videosdk.live/react/api/sdk-reference/use-participant/methods#setquality
export const QUALITY = {
  HIGH: "high",
  MED: "med",
  LOW: "low",
};

/**
 * "Limit Visible Participants": how many tiles we are willing to render (and
 * therefore consume streams for) at any given time, adapted to screen size.
 */
export const getGridPageSize = ({ layout, isPresenting, isMobile, isTab }) => {
  if (layout === LAYOUTS.SPOTLIGHT) return 0;

  if (layout === LAYOUTS.SIDEBAR) {
    return isMobile ? 3 : isTab ? 4 : 5;
  }

  // GRID
  if (isPresenting) return isMobile ? 2 : 4;
  return isMobile ? 4 : isTab ? 6 : 9;
};

/**
 * "Media Stream Quality Adjustment": the more tiles are on screen, the lower
 * each one of them needs to be. Active speakers are upgraded separately.
 */
export const getGridQuality = (visibleCount) => {
  if (visibleCount <= 3) return QUALITY.HIGH;
  if (visibleCount <= 6) return QUALITY.MED;
  return QUALITY.LOW;
};

// How many past speakers we keep to order the participant list by recency.
export const SPEAKER_HISTORY_SIZE = 24;
