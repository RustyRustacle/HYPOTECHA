import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from "remotion";

const mono =
	"'JetBrains Mono', 'Cascadia Code', 'Consolas', 'SFMono-Regular', monospace";

const sans =
	"'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif";

const C = {
	ink: "#020617",
	inkSoft: "#0b1224",
	grid: "rgba(56, 189, 248, 0.07)",
	primary: "#10b981",
	primarySoft: "rgba(16, 185, 129, 0.25)",
	text: "#f8fafc",
	textMuted: "#94a3b8",
	line: "rgba(148, 163, 184, 0.25)",
	chipBg: "rgba(15, 23, 42, 0.7)",
	chipBorder: "rgba(30, 41, 59, 0.9)",
};

const chipStyles: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 14,
	padding: "12px 22px",
	borderRadius: 9999,
	background: C.chipBg,
	border: `1px solid ${C.chipBorder}`,
	color: C.textMuted,
	fontFamily: mono,
	fontSize: 22,
	fontWeight: 500,
	letterSpacing: 0.4,
};

const segments: {label: string; width: number; color: string}[] = [
	{label: "ENCUMBERED", width: 32, color: "#f59e0b"},
	{label: "AVAILABLE", width: 68, color: "#10b981"},
];

export const HypothecaScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const titleIn = interpolate(frame, [0, 24], [0, 1], {
		extrapolateRight: "clamp",
	});
	const titleY = interpolate(frame, [0, 24], [34, 0], {
		extrapolateRight: "clamp",
	});
	const float = Math.sin(frame / 48) * 12;

	const pulse = interpolate(
		frame % 48,
		[0, 24, 48],
		[0.5, 1, 0.5],
	);

	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(1200px 800px at 24% -10%, #0f2440 0%, ${C.ink} 52%, ${C.ink} 100%)`,
				color: C.text,
				fontFamily: sans,
				overflow: "hidden",
			}}
		>
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
					backgroundSize: "64px 64px",
					maskImage:
						"radial-gradient(ellipse 70% 60% at 50% 42%, black 30%, transparent 75%)",
					WebkitMaskImage:
						"radial-gradient(ellipse 70% 60% at 50% 42%, black 30%, transparent 75%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					left: "62%",
					top: "50%",
					width: 900,
					height: 900,
					borderRadius: "50%",
					background: `radial-gradient(circle, ${C.primarySoft} 0%, transparent 60%)`,
					transform: `translate(-50%, -50%) translateY(${float}px)`,
					opacity: 0.8 * pulse,
				}}
			/>

			<div
				style={{
					position: "absolute",
					inset: "42px 54px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					fontFamily: mono,
					fontSize: 19,
					color: C.textMuted,
				}}
			>
				<div style={{display: "flex", alignItems: "center", gap: 14}}>
					<div
						style={{
							width: 26,
							height: 26,
							borderRadius: 7,
							background: `linear-gradient(135deg, ${C.primary}, #3b82f6)`,
						}}
					/>
					<span style={{color: C.text}}>
						HYPOTECHA<span style={{color: C.primary}}>.</span>video
					</span>
				</div>
				<span>
					HEDERA TESTNET · CHAIN 296 · {new Date(0).toISOString().split("T")[0]}
				</span>
			</div>

			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					gap: 40,
					paddingBottom: 40,
				}}
			>
				<div
					style={{
						opacity: titleIn,
						transform: `translateY(${titleY}px)`,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 22,
					}}
				>
					<div
						style={{
							fontFamily: mono,
							fontSize: 24,
							letterSpacing: 8,
							color: C.primary,
							border: `1px solid ${C.primarySoft}`,
							borderRadius: 9999,
							padding: "10px 26px",
							background: "rgba(16, 185, 129, 0.08)",
						}}
					>
						PROGRAMMATIC DEMO
					</div>
					<h1
						style={{
							margin: 0,
							fontFamily: mono,
							fontWeight: 800,
							fontSize: 168,
							letterSpacing: 6,
							lineHeight: 1,
							background: `linear-gradient(180deg, ${C.text} 20%, #7dd3fc 55%, ${C.primary} 100%)`,
							WebkitBackgroundClip: "text",
							backgroundClip: "text",
							color: "transparent",
						}}
					>
						HYPOTECHA
					</h1>
					<p
						style={{
							margin: 0,
							fontSize: 36,
							color: C.textMuted,
							letterSpacing: 2,
						}}
					>
						On-chain encumbrance enforcement for tokenized assets
					</p>
				</div>

				<div
					style={{
						width: 1100,
						height: 96,
						borderRadius: 18,
						border: `1px solid ${C.line}`,
						background: "rgba(2, 6, 23, 0.6)",
						display: "flex",
						overflow: "hidden",
						opacity: titleIn,
					}}
				>
					{segments.map((seg) => (
						<div
							key={seg.label}
							style={{
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								gap: 8,
								padding: "0 34px",
								width: `${seg.width}%`,
								borderRight: `1px solid ${C.line}`,
							}}
						>
							<span
								style={{
									fontFamily: mono,
									fontSize: 18,
									letterSpacing: 3,
									color: C.textMuted,
								}}
							>
								{seg.label}
							</span>
							<span
								style={{
									fontFamily: mono,
									fontSize: 30,
									fontWeight: 600,
									color: seg.color,
								}}
							>
								{seg.width}%
							</span>
						</div>
					))}
				</div>

				<div
					style={{
						display: "flex",
						gap: 22,
						opacity: titleIn,
					}}
				>
					<div style={chipStyles}>
						<span style={{color: C.primary}}>●</span> ATS holds lock the vault
					</div>
					<div style={chipStyles}>
						<span style={{color: "#3b82f6"}}>●</span> Chainlink live pricing
					</div>
					<div style={chipStyles}>
						<span style={{color: C.textMuted}}>●</span> No backend · pure EVM
					</div>
				</div>
			</div>

			<div
				style={{
					position: "absolute",
					inset: "auto 54px 42px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					fontFamily: mono,
					fontSize: 19,
					color: C.textMuted,
				}}
			>
				<span>1920 × 1080 · 30 FPS · 30s</span>
				<span>
					0:{Math.floor(frame / fps)
						.toString()
						.padStart(2, "0")}
				</span>
			</div>
		</AbsoluteFill>
	);
};