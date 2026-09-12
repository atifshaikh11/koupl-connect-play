import type { Player } from "./types";

export type ShareResult = {
  gameName: string;
  players: [Player, Player];
  scores: [number, number];
  headline: string;
  scored: boolean;
};

function drawCentered(ctx: CanvasRenderingContext2D, text: string, y: number, maxWidth = 900) {
  ctx.fillText(text, 540, y, maxWidth);
}

export async function createResultCard(result: ShareResult) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Result cards aren't supported on this device.");

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#221c2b");
  gradient.addColorStop(0.58, "#3b2634");
  gradient.addColorStop(1, "#f06f61");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.beginPath(); ctx.arc(920, 180, 270, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(120, 1700, 340, 0, Math.PI * 2); ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd8cf";
  ctx.font = "700 42px system-ui, sans-serif";
  drawCentered(ctx, "KOUPL", 180);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 82px system-ui, sans-serif";
  drawCentered(ctx, result.gameName, 390);
  ctx.font = "700 68px system-ui, sans-serif";
  drawCentered(ctx, result.headline, 590);

  const names = `${result.players[0].name}  ×  ${result.players[1].name}`;
  ctx.fillStyle = "#ffd8cf";
  ctx.font = "600 42px system-ui, sans-serif";
  drawCentered(ctx, names, 760);
  if (result.scored) {
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.beginPath(); ctx.roundRect(130, 870, 820, 360, 54); ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 150px system-ui, sans-serif";
    drawCentered(ctx, `${result.scores[0]}  —  ${result.scores[1]}`, 1100);
  }
  ctx.fillStyle = "rgba(255,255,255,.82)";
  ctx.font = "500 34px system-ui, sans-serif";
  drawCentered(ctx, "A little moment we played together", 1540);
  ctx.font = "700 46px system-ui, sans-serif";
  drawCentered(ctx, "koupl", 1740);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Couldn't create the result card.")), "image/png"),
  );
  return new File([blob], `koupl-${result.gameName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`, { type: "image/png" });
}

export async function shareResultCard(result: ShareResult) {
  const file = await createResultCard(result);
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({ title: `${result.gameName} on Koupl`, text: result.headline, files: [file] });
    return "shared" as const;
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded" as const;
}