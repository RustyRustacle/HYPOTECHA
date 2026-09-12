import {Audio, Sequence, staticFile} from "remotion";

export const VOICEOVER_FILE = "audio/voiceover.mp3";
export const VOICEOVER_START_IN_FRAME = 0;
export const VOICEOVER_DURATION_IN_FRAMES = 900;

export const Voiceover: React.FC = () => {
	return (
		<Sequence
			name="Voiceover"
			from={VOICEOVER_START_IN_FRAME}
			durationInFrames={VOICEOVER_DURATION_IN_FRAMES}
		>
			<Audio src={staticFile(VOICEOVER_FILE)} />
		</Sequence>
	);
};