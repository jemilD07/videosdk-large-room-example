import React, { memo, useEffect, useRef } from "react";
import { useParticipant, useStream } from "@videosdk.live/react-sdk";
import { useMeetingAppContext } from "../MeetingAppContextDef";
import {
  connectTrackToRelay,
  shouldUseAudioRelay,
} from "../utils/audioOutputRelay";
import { useLargeRoom } from "./LargeRoomContext";

// Audio is decoupled from the grid: someone on another page must still be
// heard, so audio is never paused.
const ParticipantAudio = memo(({ participantId }) => {
  const { micStream, micOn, isLocal } = useParticipant(participantId);
  const { selectedSpeaker } = useMeetingAppContext();
  const micRef = useRef(null);

  useEffect(() => {
    const isFirefox =
      navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    if (micRef.current && !isFirefox && selectedSpeaker?.id) {
      try {
        const result = micRef.current.setSinkId(selectedSpeaker.id);
        if (result && typeof result.catch === "function") {
          result.catch((err) =>
            console.log("Setting speaker device failed", err)
          );
        }
      } catch (err) {
        console.log("Setting speaker device failed", err);
      }
    }
  }, [selectedSpeaker?.id]);

  useEffect(() => {
    if (!micRef.current) return;

    if (micOn && micStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(micStream.track);
      micRef.current.srcObject = mediaStream;
      micRef.current
        .play()
        .catch((error) => console.error("micRef.current.play() failed", error));

      if (!isLocal) {
        return connectTrackToRelay(micStream.track);
      }
    } else {
      micRef.current.srcObject = null;
    }
  }, [micStream, micOn, isLocal]);

  return <audio ref={micRef} autoPlay muted={isLocal || shouldUseAudioRelay()} />;
});

/**
 * Pauses a remote webcam stream while its participant is off the current page,
 * and resumes it when they come back. One instance owns one stream.
 * https://docs.videosdk.live/react/api/sdk-reference/use-stream/methods
 */
const WebcamStreamController = memo(({ streamId, visible }) => {
  const { paused, pause, resume } = useStream(streamId);

  // Guards against overlapping calls when pages are flipped quickly.
  const inFlightRef = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    // Deliberately keyed on `visible` only, not on `paused`. VideoSDK's own
    // <VideoPlayer> attaches an IntersectionObserver that also pauses/resumes
    // this stream; reconciling against `paused` here would let the two fight
    // in a loop. We act on the page change and leave the observer alone.
    if (visible === !pausedRef.current) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    (async () => {
      try {
        if (visible) {
          await resume();
        } else {
          await pause();
        }
      } catch (err) {
        console.log(
          `Failed to ${visible ? "resume" : "pause"} stream ${streamId}`,
          err
        );
      } finally {
        inFlightRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, streamId]);

  return null;
});

/**
 * Mounted once per participant in the meeting, including those with no tile on
 * screen. That is the point: a participant on page 3 has no VideoPlayer, so
 * nothing else is left to pause their stream.
 */
const ParticipantStreamManager = ({ participantId }) => {
  const { isVisible, qualityFor } = useLargeRoom();
  const { webcamStream, isLocal, setQuality } = useParticipant(participantId);

  const visible = isVisible(participantId);
  const quality = qualityFor(participantId);

  // setQuality needs multiStream: true on the MeetingProvider (see App.js).
  useEffect(() => {
    if (isLocal || !webcamStream || !visible) return;
    try {
      const result = setQuality(quality);
      if (result && typeof result.catch === "function") {
        result.catch((err) => console.log("Error in setQuality", err));
      }
    } catch (err) {
      console.log("Error in setQuality", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, visible, webcamStream?.id, isLocal]);

  return (
    <>
      <ParticipantAudio participantId={participantId} />
      {!isLocal && webcamStream ? (
        <WebcamStreamController streamId={webcamStream.id} visible={visible} />
      ) : null}
    </>
  );
};

export default memo(
  ParticipantStreamManager,
  (prev, next) => prev.participantId === next.participantId
);
