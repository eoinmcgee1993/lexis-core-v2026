#!/usr/bin/env python3
"""
LEXIS voice-service — offline speech generation with ChatTTS.

Not part of the live tutoring path (that's OpenAI Realtime, see backend/app.mjs).
This is a standalone pipeline for pre-generating narration — avatar intro clips,
marketing voiceover, etc. — using a cloned "Lexis" speaker embedding.

Usage:
    python generate_speech.py --text "Hello! [laugh] I'm Lexis, your English tutor."
    python generate_speech.py --text "..." --speaker speaker_lexis.pt
    python generate_speech.py --text "..." --save-speaker speaker_lexis.pt
"""
import argparse
import sys

import torch
import torchaudio
import ChatTTS


def build_chat() -> "ChatTTS.Chat":
    chat = ChatTTS.Chat()
    if not chat.load(compile=False):  # downloads/prepares model weights
        print("ERROR: ChatTTS failed to load model weights.", file=sys.stderr)
        sys.exit(1)
    return chat


def resolve_speaker(chat: "ChatTTS.Chat", speaker_path: str | None) -> torch.Tensor:
    """Load a saved Lexis speaker embedding, or sample a fresh random one."""
    if speaker_path:
        return torch.load(speaker_path)
    return chat.sample_random_speaker()


def synthesize(
    text: str,
    out_path: str,
    speaker_path: str | None = None,
    save_speaker_path: str | None = None,
    temperature: float = 0.15,
    top_p: float = 0.7,
    top_k: int = 20,
    sample_rate: int = 24000,
) -> None:
    chat = build_chat()
    spk_emb = resolve_speaker(chat, speaker_path)

    if save_speaker_path:
        torch.save(spk_emb, save_speaker_path)
        print(f"Saved speaker embedding to {save_speaker_path}")

    params_infer_code = ChatTTS.Chat.InferCodeParams(
        spk_emb=spk_emb,
        temperature=temperature,  # low temp for stable pitch
        top_P=top_p,
        top_K=top_k,
    )

    # skip_refine_text=True preserves prosody tags like [laugh], [uv_break], [lbreak]
    wavs = chat.infer(
        text,
        skip_refine_text=True,
        params_infer_code=params_infer_code,
    )

    audio_tensor = torch.from_numpy(wavs[0])
    if audio_tensor.ndim == 1:
        audio_tensor = audio_tensor.unsqueeze(0)

    torchaudio.save(out_path, audio_tensor, sample_rate)
    print(f"Audio saved to {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate LEXIS narration audio with ChatTTS.")
    parser.add_argument("--text", required=True, help="Text to synthesize (supports [laugh]/[uv_break]/[lbreak] tags).")
    parser.add_argument("--out", default="output.wav", help="Output WAV path (default: output.wav).")
    parser.add_argument("--speaker", default=None, help="Path to a saved speaker .pt to reuse (e.g. speaker_lexis.pt).")
    parser.add_argument("--save-speaker", default=None, help="Path to save the sampled speaker embedding for reuse.")
    parser.add_argument("--temperature", type=float, default=0.15)
    parser.add_argument("--top-p", type=float, default=0.7)
    parser.add_argument("--top-k", type=int, default=20)
    args = parser.parse_args()

    synthesize(
        text=args.text,
        out_path=args.out,
        speaker_path=args.speaker,
        save_speaker_path=args.save_speaker,
        temperature=args.temperature,
        top_p=args.top_p,
        top_k=args.top_k,
    )


if __name__ == "__main__":
    main()
