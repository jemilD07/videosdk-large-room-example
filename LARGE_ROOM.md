# Large Room Demo

An implementation of every recommendation in VideoSDK's
[Handle Large Rooms](https://docs.videosdk.live/react/guide/best-practices/handle-large-rooms)
guide, built on top of the official
[videosdk-rtc-react-sdk-example](https://github.com/videosdk-live/videosdk-rtc-react-sdk-example).

All large room logic lives in [`src/largeRoom/`](src/largeRoom). Everything else -
joining screen, bottom bar, chat, screen share - is the stock example.

## What the guide asks for, and where it happens

| Guide recommendation | Implementation |
| --- | --- |
| **Limit visible participants**, adapted to screen size | `getGridPageSize()` in [`constants.js`](src/largeRoom/constants.js) - 4 on mobile, 6 on tablet, 9 on desktop. Only the current page is mounted ([`LargeRoomGrid.js`](src/largeRoom/LargeRoomGrid.js)). |
| **Pagination** for the rest | Pager in [`LargeRoomContext.js`](src/largeRoom/LargeRoomContext.js). Your own tile floats bottom right (`SelfView`) instead of taking a slot, so a page shows 9 *other* people. |
| **Switch between layouts** | Grid / Spotlight / Sidebar - `LAYOUTS` in [`constants.js`](src/largeRoom/constants.js), switched from [`LargeRoomControls.js`](src/largeRoom/LargeRoomControls.js). |
| **Prioritize active speakers** via `onSpeakerChanged()` | The event fires with one id at a time, so we keep our own recency list. A speaker who was **off screen** is promoted to the first tile; one already visible keeps their slot, so the grid does not reshuffle constantly. Order: `pinned -> off-screen speaker -> you -> recent speakers -> rest`. |
| **Pause streams for non-visible participants** | `WebcamStreamController` in [`ParticipantStreamManager.js`](src/largeRoom/ParticipantStreamManager.js) calls `useStream().pause()` when a participant leaves the visible set. |
| **Resume streams when visible** | Same component calls `resume()` when they return. |
| **High quality for active speakers** | `qualityFor()` returns `"high"` for the active speaker and the spotlight/sidebar main frame. |
| **Lower quality for non-speaking participants** | `getGridQuality()`: `"high"` for <= 3 tiles, `"med"` for <= 6, `"low"` beyond. Sidebar thumbnails are always `"low"`. Applied with `useParticipant().setQuality()`. |

## How it is wired

```
MeetingContainer
└── LargeRoomView                     (src/largeRoom/LargeRoomView.js)
    └── LargeRoomProvider             ordering, pagination, visibility, quality
        ├── StreamManagers            one per participant IN THE ROOM
        │   └── ParticipantStreamManager
        │       ├── ParticipantAudio        audio is never paused
        │       └── WebcamStreamController  pause() / resume() on visibility
        ├── LargeRoomControls         layout switch, pager, roster button
        ├── LargeRoomBody             grid / spotlight / sidebar
        │   ├── LargeRoomTile         light tile: video, name, mic, speaking ring
        │   └── SelfView              your own tile, floating bottom right
        └── ParticipantRoster         roster with mic/cam status and pins
```

Three decisions worth knowing:

- **Only `SEND_AND_RECV` participants get a tile.** `RECV_ONLY` and
  `SIGNALLING_ONLY` participants publish no media, so giving them a page slot
  would waste it on an empty tile. `onParticipantModeChanged` re-runs the check
  when someone switches mode.

- **Audio is decoupled from the grid.** A stream manager is mounted for *every*
  participant, not just visible ones, so someone on page 3 is still heard.
  Only video is paused.
- **The tile is thin.** The stock example polls `getVideoStats()`/`getAudioStats()`
  every 500 ms *per tile*, which does not scale. That indicator runs on your own
  tile only.
- **`multiStream: true`** is set on the `MeetingProvider` in
  [`src/App.js`](src/App.js). `setQuality()` does nothing without it.

## Two kinds of pin

The roster (opened from the `N in room` button) offers **Pin for me** and
**Pin for everyone**. They are different mechanisms:

- **Pin for everyone** is the SDK's `useParticipant().pin("CAM")`. It is
  broadcast: it lands in `pinnedParticipants` for every participant and fires
  `onPinStateChanged` with `pinnedBy`.
- **Pin for me** has no SDK equivalent - there is no local-only pin - so it is
  app state (`locallyPinnedIds`) that reorders nothing but your own grid.

## Why manual pause/resume, when `<VideoPlayer>` already adapts

VideoSDK's `<VideoPlayer type="video">` wraps itself in `withAdaptiveObservers`,
which attaches an IntersectionObserver that pauses/resumes the stream as the
tile enters and leaves the viewport, plus a ResizeObserver that calls
`setViewPort()`.

That only works on a **mounted DOM element**. With pagination a participant on
page 3 has no tile, so there is no observer, and unmounting a tile disconnects
the observer without pausing. `WebcamStreamController` covers exactly that gap.

Because both act on the same stream, the controller keys its effect on the page
change only, never on `paused`. Reconciling against `paused` would let the two
mechanisms undo each other in a loop.

If you replaced the pager with one long scrolling list, you could delete it and
rely on the built-in observers. See also
[Scalability for large meetings](https://docs.videosdk.live/react/guide/video-and-audio-calling-api-sdk/scalability/scalability-guide-large-meetings)
for `enableAdaptiveSubscription()`, the server-side alternative to the manual
`setQuality()` tiers used here.

## Running it

```bash
npm install
cp .env.example .env      # then set REACT_APP_VIDEOSDK_TOKEN
npm start
```

> Use plain `npm install`. With `--legacy-peer-deps` npm hoists a mismatched
> `ajv` / `ajv-keywords` pair and react-scripts fails to start.

Open the same meeting ID in several tabs to add participants, then page through
them and switch layouts. To confirm streams really are being paused, open
`chrome://webrtc-internals` and watch inbound video tracks stop and restart as
participants move on and off the page.
