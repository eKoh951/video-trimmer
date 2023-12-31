"use client";
import React, { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

const VideoTrimmer: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(1);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null);
	const messageRef = useRef<HTMLParagraphElement | null>(null);
	
	useEffect(() => {
		setEnd(2);
	}, []);

  const load = async () => {
    setIsLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    setLoaded(true);
    setIsLoading(false);
  };

  const handleStartChange = (value: number) => {
    if (value < end) {
      setStart(value);
    }
  };

  const handleEndChange = (value: number) => {
    if (value > start) {
      setEnd(value);
    }
  };

  const trimVideo = async () => {
    const ffmpeg = ffmpegRef.current;
    const videoData = await fetch("/videos/sample.mp4").then((response) =>
      response.arrayBuffer()
    );
    await ffmpeg.writeFile("input.mp4", new Uint8Array(videoData));
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-ss",
      String(start),
      "-to",
      String(end),
      "output.mp4",
    ]);
    const trimmedData = (await ffmpeg.readFile("output.mp4")) as any;
    const blob = new Blob([trimmedData.buffer], { type: "video/mp4" });
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(blob);
    }
  };

  return loaded ? (
    <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
      <video
        ref={videoRef}
        src="/videos/sample.mp4"
        controls
        onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
			></video>
			<p>End time has to be bigger than Start time</p>
      <br />
      <label>Start time: </label>
      <input
        type="range"
        min="0"
        max={videoDuration.toString()}
        value={start.toString()}
        onChange={(e) => handleStartChange(Number(e.target.value))}
      />
      <br />
      <label>End time: </label>
      <input
        type="range"
        min="1"
        max={videoDuration.toString()}
        value={end.toString()}
        onChange={(e) => handleEndChange(Number(e.target.value))}
      />
      <br />
      <button
        onClick={trimVideo}
        className="bg-green-500 hover:bg-green-700 text-white py-3 px-6 rounded"
      >
        Trim Video
      </button>
      <p ref={messageRef}></p>
    </div>
  ) : (
    <button
      className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex items-center bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
      onClick={load}
    >
      Load ffmpeg-core
      {isLoading && (
        <span className="animate-spin ml-3">
          <svg
            viewBox="0 0 1024 1024"
            focusable="false"
            data-icon="loading"
            width="1em"
            height="1em"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
          </svg>
        </span>
      )}
    </button>
  );
};

export default VideoTrimmer;
