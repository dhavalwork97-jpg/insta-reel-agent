import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
}

export type Template = "reels-crop" | "zoom-pulse" | "glitch" | "beat-sync";

export interface EditOptions {
  template: Template;
  inputFile: File;
  onProgress?: (progress: number) => void;
}

export async function editVideo({
  template,
  inputFile,
  onProgress,
}: EditOptions): Promise<Blob> {
  const ff = await loadFFmpeg();

  ff.on("progress", ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  const inputData = await fetchFile(inputFile);
  await ff.writeFile("input.mp4", inputData);

  let command: string[] = [];

  switch (template) {
    case "reels-crop":
      // Crop to 9:16, scale to 1080x1920
      command = [
        "-i", "input.mp4",
        "-vf", "crop=ih*9/16:ih,scale=1080:1920,setsar=1",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "output.mp4",
      ];
      break;

    case "zoom-pulse":
      // 9:16 crop + animated zoom pulse every 2s
      command = [
        "-i", "input.mp4",
        "-vf",
        "crop=ih*9/16:ih,scale=1080:1920,setsar=1,zoompan=z='if(eq(mod(on\\,60)\\,0)\\,1.1\\,max(pzoom-0.002\\,1))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "output.mp4",
      ];
      break;

    case "glitch":
      // 9:16 crop + RGB split glitch effect
      command = [
        "-i", "input.mp4",
        "-vf",
        "crop=ih*9/16:ih,scale=1080:1920,setsar=1,rgbashift=rh=3:bh=-3,hue=s=1.4",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "output.mp4",
      ];
      break;

    case "beat-sync":
      // 9:16 crop + contrast/brightness flash effect simulating beat drops
      command = [
        "-i", "input.mp4",
        "-vf",
        "crop=ih*9/16:ih,scale=1080:1920,setsar=1,eq=contrast='1+0.3*sin(2*PI*t*2)':brightness='0.05*sin(2*PI*t*2)'",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "output.mp4",
      ];
      break;
  }

  await ff.exec(command);
  const data = await ff.readFile("output.mp4");
  return new Blob([data], { type: "video/mp4" });
}

export async function extractFrame(file: File): Promise<string> {
  const ff = await loadFFmpeg();
  const inputData = await fetchFile(file);
  await ff.writeFile("frame_input.mp4", inputData);

  await ff.exec([
    "-i", "frame_input.mp4",
    "-vframes", "1",
    "-ss", "00:00:01",
    "-vf", "scale=640:-1",
    "-q:v", "5",
    "frame.jpg",
  ]);

  const frameData = await ff.readFile("frame.jpg");
  const blob = new Blob([frameData], { type: "image/jpeg" });

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}
