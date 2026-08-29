import React, { memo } from "react";
import { useParticipant, VideoPlayer } from "@videosdk.live/react-sdk";
import MicOffSmallIcon from "../icons/MicOffSmallIcon";
import SpeakerIcon from "../icons/SpeakerIcon";
import { nameTructed } from "../utils/common";
import { CornerDisplayStats } from "../components/ParticipantView";

/**
 * A deliberately light tile: video, name, mic state, speaking ring.
 * The stock example polls getVideoStats/getAudioStats every 500ms per tile,
 * which does not scale, so that runs on your own tile only.
 */
const LargeRoomTile = ({ participantId }) => {
  const { displayName, webcamOn, micOn, isLocal, isActiveSpeaker } =
    useParticipant(participantId);

  return (
    <div
      className="h-full w-full bg-gray-750 relative overflow-hidden rounded-lg video-cover"
      style={{
        border: isActiveSpeaker ? "2px solid #5568FE" : "2px solid transparent",
      }}
    >
      {webcamOn ? (
        <VideoPlayer
          participantId={participantId}
          type="video"
          containerStyle={{ height: "100%", width: "100%" }}
          className="h-full"
          classNameVideo="h-full"
          videoStyle={{}}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <div className="z-10 flex items-center justify-center rounded-full bg-gray-800 2xl:h-[92px] h-[52px] 2xl:w-[92px] w-[52px]">
            <p className="text-2xl text-white">
              {String(displayName).charAt(0).toUpperCase()}
            </p>
          </div>
        </div>
      )}

      {/* VideoSDK's default network indicator, on your own tile only. */}
      {isLocal ? (
        <CornerDisplayStats participantId={participantId} isPresenting={false} />
      ) : null}

      <div
        className="absolute bottom-2 left-2 rounded-md flex items-center justify-center p-2"
        style={{ backgroundColor: "#00000066" }}
      >
        {!micOn ? (
          <MicOffSmallIcon fillcolor="white" />
        ) : isActiveSpeaker ? (
          <SpeakerIcon />
        ) : null}
        <p className="text-sm text-white ml-0.5">
          {isLocal ? "You" : nameTructed(displayName, 20)}
        </p>
      </div>
    </div>
  );
};

export default memo(
  LargeRoomTile,
  (prev, next) => prev.participantId === next.participantId
);
