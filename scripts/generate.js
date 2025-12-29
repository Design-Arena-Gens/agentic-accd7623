#!/usr/bin/env node
const { execSync } = require("node:child_process");
const { writeFileSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");

const outDir = join(process.cwd(), "assets");
const imageDir = join(outDir, "images");
const audioDir = join(outDir, "audio");
const videoDir = join(outDir, "video");
const metaDir = join(outDir, "meta");

[outDir, imageDir, audioDir, videoDir, metaDir].forEach((dir) =>
  mkdirSync(dir, { recursive: true })
);

const project = {
  topic:
    "The Unsettling Disappearance of Dorothy Forstein, the Philadelphia Socialite Who Vanished Without a Trace in 1949",
  uniqueness:
    "Dorothy Forstein's vanishing sits between domestic mystery and political paranoia, yet it rarely appears in mainstream true-crime media despite the eerie eyewitness account from her daughter.",
};

const scenes = [
  {
    title: "Hook",
    visual:
      "Rain-slicked 1940s Philadelphia street at night, glowing neon, looming rowhouses, noir lighting, cinematic realism, muted teals and ambers",
    prompt:
      "A cinematic, rain-soaked Philadelphia street in 1949 with glowing neon lights reflecting on wet cobblestones, dark rowhouses looming, moody noir lighting, realistic style, 35mm film grain, subtle teal and amber palette",
    narration:
      "Philadelphia, 1949. It’s past midnight when a respected socialite named Dorothy Forstein opens her front door—and steps into a mystery the city still refuses to solve.",
  },
  {
    title: "Shadowed Past",
    visual:
      "Interior living room lit by streetlamp glow, silhouette of worried woman, shadows hinting at intruder, vintage furnishings, deep shadows, dramatic contrast",
    prompt:
      "Inside a 1940s Philadelphia living room with vintage furnishings, one worried woman in silhouette lit by streetlamp glow, distant shadow hinting at an unseen intruder, dramatic chiaroscuro, cinematic realism",
    narration:
      "Dorothy had already survived one brutal home invasion. Police brushed it off as a random robbery, but she confided to friends she felt watched, catalogued, like someone had marked her.",
  },
  {
    title: "Night of Disappearance",
    visual:
      "Staircase scene with young girl peeking through banister, tall figure carrying woman over shoulder, motion blur, suspenseful cinematic frame, dark warm tones",
    prompt:
      "A tense cinematic frame of a young girl peeking through a staircase banister at a tall figure carrying a woman over his shoulder, 1940s interior, motion blur, warm yet dark tones, dramatic lighting, realistic style",
    narration:
      "On September tenth, Dorothy tucked her kids into bed. Hours later, her ten-year-old daughter roused to the sound of footsteps—then watched a stranger drape Dorothy over his shoulder and whisper, 'Go back to sleep, dear.'",
  },
  {
    title: "Sudden Silence",
    visual:
      "Empty bedroom with overturned phone, purse on vanity untouched, curtains billowing, eerie calm, noir palette",
    prompt:
      "An empty 1940s bedroom with an overturned rotary phone, untouched purse on a vanity, curtains billowing from an open window, eerie calm, noir palette, cinematic realism",
    narration:
      "By dawn, Dorothy was gone. No forced entry. Cash and jewelry untouched. Only a phone knocked off its cradle as if she’d tried to call for help.",
  },
  {
    title: "Political Undertones",
    visual:
      "Newspaper clippings swirling in air, Philadelphia courthouse looming, shadowy figures in suits, smoky atmosphere, sepia tone",
    prompt:
      "A surreal scene of 1940s newspaper clippings swirling before a looming Philadelphia courthouse with shadowy figures in suits, smoky atmosphere, sepia tones, cinematic collage style",
    narration:
      "Her husband, a rising city magistrate with enemies on both sides of Philadelphia politics, begged detectives to dig deeper. Their answer? Dorothy must have simply run off.",
  },
  {
    title: "Lingering Witness",
    visual:
      "Close-up of young girl's tearful eyes reflecting doorway, ghostly overlay of missing mother, dreamy blur, emotional realism",
    prompt:
      "A close-up of a young girl’s tearful eyes reflecting a dark doorway, ghostly overlay of a missing mother, dreamy depth of field, emotional realism, cool dusk tones",
    narration:
      "Years later, that daughter—still haunted—swore the man who took Dorothy spoke gently, like a family friend. She never saw his face. Neither did anyone else.",
  },
  {
    title: "Open Ending",
    visual:
      "Fade into empty city skyline at dawn, mist rising, question mark in clouds subtly formed, cinematic wide shot",
    prompt:
      "A cinematic wide shot of a 1940s Philadelphia skyline at dawn with mist rising and clouds subtly forming a question mark, ethereal lighting, soft focus, evocative realism",
    narration:
      "No ransom, no body, no goodbye. Just whispers that Dorothy knew something she wasn’t meant to see. So—was this a jealous rival, political payback, or a ghost from that first break-in? What do you believe happened on that rain-bright night?",
  },
];

const scriptText = [
  `TITLE: VANISHED IN THE NIGHT — THE DOROTHY FORSTEIN CASE`,
  ``,
  `HOOK:`,
  scenes[0].narration,
  ``,
  `STORY BEATS:`,
  ...scenes.slice(1).map((scene, index) => `${index + 1}. ${scene.narration}`),
  ``,
  `OUTRO:`,
  `"What secret was she carrying, and who wanted it buried with her?"`,
].join("\n");

writeFileSync(join(metaDir, "script.txt"), scriptText, "utf8");

const promptText = scenes
  .map(
    (scene, index) =>
      `Scene ${index + 1}: ${scene.title}\nDescription: ${scene.visual}\nPrompt: ${scene.prompt}\n`
  )
  .join("\n");
writeFileSync(join(metaDir, "image_prompts.txt"), promptText, "utf8");

const musicDuration = scenes.length * 6.5;

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

scenes.forEach((scene, index) => {
  const file = join(audioDir, `scene${index + 1}.wav`);
  const text = scene.narration.replace(/"/g, '\\"');
  run(
    `espeak -v en-us+m3 -s 155 -w "${file}" "${text}"`
  );
});

const concatList = scenes
  .map(
    (_scene, index) => `file '${join(audioDir, `scene${index + 1}.wav`)}'`
  )
  .join("\n");
const concatFile = join(audioDir, "concat_list.txt");
writeFileSync(concatFile, concatList, "utf8");
const voiceover = join(audioDir, "voiceover.wav");
run(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${voiceover}"`);

const durations = scenes.map((_, index) => {
  const file = join(audioDir, `scene${index + 1}.wav`);
  const output = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
  )
    .toString()
    .trim();
  return parseFloat(output);
});

let currentTime = 0;
const srtLines = [];
scenes.forEach((scene, index) => {
  const start = currentTime;
  const duration = durations[index];
  currentTime += duration;
  const end = currentTime;
  const formatTime = (time) => {
    const hrs = Math.floor(time / 3600)
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((time % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    const ms = Math.round((time % 1) * 1000)
      .toString()
      .padStart(3, "0");
    return `${hrs}:${mins}:${secs},${ms}`;
  };

  srtLines.push(`${index + 1}`);
  srtLines.push(`${formatTime(start)} --> ${formatTime(end)}`);
  srtLines.push(scene.narration);
  srtLines.push("");
});

writeFileSync(join(metaDir, "captions.srt"), srtLines.join("\n"), "utf8");

scenes.forEach((scene, index) => {
  const filename = join(imageDir, `scene${(index + 1).toString().padStart(2, "0")}.png`);
  const title = `Scene ${index + 1}: ${scene.title}`;
  const convertCmd = [
    `convert -size 1080x1920`,
    `"gradient:#0f172a-#1f2937"`,
    `-gravity center`,
    `-fill "#e2e8f0"`,
    `-font DejaVu-Sans`,
    `-pointsize 54`,
    `-annotate +0-650 "${title.replace(/"/g, '\\"')}"`,
    `-fill "#f8fafc"`,
    `-pointsize 42`,
    `-annotate +0+200 "${scene.visual.replace(/"/g, '\\"')}"`,
    `"${filename}"`,
  ].join(" ");
  run(convertCmd);
});

const voiceDurationOutput = execSync(
  `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceover}"`
)
  .toString()
  .trim();
const voiceDuration = parseFloat(voiceDurationOutput);
const totalDuration = voiceDuration + 2;

const musicFile = join(audioDir, "music.wav");
run(
  `ffmpeg -y -f lavfi -i "anoisesrc=color=pink:amplitude=0.06" -t ${totalDuration.toFixed(
    2
  )} -af "lowpass=f=800,volume=0.3" "${musicFile}"`
);

const mixedAudio = join(audioDir, "final_audio.wav");
run(
  `ffmpeg -y -i "${voiceover}" -i "${musicFile}" -filter_complex "[0:a]volume=1.6[a0];[1:a]adelay=500|500,volume=0.6[a1];[a0][a1]amix=inputs=2:dropout_transition=2,volume=1.4" -ar 48000 "${mixedAudio}"`
);

const videoScript = join(metaDir, "video_metadata.json");
writeFileSync(
  videoScript,
  JSON.stringify(
    {
      project,
      scenes,
      durations,
      totalDuration,
    },
    null,
    2
  ),
  "utf8"
);

const vfInputs = scenes
  .map((_, index) => {
    const img = join(imageDir, `scene${(index + 1).toString().padStart(2, "0")}.png`);
    const duration = durations[index];
    return `[${index}:v]settb=AVTB,format=rgba,scale=1080:1920,zoompan=z='min(1.2,zoom+0.0015)':d=125:s=1080x1920:fps=30,trim=duration=${duration.toFixed(
      2
    )},setpts=PTS-STARTPTS[v${index}]`;
  })
  .join(";");

const inputs = scenes
  .map(
    (_, index) =>
      `-loop 1 -t ${durations[index].toFixed(2)} -i "${join(
        imageDir,
        `scene${(index + 1).toString().padStart(2, "0")}.png`
      )}"`
  )
  .join(" ");

const concatVideoFilters = scenes
  .map((_, index) => `[v${index}]`)
  .join("");

const subtitleFile = join(metaDir, "captions.srt");
const tempVideo = join(videoDir, "temp_video.mp4");
const finalVideo = join(videoDir, "final_video.mp4");

run(
  `ffmpeg -y ${inputs} -filter_complex "${vfInputs};${concatVideoFilters}concat=n=${scenes.length}:v=1:a=0,format=yuv420p[v]" -map "[v]" -preset veryfast -r 30 "${tempVideo}"`
);

run(
  `ffmpeg -y -i "${tempVideo}" -i "${mixedAudio}" -c:v copy -c:a aac -b:a 192k -shortest "${join(
    videoDir,
    "video_with_audio.mp4"
  )}"`
);

run(
  `ffmpeg -y -i "${join(
    videoDir,
    "video_with_audio.mp4"
  )}" -vf "subtitles=${subtitleFile}" -c:a copy "${finalVideo}"`
);

const thumbnailPrompt = [
  "Title: 'THE WOMAN WHO VANISHED FROM HER OWN HOME'",
  "Visual Prompt: Cinematic portrait of a 1940s woman half-illuminated by doorway light, gloved hand reaching toward viewer, translucent silhouette fading into darkness, teal and amber color grade, bold headline typography reading 'PHILLY'S SHADOW CASE'.",
].join("\n");
writeFileSync(join(metaDir, "thumbnail_prompt.txt"), thumbnailPrompt, "utf8");

const metadata = [
  "YouTube Title: The Socialite Who Vanished from a Locked House | Dorothy Forstein Mystery",
  "",
  "Description:",
  "Philadelphia, 1949. Dorothy Forstein opened her front door—and was never seen again. In 60 cinematic seconds, unravel the political intrigue, whispered threats, and the chilling eyewitness account that still keeps this cold case alive.",
  "",
  "Hashtags:",
  "#DorothyForstein #ColdCase #TrueCrimeMystery #Unsolved #Shorts",
  "",
  "Tags:",
  "Dorothy Forstein, Philadelphia mystery, unsolved disappearance, lesser known cold case, true crime shorts, political coverup, eerie mysteries, noir storytelling",
].join("\n");
writeFileSync(join(metaDir, "distribution_meta.txt"), metadata, "utf8");

console.log("Generation complete.");
