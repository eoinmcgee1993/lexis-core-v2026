# LEXIS voice-service

Offline speech generation for the "Lexis" avatar, built on [ChatTTS](https://github.com/2noise/ChatTTS).

**This is not part of the live tutoring path.** The live tutor (`backend/app.mjs`) uses
OpenAI's Realtime API over WebRTC for sub-300ms voice — ChatTTS is a batch model and isn't
suited to that latency budget. This service is for pre-generating narration: avatar intro
clips, marketing voiceover, and similar assets using a cloned Lexis speaker.

## Setup

```bash
cd voice-service
python3 -m venv .venv && source .venv/bin/activate
pip install --upgrade -r requirements.txt
```

`pydub` (used for any downstream MP3/format conversion) needs system `ffmpeg`:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

## Usage

Sample a fresh random speaker and generate a clip, saving the embedding for reuse:

```bash
python generate_speech.py \
  --text "Hello! [laugh] I'm Lexis, [uv_break] your English tutor. [lbreak] Let's learn today!" \
  --out test_lexis.wav \
  --save-speaker speaker_lexis.pt
```

Reuse a saved Lexis voice on later runs:

```bash
python generate_speech.py --text "..." --speaker speaker_lexis.pt --out clip.wav
```

Prosody tags (`[laugh]`, `[uv_break]`, `[lbreak]`, etc.) are preserved by running inference
with `skip_refine_text=True` — don't let ChatTTS's text refiner strip them out.

`speaker_lexis.pt` and generated `.wav`/`.mp3` files are git-ignored — treat the speaker
embedding as an asset to store outside the repo (or in object storage) once you're happy
with the voice, not as source-controlled output.

## Open items (status as of this writeup)

- **3D avatar file (`.glb`)**: not yet generated — plan is MetaPerson Creator or Ready
  Player Me.
- **Cloud hosting for generation**: RunPod recommended over self-managed
  Nginx/SSL for a GPU box running ChatTTS.
